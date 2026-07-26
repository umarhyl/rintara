import "server-only";

import { Buffer } from "node:buffer";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  agreements,
  applications,
  areas,
  categories,
  jobs,
  jobPrivateDetails,
} from "@/server/db/schema";
import { and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { ApplicationError } from "@/server/errors/application-error";

type EmployerJobsDatabase = PostgresJsDatabase<typeof schema>;

export type EmployerJobListInput = {
  cursor?: string;
  limit?: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeLimit(limit: number | undefined) {
  return Number.isInteger(limit) && limit && limit > 0
    ? Math.min(limit, MAX_LIMIT)
    : DEFAULT_LIMIT;
}

function invalidCursor(): never {
  throw new ApplicationError(
    "VALIDATION_FAILED",
    "Invalid pagination cursor.",
    { cursor: ["The pagination cursor is malformed."] },
  );
}

function decodeCursor(value: string | undefined) {
  if (!value) return null;

  try {
    if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) invalidCursor();

    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) invalidCursor();

    const parsed: unknown = JSON.parse(decoded.toString("utf8"));
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 2 ||
      typeof parsed[0] !== "string" ||
      typeof parsed[1] !== "string" ||
      !UUID_PATTERN.test(parsed[1])
    ) {
      invalidCursor();
    }

    const createdAt = new Date(parsed[0]);
    if (
      Number.isNaN(createdAt.getTime()) ||
      createdAt.toISOString() !== parsed[0]
    ) {
      invalidCursor();
    }

    return { createdAt, id: parsed[1] };
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    invalidCursor();
  }
}

function encodeCursor(row: { createdAt: Date; id: string }) {
  return Buffer.from(
    JSON.stringify([row.createdAt.toISOString(), row.id]),
    "utf8",
  ).toString("base64url");
}

async function requireEmployerJobReader(context?: RequestContext) {
  const actor = assertActiveUser(context ?? (await requireActiveUser()));
  if (actor.role !== "employer" && actor.role !== "admin") {
    throw new ApplicationError(
      "FORBIDDEN",
      "This operation is not available for the current account.",
    );
  }
  return actor;
}

export async function getEmployerJob(
  jobId: string,
  context?: RequestContext,
  database: EmployerJobsDatabase = db,
) {
  const actor = await requireEmployerJobReader(context);
  const [job] = await database
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.id, jobId),
        actor.role === "employer"
          ? eq(jobs.employerId, actor.userId)
          : undefined,
      ),
    )
    .limit(1);

  if (!job) {
    throw new ApplicationError("JOB_NOT_FOUND", "Job not found or not owned by you.");
  }

  const [privateDetails] = await database
    .select()
    .from(jobPrivateDetails)
    .where(eq(jobPrivateDetails.jobId, jobId))
    .limit(1);

  return {
    ...job,
    wageAmount: Number(job.wageAmount),
    fullAddress: privateDetails?.fullAddress || "",
    arrivalInstructions: privateDetails?.arrivalInstructions || "",
  };
}

export type EmployerJobListItem = Awaited<
  ReturnType<typeof listMyEmployerJobs>
>["items"][number];

export async function listMyEmployerJobs(
  input: EmployerJobListInput = {},
  context?: RequestContext,
  database: EmployerJobsDatabase = db,
) {
  const actor = assertRole(
    assertActiveUser(context ?? (await requireActiveUser())),
    "employer",
  );
  const limit = normalizeLimit(input.limit);
  const cursor = decodeCursor(input.cursor);
  const rows = await database
    .select({
      id: jobs.id,
      title: jobs.title,
      status: jobs.status,
      visibility: jobs.visibility,
      categoryName: categories.name,
      areaName: areas.name,
      publicLocationLabel: jobs.publicLocationLabel,
      wageAmount: jobs.wageAmount,
      wageUnit: jobs.wageUnit,
      startsAt: jobs.startsAt,
      applicationDeadline: jobs.applicationDeadline,
      isFirstOpportunity: jobs.isFirstOpportunity,
      publishedAt: jobs.publishedAt,
      createdAt: jobs.createdAt,
      agreementId: agreements.id,
      submittedApplicationCount: sql<number>`count(${applications.id})::int`,
    })
    .from(jobs)
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
    .innerJoin(areas, eq(jobs.areaId, areas.id))
    .leftJoin(
      applications,
      and(
        eq(applications.jobId, jobs.id),
        eq(applications.status, "submitted"),
      ),
    )
    .leftJoin(agreements, eq(agreements.jobId, jobs.id))
    .where(
      and(
        eq(jobs.employerId, actor.userId),
        cursor
          ? or(
              lt(jobs.createdAt, cursor.createdAt),
              and(
                eq(jobs.createdAt, cursor.createdAt),
                gt(jobs.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .groupBy(jobs.id, categories.name, areas.name, agreements.id)
    .orderBy(desc(jobs.createdAt), asc(jobs.id))
    .limit(limit + 1);

  const items = rows.slice(0, limit).map((row) => ({
    ...row,
    wageAmount: Number(row.wageAmount),
  }));

  return {
    items,
    nextCursor:
      rows.length > limit ? encodeCursor(items.at(-1)!) : null,
  };
}

export type EmployerJobDetail = Awaited<ReturnType<typeof getEmployerJobDetail>>;

export async function getEmployerJobDetail(
  jobId: string,
  context?: RequestContext,
  database: EmployerJobsDatabase = db,
) {
  const actor = await requireEmployerJobReader(context);
  const [job] = await database
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      taskScope: jobs.taskScope,
      status: jobs.status,
      visibility: jobs.visibility,
      categoryName: categories.name,
      areaName: areas.name,
      publicLocationLabel: jobs.publicLocationLabel,
      wageAmount: jobs.wageAmount,
      wageUnit: jobs.wageUnit,
      wageStatus: jobs.wageStatus,
      startsAt: jobs.startsAt,
      estimatedMinutes: jobs.estimatedMinutes,
      applicationDeadline: jobs.applicationDeadline,
      paymentMethod: jobs.paymentMethod,
      paymentTiming: jobs.paymentTiming,
      toolsProvided: jobs.toolsProvided,
      toolsRequired: jobs.toolsRequired,
      isFirstOpportunity: jobs.isFirstOpportunity,
      publishedAt: jobs.publishedAt,
      cancelledAt: jobs.cancelledAt,
      submittedApplicationCount: sql<number>`count(${applications.id})::int`,
    })
    .from(jobs)
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
    .innerJoin(areas, eq(jobs.areaId, areas.id))
    .leftJoin(
      applications,
      and(
        eq(applications.jobId, jobs.id),
        eq(applications.status, "submitted"),
      ),
    )
    .where(
      and(
        eq(jobs.id, jobId),
        actor.role === "employer"
          ? eq(jobs.employerId, actor.userId)
          : undefined,
      ),
    )
    .groupBy(jobs.id, categories.name, areas.name)
    .limit(1);

  if (!job) {
    throw new ApplicationError("JOB_NOT_FOUND", "Job not found or not owned by you.");
  }

  const [privateDetails] = await database
    .select({
      fullAddress: jobPrivateDetails.fullAddress,
      arrivalInstructions: jobPrivateDetails.arrivalInstructions,
    })
    .from(jobPrivateDetails)
    .where(eq(jobPrivateDetails.jobId, jobId))
    .limit(1);

  return {
    ...job,
    wageAmount: Number(job.wageAmount),
    fullAddress: privateDetails?.fullAddress ?? "",
    arrivalInstructions: privateDetails?.arrivalInstructions ?? "",
  };
}
