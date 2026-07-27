"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import {
  agreements,
  applications,
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
const reportIdSchema = z.string().uuid();

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
      if (
        data.reportedUserId &&
        data.reportedUserId !== job.employerId
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
      if (actor.role !== "admin") {
        return null;
      }
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

  const report = await db.transaction(async (tx) => {
    const now = new Date();
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, actor.userId))
      .limit(1)
      .for("update");

    const recentReports = await tx
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.reporterId, actor.userId),
          gte(reports.createdAt, new Date(now.getTime() - 60_000)),
        ),
      )
      .limit(3);

    if (recentReports.length >= 3) {
      throw new ApplicationError(
        "RATE_LIMITED",
        "Too many reports were submitted. Try again later.",
      );
    }

    const [duplicate] = await tx
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.reporterId, actor.userId),
          inArray(reports.status, ["open", "reviewing"]),
          allowed.jobId
            ? eq(reports.jobId, allowed.jobId)
            : isNull(reports.jobId),
          allowed.agreementId
            ? eq(reports.agreementId, allowed.agreementId)
            : isNull(reports.agreementId),
          allowed.reportedUserId
            ? eq(reports.reportedUserId, allowed.reportedUserId)
            : isNull(reports.reportedUserId),
        ),
      )
      .limit(1);

    if (duplicate) {
      throw new ApplicationError(
        "REPORT_ALREADY_EXISTS",
        "An active report already exists for this target.",
      );
    }

    const [createdReport] = await tx
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

    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "create_report",
      entityType: "report",
      entityId: createdReport.id,
      requestId: actor.requestId,
      metadata: {
        reason: data.reason,
        jobId: allowed.jobId,
        agreementId: allowed.agreementId,
        reportedUserId: allowed.reportedUserId,
      },
      createdAt: now,
    });

    return createdReport;
  });

  revalidatePath("/admin/reports");
  if (allowed.agreementId) {
    revalidatePath(`/worker/work/${allowed.agreementId}`);
    revalidatePath(`/employer/work/${allowed.agreementId}`);
  }

  return report;
}

