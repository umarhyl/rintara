"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import {
  agreements,
  auditLogs,
  jobBoosts,
  jobs,
  notifications,
  opportunityCredits,
  reports,
  users,
  workProofs,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

const reportReasonSchema = z.enum([
  "suspicious_job",
  "terms_mismatch",
  "absence",
  "unsafe_behavior",
  "spam",
  "other",
]);

const createReportSchema = z
  .object({
    reason: reportReasonSchema,
    description: z.string().trim().max(2000).optional(),
    jobId: z.string().uuid().optional(),
    agreementId: z.string().uuid().optional(),
    reportedUserId: z.string().uuid().optional(),
  })
  .strict()
  .refine(
    (value) => value.jobId || value.agreementId || value.reportedUserId,
    "At least one report target is required.",
  );

const resolveReportSchema = z
  .object({
    reportId: z.string().uuid(),
    outcome: z.enum(["resolved", "rejected"]),
    moderatorNote: z.string().trim().min(10).max(2000),
    actions: z
      .object({
        hideJob: z.boolean().optional(),
        cancelJob: z.boolean().optional(),
        suspendUser: z.boolean().optional(),
        revokeWorkProofId: z.string().uuid().optional(),
        revokeCreditId: z.string().uuid().optional(),
        deactivateBoostId: z.string().uuid().optional(),
      })
      .optional(),
  })
  .strict();

export async function createReport(input: unknown) {
  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApplicationError("VALIDATION_FAILED", "Invalid report input.");
  }

  const actor = await requireActiveUser();
  const data = parsed.data;

  const allowed = await db.transaction(async (tx) => {
    if (data.agreementId) {
      const [agreement] = await tx
        .select({
          id: agreements.id,
          jobId: agreements.jobId,
          workerId: agreements.workerId,
          employerId: agreements.employerId,
        })
        .from(agreements)
        .where(eq(agreements.id, data.agreementId))
        .limit(1);
      if (
        !agreement ||
        !(
          actor.role === "admin" ||
          agreement.workerId === actor.userId ||
          agreement.employerId === actor.userId
        )
      ) {
        return null;
      }
      if (data.jobId && data.jobId !== agreement.jobId) {
        return null;
      }
      if (
        data.reportedUserId &&
        data.reportedUserId !== agreement.workerId &&
        data.reportedUserId !== agreement.employerId
      ) {
        return null;
      }
      return {
        jobId: agreement.jobId,
        agreementId: agreement.id,
        reportedUserId: data.reportedUserId,
      };
    }

    if (data.jobId) {
      const [job] = await tx
        .select({
          id: jobs.id,
          employerId: jobs.employerId,
          status: jobs.status,
          visibility: jobs.visibility,
        })
        .from(jobs)
        .where(eq(jobs.id, data.jobId))
        .limit(1);
      if (
        !job ||
        !(
          actor.role === "admin" ||
          job.employerId === actor.userId ||
          (job.status === "published" && job.visibility === "visible")
        )
      ) {
        return null;
      }
      return {
        jobId: job.id,
        agreementId: data.agreementId,
        reportedUserId: data.reportedUserId,
      };
    }

    if (data.reportedUserId) {
      const [target] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, data.reportedUserId))
        .limit(1);
      return target
        ? { jobId: data.jobId, agreementId: data.agreementId, reportedUserId: target.id }
        : null;
    }

    return null;
  });

  if (!allowed) {
    throw new ApplicationError("NOT_FOUND", "Report target was not found.");
  }

  const now = new Date();
  const [report] = await db
    .insert(reports)
    .values({
      reporterId: actor.userId,
      reason: data.reason,
      description: data.description?.trim() || null,
      jobId: allowed.jobId,
      agreementId: allowed.agreementId,
      reportedUserId: allowed.reportedUserId,
      status: "open",
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: reports.id, status: reports.status });

  await db.insert(auditLogs).values({
    actorId: actor.userId,
    action: "create_report",
    entityType: "report",
    entityId: report.id,
    requestId: actor.requestId,
    metadata: {
      reason: data.reason,
      jobId: allowed.jobId,
      agreementId: allowed.agreementId,
      reportedUserId: allowed.reportedUserId,
    },
    createdAt: now,
  });

  revalidatePath("/admin/reports");
  if (allowed.agreementId) {
    revalidatePath(`/worker/work/${allowed.agreementId}`);
    revalidatePath(`/employer/work/${allowed.agreementId}`);
  }

  return report;
}

