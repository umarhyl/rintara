"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import { applications, jobs, workProofs } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

const applicationNoteSchema = z
  .object({
    note: z
      .string()
      .trim()
      .min(20, "Tulis catatan minimal 20 karakter.")
      .max(1000, "Catatan lamaran maksimal 1000 karakter."),
  })
  .strict();

export async function submitApplication(jobId: string, input: unknown) {
  const context = await requireActiveUser();
  if (context.role !== "worker") {
    throw new ApplicationError("FORBIDDEN", "Only workers can apply to jobs.");
  }

  const parseResult = applicationNoteSchema.safeParse(input);
  if (!parseResult.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid application input.",
      parseResult.error.flatten().fieldErrors,
    );
  }

  const now = new Date();
  const { note } = parseResult.data;

  let result: { id: string; status: "submitted" | "accepted" | "rejected" | "withdrawn" };

  try {
    result = await db.transaction(async (tx) => {
    const [job] = await tx
      .select({
        id: jobs.id,
        employerId: jobs.employerId,
        categoryId: jobs.categoryId,
        status: jobs.status,
        visibility: jobs.visibility,
        applicationDeadline: jobs.applicationDeadline,
        isFirstOpportunity: jobs.isFirstOpportunity,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      throw new ApplicationError("JOB_NOT_FOUND", "Job not found.");
    }

    if (
      job.employerId === context.userId ||
      job.status !== "published" ||
      job.visibility !== "visible" ||
      job.applicationDeadline <= now
    ) {
      throw new ApplicationError(
        "JOB_NOT_AVAILABLE",
        "This job is no longer accepting applications.",
      );
    }

    const [existingApplication] = await tx
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.jobId, job.id),
          eq(applications.workerId, context.userId),
        ),
      )
      .limit(1);

    if (existingApplication) {
      throw new ApplicationError(
        "APPLICATION_ALREADY_EXISTS",
        "You have already applied to this job.",
      );
    }

    const [verifiedProof] = await tx
      .select({ id: workProofs.id })
      .from(workProofs)
      .where(
        and(
          eq(workProofs.workerId, context.userId),
          eq(workProofs.categoryId, job.categoryId),
          eq(workProofs.verificationStatus, "verified"),
          sql`${workProofs.revokedAt} is null`,
        ),
      )
      .limit(1);
    const firstOpportunityEligible = !verifiedProof;

    if (job.isFirstOpportunity && !firstOpportunityEligible) {
      throw new ApplicationError(
        "FIRST_OPPORTUNITY_INELIGIBLE",
        "This First Opportunity job is reserved for workers without verified proof in this category.",
      );
    }

    const [application] = await tx
      .insert(applications)
      .values({
        jobId: job.id,
        workerId: context.userId,
        note,
        firstOpportunityEligibleAtSubmission: firstOpportunityEligible,
      })
      .returning({ id: applications.id, status: applications.status });

      return application;
    });
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    if (isUniqueViolation(error, "applications_job_worker_unique")) {
      throw new ApplicationError(
        "APPLICATION_ALREADY_EXISTS",
        "You have already applied to this job.",
      );
    }
    throw error;
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/worker/applications");
  revalidatePath("/worker/dashboard");

  return {
    applicationId: result.id,
    status: result.status,
  };
}

function isUniqueViolation(error: unknown, constraintName: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "constraint_name" in error &&
    error.constraint_name === constraintName
  );
}

export async function withdrawApplication(applicationId: string) {
  const context = await requireActiveUser();
  if (context.role !== "worker") {
    throw new ApplicationError(
      "FORBIDDEN",
      "Only workers can withdraw applications.",
    );
  }

  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const [application] = await tx
      .select({
        id: applications.id,
        jobId: applications.jobId,
        status: applications.status,
      })
      .from(applications)
      .where(
        and(
          eq(applications.id, applicationId),
          eq(applications.workerId, context.userId),
        ),
      )
      .limit(1);

    if (!application) {
      throw new ApplicationError(
        "APPLICATION_NOT_FOUND",
        "Application not found.",
      );
    }

    if (application.status !== "submitted") {
      throw new ApplicationError(
        "APPLICATION_NOT_WITHDRAWABLE",
        "Only submitted applications can be withdrawn.",
      );
    }

    const [withdrawn] = await tx
      .update(applications)
      .set({ status: "withdrawn", withdrawnAt: now })
      .where(
        and(
          eq(applications.id, application.id),
          eq(applications.status, "submitted"),
        ),
      )
      .returning({
        id: applications.id,
        jobId: applications.jobId,
        status: applications.status,
      });

    if (!withdrawn) {
      throw new ApplicationError(
        "APPLICATION_NOT_WITHDRAWABLE",
        "Only submitted applications can be withdrawn.",
      );
    }

    return withdrawn;
  });

  revalidatePath(`/jobs/${result.jobId}`);
  revalidatePath("/worker/applications");
  revalidatePath("/worker/dashboard");

  return {
    applicationId: result.id,
    status: result.status,
  };
}
