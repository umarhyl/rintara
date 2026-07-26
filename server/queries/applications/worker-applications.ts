import "server-only";

import { Buffer } from "node:buffer";
import { and, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  agreements,
  applications,
  areas,
  categories,
  employerProfiles,
  jobs,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

type WorkerApplicationsDatabase = PostgresJsDatabase<typeof schema>;

export type WorkerApplicationListInput = {
  cursor?: string;
  limit?: number;
  view?: WorkerApplicationListView;
};

export type WorkerApplicationListView = "active" | "history";

export type WorkerApplicationListItem = {
  id: string;
  agreementId: string | null;
  jobId: string;
  jobTitle: string;
  employerDisplayName: string;
  categoryName: string;
  areaName: string;
  publicLocationLabel: string;
  wageAmount: number;
  wageUnit: "hour" | "day" | "job";
  startsAt: Date;
  applicationDeadline: Date;
  status: "submitted" | "accepted" | "rejected" | "withdrawn";
  submittedAt: Date;
  decidedAt: Date | null;
  withdrawnAt: Date | null;
  firstOpportunityEligibleAtSubmission: boolean;
  isFirstOpportunity: boolean;
  publicDetailAvailable: boolean;
};

type WorkerApplicationRow = Omit<WorkerApplicationListItem, "wageAmount"> & {
  wageAmount: bigint;
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

    const submittedAt = new Date(parsed[0]);
    if (
      Number.isNaN(submittedAt.getTime()) ||
      submittedAt.toISOString() !== parsed[0]
    ) {
      invalidCursor();
    }

    return { submittedAt, id: parsed[1] };
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    invalidCursor();
  }
}

function encodeCursor(row: WorkerApplicationRow) {
  return Buffer.from(
    JSON.stringify([row.submittedAt.toISOString(), row.id]),
  ).toString("base64url");
}

function toWorkerApplicationItem(row: WorkerApplicationRow) {
  return {
    ...row,
    wageAmount: Number(row.wageAmount),
  } satisfies WorkerApplicationListItem;
}

function applicationViewCondition(view: WorkerApplicationListView | undefined) {
  if (view === "active") {
    return inArray(applications.status, ["submitted", "accepted"]);
  }

  if (view === "history") {
    return inArray(applications.status, ["rejected", "withdrawn"]);
  }

  return undefined;
}

export async function listMyApplications(
  input: WorkerApplicationListInput = {},
  context?: RequestContext,
  database: WorkerApplicationsDatabase = db,
  now: Date = new Date(),
) {
  const actor = assertRole(
    assertActiveUser(context ?? (await requireActiveUser())),
    "worker",
  );
  const limit = normalizeLimit(input.limit);
  const cursor = decodeCursor(input.cursor);
  const publicDetailAvailable = sql<boolean>`${and(
    eq(jobs.status, "published"),
    eq(jobs.visibility, "visible"),
    gt(jobs.applicationDeadline, now),
  )}`;
  const rows = await database
    .select({
      id: applications.id,
      agreementId: agreements.id,
      jobId: applications.jobId,
      jobTitle: jobs.title,
      employerDisplayName: employerProfiles.displayName,
      categoryName: categories.name,
      areaName: areas.name,
      publicLocationLabel: jobs.publicLocationLabel,
      wageAmount: jobs.wageAmount,
      wageUnit: jobs.wageUnit,
      startsAt: jobs.startsAt,
      applicationDeadline: jobs.applicationDeadline,
      status: applications.status,
      submittedAt: applications.submittedAt,
      decidedAt: applications.decidedAt,
      withdrawnAt: applications.withdrawnAt,
      firstOpportunityEligibleAtSubmission:
        applications.firstOpportunityEligibleAtSubmission,
      isFirstOpportunity: jobs.isFirstOpportunity,
      publicDetailAvailable,
    })
    .from(applications)
    .leftJoin(agreements, eq(agreements.applicationId, applications.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
    .innerJoin(areas, eq(jobs.areaId, areas.id))
    .innerJoin(employerProfiles, eq(jobs.employerId, employerProfiles.userId))
    .where(
      and(
        eq(applications.workerId, actor.userId),
        applicationViewCondition(input.view),
        cursor
          ? or(
              lt(applications.submittedAt, cursor.submittedAt),
              and(
                eq(applications.submittedAt, cursor.submittedAt),
                lt(applications.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(applications.submittedAt), desc(applications.id))
    .limit(limit + 1);

  const items = rows.slice(0, limit);
  return {
    items: items.map(toWorkerApplicationItem),
    nextCursor: rows.length > limit ? encodeCursor(items.at(-1)!) : null,
  };
}
