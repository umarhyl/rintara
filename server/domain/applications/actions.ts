"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import {
  agreements,
  applications,
  auditLogs,
  jobs,
  notifications,
  workProofs,
} from "@/server/db/schema";
import type { AgreementTermsSnapshot } from "@/server/db/schema";
import { getJobSelectionCutoff } from "@/server/domain/jobs/selection-cutoff";
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

const applicationIdSchema = z.string().uuid();

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
  const databaseError = getDatabaseError(error);

  return (
    databaseError?.code === "23505" &&
    databaseError.constraintName === constraintName
  );
}

function getDatabaseError(error: unknown):
  | {
      code?: unknown;
      constraintName?: unknown;
    }
  | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const candidate = error as {
    code?: unknown;
    constraint_name?: unknown;
    constraint?: unknown;
    cause?: unknown;
  };

  if (typeof candidate.code === "string") {
    return {
      code: candidate.code,
      constraintName: candidate.constraint_name ?? candidate.constraint,
    };
  }

  return getDatabaseError(candidate.cause);
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

type AcceptApplicationResult = {
  jobId: string;
  applicationId: string;
  agreementId: string;
  jobStatus: "filled";
  agreementStatus: "pending_confirmation";
};

type AcceptApplicationRow = {
  application_id: string;
  application_status: "submitted" | "accepted" | "rejected" | "withdrawn";
  worker_id: string;
  job_id: string;
  employer_id: string;
  category_id: string;
  category_name: string;
  area_name: string;
  job_title: string;
  task_scope: string;
  public_location_label: string;
  full_address: string;
  arrival_instructions: string | null;
  starts_at: Date | string;
  estimated_minutes: number;
  wage_amount: bigint;
  wage_unit: "hour" | "day" | "job";
  wage_status: "compliant" | "below" | "unavailable";
  payment_method: string;
  payment_timing: string;
  tools_provided: string | null;
  tools_required: string | null;
  is_first_opportunity: boolean;
  job_status: "draft" | "published" | "filled" | "in_progress" | "completed" | "expired" | "cancelled";
};

function buildAgreementSnapshot(row: AcceptApplicationRow): AgreementTermsSnapshot {
  return {
    title: row.job_title,
    categoryId: row.category_id,
    categoryName: row.category_name,
    taskScope: row.task_scope,
    generalArea: row.public_location_label || row.area_name,
    fullAddress: row.full_address,
    arrivalInstructions: row.arrival_instructions,
    startsAt: toSnapshotIsoTimestamp(row.starts_at),
    estimatedMinutes: row.estimated_minutes,
    wageAmount: row.wage_amount.toString(),
    wageUnit: row.wage_unit,
    paymentMethod: row.payment_method,
    paymentTiming: row.payment_timing,
    toolsProvided: row.tools_provided,
    toolsRequired: row.tools_required,
    cancellationWording: "Batalkan melalui alur berwenang.",
  };
}

