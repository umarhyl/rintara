"use server";

import { revalidatePath } from "next/cache";
import { ApplicationError } from "@/server/errors/application-error";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import { jobs, jobPrivateDetails, wageGuidelines } from "@/server/db/schema";
import { eq, and, desc, lte, or, isNull, gt } from "drizzle-orm";
import { jobDraftSchema } from "./validation";
import { assertJobTransition } from "../lifecycle";

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).returning({ id: jobs.id });

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
    const [job] = await tx.select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.employerId, context.userId)))
      .limit(1);

    if (!job) {
      throw new ApplicationError("JOB_NOT_FOUND", "Job not found or not owned by you.");
    }

    if (job.status !== "draft") {
      throw new ApplicationError("JOB_NOT_DRAFT", "Job is not in draft state.");
    }

    // Check deadlines
    if (job.applicationDeadline >= job.startsAt) {
      throw new ApplicationError("VALIDATION_FAILED", "Application deadline must be before start time.");
    }
    if (job.startsAt <= new Date()) {
      throw new ApplicationError("VALIDATION_FAILED", "Start time must be in the future.");
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
      .limit(1);

    let wageStatus: "compliant" | "below" | "unavailable" = "unavailable";
    
    if (guideline) {
      if (job.wageAmount >= guideline.minimumAmount) {
        wageStatus = "compliant";
      } else {
        wageStatus = "below";
      }
    }

    // First Opportunity Rule
    if (job.isFirstOpportunity) {
      if (job.riskLevel !== "low") {
        throw new ApplicationError("CATEGORY_NOT_ALLOWED", "First Opportunity jobs must be low risk.");
      }
      if (wageStatus !== "compliant") {
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
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));
  });

  revalidatePath(`/employer/jobs/${jobId}`);
  revalidatePath("/employer/jobs");
  revalidatePath("/employer/dashboard");
  revalidatePath("/jobs"); // Revalidate public discovery
  return { ok: true };
}

export async function cancelJob(jobId: string) {
  const context = await requireActiveUser();
  if (context.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only employers can cancel jobs.");
  }

  await db.transaction(async (tx) => {
    const [job] = await tx.select({ status: jobs.status })
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
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));

    // Note: Cancelling an unfilled published job should reject remaining submitted applications
    if (job.status === "published") {
      const { applications } = await import("@/server/db/schema/jobs");
      await tx.update(applications)
        .set({
          status: "rejected",
          decidedAt: new Date(),
        })
        .where(and(
          eq(applications.jobId, jobId),
          eq(applications.status, "submitted")
        ));
    }
  });

  revalidatePath(`/employer/jobs/${jobId}`);
  revalidatePath("/employer/jobs");
  revalidatePath("/employer/dashboard");
  revalidatePath("/jobs"); 
  return { ok: true };
}