export async function adminStartReportReview(reportId: string) {
  const actor = await requireActiveUser();
  if (actor.role !== "admin") {
    throw new ApplicationError("FORBIDDEN", "Only admins can review reports.");
  }
  const now = new Date();
  const [report] = await db
    .update(reports)
    .set({ status: "reviewing", moderatorId: actor.userId, updatedAt: now })
    .where(and(eq(reports.id, reportId), eq(reports.status, "open")))
    .returning({ id: reports.id });

  if (!report) {
    throw new ApplicationError("REPORT_NOT_FOUND", "Report was not found or already reviewed.");
  }

  revalidatePath("/admin/reports");
  return report;
}

export async function adminResolveReport(input: unknown) {
  const parsed = resolveReportSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApplicationError("VALIDATION_FAILED", "Invalid report resolution input.");
  }
  const actor = await requireActiveUser();
  if (actor.role !== "admin") {
    throw new ApplicationError("FORBIDDEN", "Only admins can resolve reports.");
  }

  const now = new Date();
  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    const [report] = await tx
      .select()
      .from(reports)
      .where(eq(reports.id, data.reportId))
      .limit(1)
      .for("update");

    if (!report) {
      throw new ApplicationError("REPORT_NOT_FOUND", "Report was not found.");
    }
    if (report.status !== "reviewing") {
      throw new ApplicationError("REPORT_NOT_REVIEWING", "Report must be under review.");
    }

    const actions = data.actions ?? {};
    if (data.outcome === "resolved") {
      if (actions.hideJob && report.jobId) {
        await tx
          .update(jobs)
          .set({
            visibility: "hidden",
            hiddenAt: now,
            hiddenBy: actor.userId,
            hiddenReason: data.moderatorNote,
            updatedAt: now,
          })
          .where(eq(jobs.id, report.jobId));
      }
      if (actions.cancelJob && report.jobId) {
        await tx
          .update(jobs)
          .set({
            status: "cancelled",
            cancelledAt: now,
            cancellationReason: data.moderatorNote,
            updatedAt: now,
          })
          .where(
            and(
              eq(jobs.id, report.jobId),
              inArray(jobs.status, ["draft", "published", "filled", "in_progress"]),
            ),
          );
      }
      if (actions.suspendUser && report.reportedUserId) {
        await tx
          .update(users)
          .set({ status: "suspended", updatedAt: now })
          .where(eq(users.id, report.reportedUserId));
      }
      if (actions.revokeWorkProofId) {
        await tx
          .update(workProofs)
          .set({
            verificationStatus: "revoked",
            revokedAt: now,
            revokedBy: actor.userId,
            revocationReason: data.moderatorNote,
          })
          .where(eq(workProofs.id, actions.revokeWorkProofId));
      }
      if (actions.revokeCreditId) {
        await tx
          .update(opportunityCredits)
          .set({
            status: "revoked",
            revokedAt: now,
            revokedBy: actor.userId,
            revocationReason: data.moderatorNote,
          })
          .where(eq(opportunityCredits.id, actions.revokeCreditId));
        await tx
          .update(jobBoosts)
          .set({ status: "revoked", revokedAt: now })
          .where(
            and(
              eq(jobBoosts.creditId, actions.revokeCreditId),
              eq(jobBoosts.status, "active"),
            ),
          );
      }
      if (actions.deactivateBoostId) {
        await tx
          .update(jobBoosts)
          .set({ status: "revoked", revokedAt: now })
          .where(eq(jobBoosts.id, actions.deactivateBoostId));
      }
    }

    const [updated] = await tx
      .update(reports)
      .set({
        status: data.outcome,
        moderatorId: actor.userId,
        moderatorNote: data.moderatorNote,
        resolvedAt: now,
        updatedAt: now,
      })
      .where(eq(reports.id, report.id))
      .returning({ id: reports.id, status: reports.status });

    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "resolve_report",
      entityType: "report",
      entityId: report.id,
      requestId: actor.requestId,
      metadata: { outcome: data.outcome, actions },
      createdAt: now,
    });

    if (report.reporterId) {
      await tx.insert(notifications).values({
        recipientId: report.reporterId,
        type: "report_resolved",
        title: "Laporan sudah diproses",
        body: "Moderator telah mencatat keputusan atas laporanmu.",
        entityType: "report",
        entityId: report.id,
        createdAt: now,
      });
    }

    return updated;
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/users");
  return result;
}