function toSnapshotIsoTimestamp(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

export async function acceptApplication(
  applicationIdInput: unknown,
): Promise<AcceptApplicationResult> {
  const parsedId = applicationIdSchema.safeParse(applicationIdInput);
  if (!parsedId.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "The application identifier is invalid.",
      { applicationId: ["Use a valid application identifier."] },
    );
  }

  const context = await requireActiveUser();
  if (context.role !== "employer") {
    throw new ApplicationError(
      "FORBIDDEN",
      "Only employers can accept applications.",
    );
  }
  let result: AcceptApplicationResult;

  try {
    result = await db.transaction(async (tx) => {
      const lockedRows = await tx.execute<AcceptApplicationRow>(sql`
        select
          a.id as application_id,
          a.status as application_status,
          a.worker_id,
          j.id as job_id,
          j.employer_id,
          j.category_id,
          c.name as category_name,
          ar.name as area_name,
          j.title as job_title,
          j.task_scope,
          j.public_location_label,
          jpd.full_address,
          jpd.arrival_instructions,
          j.starts_at,
          j.estimated_minutes,
          j.wage_amount,
          j.wage_unit,
          j.wage_status,
          j.payment_method,
          j.payment_timing,
          j.tools_provided,
          j.tools_required,
          j.is_first_opportunity,
          j.status as job_status
        from applications a
        inner join jobs j on j.id = a.job_id
        inner join categories c on c.id = j.category_id
        inner join areas ar on ar.id = j.area_id
        inner join job_private_details jpd on jpd.job_id = j.id
        where a.id = ${parsedId.data}
        for update of a, j
      `);

      const row = lockedRows[0];
      if (!row) {
        throw new ApplicationError(
          "APPLICATION_NOT_FOUND",
          "Application not found.",
        );
      }

      if (row.employer_id !== context.userId) {
        throw new ApplicationError(
          "JOB_NOT_FOUND",
          "Job not found or not owned by you.",
        );
      }

      if (row.application_status !== "submitted") {
        throw new ApplicationError(
          "APPLICATION_NOT_SUBMITTED",
          "Only submitted applications can be accepted.",
        );
      }

      if (row.job_status !== "published") {
        throw new ApplicationError(
          "JOB_NOT_AVAILABLE",
          "This job is no longer available for acceptance.",
        );
      }

      const now = new Date();
      const startsAt =
        row.starts_at instanceof Date
          ? row.starts_at
          : new Date(row.starts_at);

      if (now >= getJobSelectionCutoff(startsAt)) {
        throw new ApplicationError(
          "JOB_NOT_AVAILABLE",
          "The worker selection period has closed.",
        );
      }

      const [verifiedProof] = await tx
        .select({ id: workProofs.id })
        .from(workProofs)
        .where(
          and(
            eq(workProofs.workerId, row.worker_id),
            eq(workProofs.categoryId, row.category_id),
            eq(workProofs.verificationStatus, "verified"),
            sql`${workProofs.revokedAt} is null`,
          ),
        )
        .limit(1);

      if (row.is_first_opportunity && verifiedProof) {
        throw new ApplicationError(
          "FIRST_OPPORTUNITY_INELIGIBLE",
          "This worker is no longer eligible for a First Opportunity in this category.",
        );
      }

      const [acceptedApplication] = await tx
        .update(applications)
        .set({ status: "accepted", decidedAt: now })
        .where(
          and(
            eq(applications.id, row.application_id),
            eq(applications.status, "submitted"),
          ),
        )
        .returning({ id: applications.id });

      if (!acceptedApplication) {
        throw new ApplicationError(
          "CONCURRENT_ACCEPTANCE_CONFLICT",
          "Another acceptance changed this application first.",
        );
      }

      const rejectedApplications = await tx
        .update(applications)
        .set({ status: "rejected", decidedAt: now })
        .where(
          and(
            eq(applications.jobId, row.job_id),
            eq(applications.status, "submitted"),
            ne(applications.id, row.application_id),
          ),
        )
        .returning({
          id: applications.id,
          workerId: applications.workerId,
        });

      const [filledJob] = await tx
        .update(jobs)
        .set({ status: "filled", updatedAt: now })
        .where(
          and(eq(jobs.id, row.job_id), eq(jobs.status, "published")),
        )
        .returning({ id: jobs.id, status: jobs.status });

      if (!filledJob) {
        throw new ApplicationError(
          "CONCURRENT_ACCEPTANCE_CONFLICT",
          "Another acceptance filled this job first.",
        );
      }

      const [agreement] = await tx
        .insert(agreements)
        .values({
          applicationId: row.application_id,
          jobId: row.job_id,
          workerId: row.worker_id,
          employerId: row.employer_id,
          termsSnapshot: buildAgreementSnapshot(row),
          isFirstOpportunity: row.is_first_opportunity && !verifiedProof,
          wageStatus: row.wage_status,
          status: "pending_confirmation",
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: agreements.id, status: agreements.status });

      await tx.insert(notifications).values([
        {
          recipientId: row.worker_id,
          type: "application_accepted",
          title: "Lamaran diterima",
          body: "Pemberi kerja menerima lamaranmu. Konfirmasi Mini Agreement untuk melanjutkan.",
          entityType: "agreement",
          entityId: agreement.id,
          createdAt: now,
        },
        {
          recipientId: row.employer_id,
          type: "agreement_confirmation_requested",
          title: "Mini Agreement siap dikonfirmasi",
          body: "Satu pekerja sudah diterima. Konfirmasi Mini Agreement untuk mengaktifkan pekerjaan.",
          entityType: "agreement",
          entityId: agreement.id,
          createdAt: now,
        },
        ...rejectedApplications.map((application) => ({
          recipientId: application.workerId,
          type: "application_rejected",
          title: "Lamaran belum terpilih",
          body: "Pemberi kerja sudah memilih satu pekerja untuk pekerjaan ini.",
          entityType: "application",
          entityId: application.id,
          createdAt: now,
        })),
      ]);

      await tx.insert(auditLogs).values({
        actorId: context.userId,
        action: "accept_application",
        entityType: "application",
        entityId: row.application_id,
        requestId: context.requestId,
        metadata: {
          jobId: row.job_id,
          agreementId: agreement.id,
          workerId: row.worker_id,
          isFirstOpportunity: row.is_first_opportunity,
          rejectedApplicationCount: rejectedApplications.length,
        },
        createdAt: now,
      });

      return {
        jobId: filledJob.id,
        applicationId: row.application_id,
        agreementId: agreement.id,
        jobStatus: "filled",
        agreementStatus: "pending_confirmation",
      };
    });
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    if (
      isUniqueViolation(error, "applications_one_accepted_per_job") ||
      isUniqueViolation(error, "agreements_application_unique") ||
      isUniqueViolation(error, "agreements_job_unique")
    ) {
      throw new ApplicationError(
        "CONCURRENT_ACCEPTANCE_CONFLICT",
        "Another acceptance filled this job first.",
      );
    }
    throw error;
  }

  revalidatePath(`/employer/jobs/${result.jobId}`);
  revalidatePath(`/employer/jobs/${result.jobId}/applicants`);
  revalidatePath(`/employer/agreements/${result.agreementId}`);
  revalidatePath("/employer/jobs");
  revalidatePath("/employer/dashboard");
  revalidatePath("/jobs");
  revalidatePath("/worker/applications");
  revalidatePath(`/worker/agreements/${result.agreementId}`);

  return result;
}
