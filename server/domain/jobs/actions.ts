"use server";

import { revalidatePath } from "next/cache";
import { ApplicationError } from "@/server/errors/application-error";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import {
  applications,
  areas,
  auditLogs,
  categories,
  jobs,
  jobPrivateDetails,
  notifications,
  wageGuidelines,
} from "@/server/db/schema";
import { eq, and, desc, lte, or, isNull, gt } from "drizzle-orm";
import { z } from "zod";
import { jobDraftSchema } from "./validation";
import { assertJobTransition } from "../lifecycle";

const cancelJobSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(10, "Tulis alasan pembatalan minimal 10 karakter.")
      .max(500, "Alasan pembatalan maksimal 500 karakter."),
  })
  .strict();

export async function createJobDraft(input: unknown) {
  const context = await requireActiveUser();
  if (context.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only employers can create jobs.");
  }

  const parseResult = jobDraftSchema.safeParse(input);
  if (!parseResult.success) {
    throw new ApplicationError("VALIDATION_FAILED", "Invalid job draft input.", parseResult.error.flatten().fieldErrors);
  }

  const data = parseResult.data;

  // Insert job and private details transactionally
  const result = await db.transaction(async (tx) => {
    const [newJob] = await tx.insert(jobs).values({
      employerId: context.userId,
      categoryId: data.categoryId,
      areaId: data.areaId,
      title: data.title,
      description: data.description,
      taskScope: data.taskScope,
      publicLocationLabel: data.publicLocationLabel,
      startsAt: data.startsAt,
      estimatedMinutes: data.estimatedMinutes,
      wageAmount: BigInt(data.wageAmount),
      wageUnit: data.wageUnit,
      paymentMethod: data.paymentMethod,
      paymentTiming: data.paymentTiming,
      toolsProvided: data.toolsProvided,
      toolsRequired: data.toolsRequired,
      riskLevel: data.riskLevel,
      isFirstOpportunity: data.isFirstOpportunity,
      applicationDeadline: data.applicationDeadline,
      status: "draft",
      visibility: "hidden", // Drafts are hidden by default
      hiddenAt: new Date(),
      hiddenBy: context.userId,
      hiddenReason: "draft",
    }).returning({ id: jobs.id });

    await tx.insert(jobPrivateDetails).values({
      jobId: newJob.id,
      fullAddress: data.fullAddress,
    });

    return newJob;
  });

  revalidatePath("/employer/jobs");
  return { jobId: result.id, status: "draft" as const };
}

export async function updateJobDraft(jobId: string, input: unknown) {
  const context = await requireActiveUser();
  if (context.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only employers can update jobs.");
  }

  const parseResult = jobDraftSchema.safeParse(input);
  if (!parseResult.success) {
    throw new ApplicationError("VALIDATION_FAILED", "Invalid job draft input.", parseResult.error.flatten().fieldErrors);
  }

  const data = parseResult.data;

  await db.transaction(async (tx) => {
    const [existingJob] = await tx.select({ status: jobs.status })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.employerId, context.userId)))
      .limit(1);

    if (!existingJob) {
      throw new ApplicationError("JOB_NOT_FOUND", "Job not found or not owned by you.");
    }

    if (existingJob.status !== "draft") {
      throw new ApplicationError("JOB_NOT_DRAFT", "Only draft jobs can be updated with this action.");
    }

    await tx.update(jobs)
      .set({
        categoryId: data.categoryId,
        areaId: data.areaId,
        title: data.title,
        description: data.description,
        taskScope: data.taskScope,
        publicLocationLabel: data.publicLocationLabel,
        startsAt: data.startsAt,
        estimatedMinutes: data.estimatedMinutes,
        wageAmount: BigInt(data.wageAmount),
        wageUnit: data.wageUnit,
        paymentMethod: data.paymentMethod,
        paymentTiming: data.paymentTiming,
        toolsProvided: data.toolsProvided,
        toolsRequired: data.toolsRequired,
        riskLevel: data.riskLevel,
        isFirstOpportunity: data.isFirstOpportunity,
        applicationDeadline: data.applicationDeadline,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));

    await tx.update(jobPrivateDetails)
      .set({
        fullAddress: data.fullAddress,
        updatedAt: new Date(),
      })
      .where(eq(jobPrivateDetails.jobId, jobId));
  });

  revalidatePath(`/employer/jobs/${jobId}`);
  revalidatePath("/employer/jobs");
  return { ok: true };
}