export async function adminStartReportReview(reportIdInput: unknown) {
  const parsedReportId = reportIdSchema.safeParse(reportIdInput);
  if (!parsedReportId.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid report identifier.",
    );
  }
  const actor = await requireActiveUser();
  if (actor.role !== "admin") {
    throw new ApplicationError("FORBIDDEN", "Only admins can review reports.");
  }
  const report = await db.transaction(async (tx) => {
    const now = new Date();
    const [updatedReport] = await tx
      .update(reports)
      .set({ status: "reviewing", moderatorId: actor.userId, updatedAt: now })
      .where(
        and(
          eq(reports.id, parsedReportId.data),
          eq(reports.status, "open"),
        ),
      )
      .returning({ id: reports.id });

    if (!updatedReport) {
      throw new ApplicationError(
        "REPORT_NOT_FOUND",
        "Report was not found or already reviewed.",
      );
    }

    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "start_report_review",
      entityType: "report",
      entityId: updatedReport.id,
      requestId: actor.requestId,
      metadata: { previousStatus: "open", newStatus: "reviewing" },
      createdAt: now,
    });

    return updatedReport;
  });

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
    const [relatedAgreement] = report.agreementId
      ? await tx
          .select({
            id: agreements.id,
            jobId: agreements.jobId,
            workerId: agreements.workerId,
            employerId: agreements.employerId,
            status: agreements.status,
          })
          .from(agreements)
          .where(eq(agreements.id, report.agreementId))
          .limit(1)
      : report.jobId
        ? await tx
            .select({
              id: agreements.id,
              jobId: agreements.jobId,
              workerId: agreements.workerId,
              employerId: agreements.employerId,
              status: agreements.status,
            })
            .from(agreements)
            .where(eq(agreements.jobId, report.jobId))
            .limit(1)
        : [];
    const relatedJobId = report.jobId ?? relatedAgreement?.jobId ?? null;

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
        const [job] = await tx
          .select({ id: jobs.id, status: jobs.status, title: jobs.title })
          .from(jobs)
          .where(eq(jobs.id, report.jobId))
          .limit(1)
          .for("update");

        if (
          !job ||
          !["draft", "published", "filled", "in_progress"].includes(job.status)
        ) {
          throw new ApplicationError(
            "INVALID_STATE_TRANSITION",
            "The reported job cannot be cancelled from its current state.",
          );
        }

        await tx
          .update(jobs)
          .set({
            status: "cancelled",
            cancelledAt: now,
            cancellationReason: data.moderatorNote,
            updatedAt: now,
          })
          .where(eq(jobs.id, report.jobId));

        if (job.status === "published") {
          const rejectedApplications = await tx
            .update(applications)
            .set({ status: "rejected", decidedAt: now })
            .where(
              and(
                eq(applications.jobId, job.id),
                eq(applications.status, "submitted"),
              ),
            )
            .returning({
              id: applications.id,
              workerId: applications.workerId,
            });

          if (rejectedApplications.length > 0) {
            await tx.insert(notifications).values(
              rejectedApplications.map((application) => ({
                recipientId: application.workerId,
                type: "job_cancelled",
                title: "Pekerjaan dibatalkan",
                body: `Pekerjaan "${job.title}" dibatalkan setelah peninjauan laporan.`,
                entityType: "job",
                entityId: job.id,
                createdAt: now,
              })),
            );
          }
        }

        if (
          relatedAgreement &&
          (relatedAgreement.status === "pending_confirmation" ||
            relatedAgreement.status === "active")
        ) {
          await tx
            .update(agreements)
            .set({
              status: "cancelled",
              cancelledAt: now,
              cancellationReason: data.moderatorNote,
              updatedAt: now,
            })
            .where(eq(agreements.id, relatedAgreement.id));

          await tx.insert(notifications).values(
            [relatedAgreement.workerId, relatedAgreement.employerId].map(
              (recipientId) => ({
                recipientId,
                type: "agreement_cancelled",
                title: "Alur pekerjaan dibatalkan",
                body: "Mini Agreement dibatalkan setelah peninjauan laporan.",
                entityType: "agreement",
                entityId: relatedAgreement.id,
                createdAt: now,
              }),
            ),
          );
        }
      }
      if (actions.suspendUser && report.reportedUserId) {
        await tx
          .update(users)
          .set({ status: "suspended", updatedAt: now })
          .where(eq(users.id, report.reportedUserId));
      }
      if (actions.revokeWorkProofId) {
        const [proof] = await tx
          .select({
            id: workProofs.id,
            agreementId: workProofs.agreementId,
            workerId: workProofs.workerId,
            employerId: workProofs.employerId,
            jobId: agreements.jobId,
          })
          .from(workProofs)
          .innerJoin(agreements, eq(workProofs.agreementId, agreements.id))
          .where(eq(workProofs.id, actions.revokeWorkProofId))
          .limit(1);

        if (
          !proof ||
          !(
            (relatedJobId && proof.jobId === relatedJobId) ||
            (report.reportedUserId &&
              (proof.workerId === report.reportedUserId ||
                proof.employerId === report.reportedUserId))
          )
        ) {
          throw new ApplicationError(
            "VALIDATION_FAILED",
            "The Work Proof is not related to this report.",
          );
        }

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
        const [credit] = await tx
          .select({
            id: opportunityCredits.id,
            employerId: opportunityCredits.employerId,
            sourceJobId: opportunityCredits.sourceJobId,
            targetJobId: opportunityCredits.targetJobId,
          })
          .from(opportunityCredits)
          .where(eq(opportunityCredits.id, actions.revokeCreditId))
          .limit(1);

        if (
          !credit ||
          !(
            (relatedJobId &&
              (credit.sourceJobId === relatedJobId ||
                credit.targetJobId === relatedJobId)) ||
            (report.reportedUserId &&
              credit.employerId === report.reportedUserId)
          )
        ) {
          throw new ApplicationError(
            "VALIDATION_FAILED",
            "The Opportunity Credit is not related to this report.",
          );
        }

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
        const [boost] = await tx
          .select({
            id: jobBoosts.id,
            jobId: jobBoosts.jobId,
            employerId: jobs.employerId,
          })
          .from(jobBoosts)
          .innerJoin(jobs, eq(jobBoosts.jobId, jobs.id))
          .where(eq(jobBoosts.id, actions.deactivateBoostId))
          .limit(1);

        if (
          !boost ||
          !(
            (relatedJobId && boost.jobId === relatedJobId) ||
            (report.reportedUserId &&
              boost.employerId === report.reportedUserId)
          )
        ) {
          throw new ApplicationError(
            "VALIDATION_FAILED",
            "The Job Boost is not related to this report.",
          );
        }

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
