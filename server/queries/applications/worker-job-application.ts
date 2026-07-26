import "server-only";

import { and, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { z } from "zod";

import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  agreements,
  applications,
  jobs,
  workProofs,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

type WorkerJobApplicationDatabase = PostgresJsDatabase<typeof schema>;

type ApplicationStatus =
  | "submitted"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type WorkerJobApplicationState =
  | { state: "eligible" }
  | {
      state: "existing";
      applicationStatus: ApplicationStatus;
      agreementId?: string;
    }
  | { state: "ineligible" }
  | { state: "unavailable" };

const jobIdSchema = z.string().uuid();

function parseJobId(value: unknown) {
  const result = jobIdSchema.safeParse(value);

  if (!result.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid job identifier.",
      { jobId: ["The job identifier must be a valid UUID."] },
    );
  }

  return result.data;
}

export async function getWorkerJobApplicationState(
  jobId: string,
  context?: RequestContext,
  database: WorkerJobApplicationDatabase = db,
  now: Date = new Date(),
): Promise<WorkerJobApplicationState> {
  const parsedJobId = parseJobId(jobId);
  const actor = assertRole(
    assertActiveUser(context ?? (await requireActiveUser())),
    "worker",
  );
  const hasVerifiedProofInCategory = sql<boolean>`exists (
    select 1
    from ${workProofs}
    where ${workProofs.workerId} = ${actor.userId}
      and ${workProofs.categoryId} = ${jobs.categoryId}
      and ${workProofs.verificationStatus} = 'verified'
      and ${workProofs.revokedAt} is null
  )`;

  // One statement gives the presentation layer a coherent snapshot. The
  // submit command still revalidates every rule inside its transaction.
  const [row] = await database
    .select({
      employerId: jobs.employerId,
      status: jobs.status,
      visibility: jobs.visibility,
      applicationDeadline: jobs.applicationDeadline,
      isFirstOpportunity: jobs.isFirstOpportunity,
      applicationId: applications.id,
      applicationStatus: applications.status,
      agreementId: agreements.id,
      hasVerifiedProofInCategory,
    })
    .from(jobs)
    .leftJoin(
      applications,
      and(
        eq(applications.jobId, jobs.id),
        eq(applications.workerId, actor.userId),
      ),
    )
    .leftJoin(
      agreements,
      eq(agreements.applicationId, applications.id),
    )
    .where(eq(jobs.id, parsedJobId))
    .limit(1);

  if (!row) {
    return { state: "unavailable" };
  }

  if (row.applicationId && row.applicationStatus) {
    return {
      state: "existing",
      applicationStatus: row.applicationStatus,
      ...(row.agreementId ? { agreementId: row.agreementId } : {}),
    };
  }

  const acceptsApplications =
    row.employerId !== actor.userId &&
    row.status === "published" &&
    row.visibility === "visible" &&
    row.applicationDeadline > now;

  if (!acceptsApplications) {
    return { state: "unavailable" };
  }

  if (row.isFirstOpportunity && row.hasVerifiedProofInCategory) {
    return { state: "ineligible" };
  }

  return { state: "eligible" };
}