export async function publishJob(jobId: string) {
  const context = await requireActiveUser();
  if (context.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only employers can publish jobs.");
  }

  await db.transaction(async (tx) => {
    const now = new Date();
    const [job] = await tx.select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.employerId, context.userId)))
      .limit(1)
      .for("update");

    if (!job) {
      throw new ApplicationError("JOB_NOT_FOUND", "Job not found or not owned by you.");
    }

    if (job.status !== "draft") {
      throw new ApplicationError("JOB_NOT_DRAFT", "Job is not in draft state.");
    }

    if (job.applicationDeadline >= job.startsAt) {
      throw new ApplicationError("VALIDATION_FAILED", "Application deadline must be before start time.");
    }
    if (job.applicationDeadline <= now) {
      throw new ApplicationError("VALIDATION_FAILED", "Application deadline must be in the future.");
    }
    if (job.startsAt <= now) {
      throw new ApplicationError("VALIDATION_FAILED", "Start time must be in the future.");
    }

    const [reference] = await tx
      .select({
        categoryRiskLevel: categories.riskLevel,
        categoryFirstOpportunityAllowed: categories.firstOpportunityAllowed,
        categoryIsActive: categories.isActive,
        areaLevel: areas.level,
        areaIsActive: areas.isActive,
      })
      .from(categories)
      .innerJoin(areas, eq(areas.id, job.areaId))
      .where(eq(categories.id, job.categoryId))
      .limit(1)
      .for("share");

    if (!reference?.categoryIsActive) {
      throw new ApplicationError("CATEGORY_NOT_ALLOWED", "The selected category is not available.");
    }
    if (!reference.areaIsActive || reference.areaLevel !== "city_regency") {
      throw new ApplicationError(
        "VALIDATION_FAILED",
        "The selected area is not an active city or regency.",
        { areaId: ["Select an active city or regency."] },
      );
    }

    const guidelineDate = job.startsAt.toISOString().slice(0, 10);
    const [guideline] = await tx.select()
      .from(wageGuidelines)
      .where(and(
        eq(wageGuidelines.categoryId, job.categoryId),
        eq(wageGuidelines.areaId, job.areaId),
        eq(wageGuidelines.unit, job.wageUnit),
        eq(wageGuidelines.isActive, true),
        lte(wageGuidelines.effectiveFrom, guidelineDate),
        or(isNull(wageGuidelines.effectiveTo), gt(wageGuidelines.effectiveTo, guidelineDate))!
      ))
      .orderBy(desc(wageGuidelines.effectiveFrom), desc(wageGuidelines.createdAt))
      .limit(1)
      .for("share");

    let wageStatus: "compliant" | "below" | "unavailable" = "unavailable";
    
    if (guideline) {
      if (job.wageAmount >= guideline.minimumAmount) {
        wageStatus = "compliant";
      } else {
        wageStatus = "below";
      }
    }

    if (job.isFirstOpportunity) {
      if (
        !reference.categoryFirstOpportunityAllowed ||
        reference.categoryRiskLevel !== "low"
      ) {
        throw new ApplicationError("CATEGORY_NOT_ALLOWED", "This category does not allow First Opportunity jobs.");
      }
      if (wageStatus === "unavailable") {
        throw new ApplicationError("WAGE_GUIDELINE_UNAVAILABLE", "No active wage guideline is available for this job.");
      }
      if (wageStatus === "below") {
        throw new ApplicationError("WAGE_BELOW_GUIDELINE", "First Opportunity jobs must meet minimum wage guidelines.");
      }
    }

    assertJobTransition(job.status, "published");

    await tx.update(jobs)
      .set({
        status: "published",
        visibility: "visible",
        hiddenAt: null,
        hiddenBy: null,
        hiddenReason: null,
        wageStatus,
        riskLevel: reference.categoryRiskLevel,
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    await tx.insert(auditLogs).values({
      actorId: context.userId,
      action: "publish_job",
      entityType: "job",
      entityId: jobId,
      requestId: context.requestId,
      metadata: {
        previousStatus: job.status,
        newStatus: "published",
        wageStatus,
        isFirstOpportunity: job.isFirstOpportunity,
      },
      createdAt: now,
    });
  });

  revalidatePath(`/employer/jobs/${jobId}`);
  revalidatePath("/employer/jobs");
  revalidatePath("/employer/dashboard");
  revalidatePath("/jobs"); // Revalidate public discovery
  return { ok: true };
}

export async function cancelJob(jobId: string, input: unknown) {
  const context = await requireActiveUser();
  if (context.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only employers can cancel jobs.");
  }

  const parseResult = cancelJobSchema.safeParse(input);
  if (!parseResult.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid cancellation input.",
      parseResult.error.flatten().fieldErrors,
    );
  }

  const { reason } = parseResult.data;
  const now = new Date();

  await db.transaction(async (tx) => {
    const [job] = await tx.select({ status: jobs.status, title: jobs.title })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.employerId, context.userId)))
      .limit(1);

    if (!job) {
      throw new ApplicationError("JOB_NOT_FOUND", "Job not found or not owned by you.");
    }

    assertJobTransition(job.status, "cancelled");

    await tx.update(jobs)
      .set({
        status: "cancelled",
        cancelledAt: now,
        cancellationReason: reason,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    let rejectedApplicationCount = 0;

    if (job.status === "published") {
      const rejectedApplications = await tx.update(applications)
        .set({
          status: "rejected",
          decidedAt: now,
        })
        .where(and(
          eq(applications.jobId, jobId),
          eq(applications.status, "submitted")
        ))
        .returning({
          id: applications.id,
          workerId: applications.workerId,
        });

      rejectedApplicationCount = rejectedApplications.length;

      if (rejectedApplications.length > 0) {
        await tx.insert(notifications).values(
          rejectedApplications.map((application) => ({
            recipientId: application.workerId,
            type: "job_cancelled",
            title: "Pekerjaan dibatalkan",
            body: `Pekerjaan "${job.title}" dibatalkan oleh pemberi kerja. Lamaran aktifmu ditutup tanpa menghapus riwayat.`,
            entityType: "job",
            entityId: jobId,
            createdAt: now,
          })),
        );
      }
    }

    await tx.insert(auditLogs).values({
      actorId: context.userId,
      action: "cancel_job",
      entityType: "job",
      entityId: jobId,
      requestId: context.requestId,
      metadata: {
        previousStatus: job.status,
        rejectedApplicationCount,
      },
      createdAt: now,
    });
  });

  revalidatePath(`/employer/jobs/${jobId}`);
  revalidatePath("/employer/jobs");
  revalidatePath("/employer/dashboard");
  revalidatePath("/jobs"); 
  return { ok: true };
}
