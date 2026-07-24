import "server-only";

import { Buffer } from "node:buffer";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ApplicationError } from "@/server/errors/application-error";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  areas,
  categories,
  employerProfiles,
  jobBoosts,
  jobs,
} from "@/server/db/schema";
import { publicJobCardProjection } from "@/server/queries/public-job-projection";

type PublicJobsDatabase = PostgresJsDatabase<typeof schema>;

export type OpportunityFilter = "all" | "first" | "general";

export type PublicJobListInput = {
  search?: string;
  categoryId?: string;
  areaId?: string;
  minimumWage?: number;
  maximumWage?: number;
  opportunity?: OpportunityFilter;
  cursor?: string;
  limit?: number;
};

export type PublicReferenceData = {
  categories: { id: string; name: string }[];
  areas: { id: string; name: string }[];
};

export type PublicJobCard = {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  areaId: string;
  areaName: string;
  publicLocationLabel: string;
  wageAmount: number;
  wageUnit: "hour" | "day" | "job";
  startsAt: Date;
  estimatedMinutes: number;
  applicationDeadline: Date;
  isFirstOpportunity: boolean;
  publishedAt: Date;
  employerDisplayName: string;
  activeBoost: boolean;
};

export type PublicJobDetail = PublicJobCard & {
  description: string;
  taskScope: string;
  wageStatus: "compliant" | "below" | "unavailable";
  paymentMethod: string;
  paymentTiming: string;
  toolsProvided: string | null;
  toolsRequired: string | null;
};

type PublicJobCardRow = Omit<PublicJobCard, "wageAmount" | "publishedAt"> & {
  wageAmount: bigint;
  publishedAt: Date | null;
};

type PublicJobCursor = {
  activeBoost: boolean;
  publishedAt: Date;
  id: string;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeLimit(value: number | undefined) {
  if (!Number.isInteger(value) || !value || value < 1) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}

function invalidCursor(): never {
  throw new ApplicationError(
    "VALIDATION_FAILED",
    "Invalid pagination cursor.",
    { cursor: ["The pagination cursor is malformed."] },
  );
}

function decodeCursor(value: string | undefined): PublicJobCursor | null {
  if (!value) return null;

  try {
    if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) invalidCursor();

    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) invalidCursor();

    const parsed: unknown = JSON.parse(decoded.toString("utf8"));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("b" in parsed) ||
      !("p" in parsed) ||
      !("i" in parsed) ||
      (parsed.b !== 0 && parsed.b !== 1) ||
      typeof parsed.p !== "string" ||
      typeof parsed.i !== "string" ||
      !UUID_PATTERN.test(parsed.i)
    ) {
      invalidCursor();
    }

    const publishedAt = new Date(parsed.p);
    if (
      Number.isNaN(publishedAt.getTime()) ||
      publishedAt.toISOString() !== parsed.p
    ) {
      invalidCursor();
    }

    return {
      activeBoost: parsed.b === 1,
      publishedAt,
      id: parsed.i,
    };
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    invalidCursor();
  }
}

function encodeCursor(row: PublicJobCardRow) {
  return Buffer.from(
    JSON.stringify({
      b: row.activeBoost ? 1 : 0,
      p: row.publishedAt!.toISOString(),
      i: row.id,
    }),
    "utf8",
  ).toString("base64url");
}

function activeBoostExpression() {
  return sql<boolean>`exists (
    select 1
    from ${jobBoosts}
    where ${jobBoosts.jobId} = ${jobs.id}
      and ${jobBoosts.status} = 'active'
      and ${jobBoosts.startsAt} <= now()
      and ${jobBoosts.endsAt} > now()
  )`;
}

function validateFilterId(
  value: string | undefined,
  field: "categoryId" | "areaId",
) {
  if (value === undefined) return undefined;
  if (UUID_PATTERN.test(value)) return value;

  throw new ApplicationError(
    "VALIDATION_FAILED",
    "Invalid public job filter.",
    { [field]: ["The filter must be a valid UUID."] },
  );
}

function validateWageFilter(
  value: number | undefined,
  field: "minimumWage" | "maximumWage",
) {
  if (value === undefined) return undefined;
  if (Number.isSafeInteger(value) && value > 0) return value;

  throw new ApplicationError(
    "VALIDATION_FAILED",
    "Invalid public job filter.",
    { [field]: ["The wage filter must be a positive integer."] },
  );
}

function publicJobConditions(input: PublicJobListInput = {}) {
  const conditions: SQL[] = [
    eq(jobs.status, "published"),
    eq(jobs.visibility, "visible"),
    gt(jobs.applicationDeadline, new Date()),
  ];

  const search = input.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(jobs.title, pattern),
        ilike(jobs.description, pattern),
        ilike(jobs.taskScope, pattern),
        ilike(employerProfiles.displayName, pattern),
        ilike(categories.name, pattern),
        ilike(areas.name, pattern),
        ilike(jobs.publicLocationLabel, pattern),
      )!,
    );
  }

  const categoryId = validateFilterId(input.categoryId, "categoryId");
  const areaId = validateFilterId(input.areaId, "areaId");
  const minimumWage = validateWageFilter(input.minimumWage, "minimumWage");
  const maximumWage = validateWageFilter(input.maximumWage, "maximumWage");
  if (
    input.opportunity !== undefined &&
    !["all", "first", "general"].includes(input.opportunity)
  ) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid public job filter.",
      { opportunity: ["Select a supported opportunity filter."] },
    );
  }
  if (
    minimumWage !== undefined &&
    maximumWage !== undefined &&
    minimumWage > maximumWage
  ) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid public job filter.",
      { maximumWage: ["Maximum wage must be at least the minimum wage."] },
    );
  }
  if (categoryId) conditions.push(eq(jobs.categoryId, categoryId));
  if (areaId) conditions.push(eq(jobs.areaId, areaId));
  if (minimumWage !== undefined) {
    conditions.push(gte(jobs.wageAmount, BigInt(minimumWage)));
  }
  if (maximumWage !== undefined) {
    conditions.push(lte(jobs.wageAmount, BigInt(maximumWage)));
  }
  if (input.opportunity === "first") {
    conditions.push(eq(jobs.isFirstOpportunity, true));
  }
  if (input.opportunity === "general") {
    conditions.push(eq(jobs.isFirstOpportunity, false));
  }

  return conditions;
}

function afterCursorCondition(
  cursor: PublicJobCursor,
  activeBoost: SQL<boolean>,
) {
  const afterPublishedAt = or(
    lt(jobs.publishedAt, cursor.publishedAt),
    and(
      eq(jobs.publishedAt, cursor.publishedAt),
      gt(jobs.id, cursor.id),
    ),
  )!;
  const sameBoostState = cursor.activeBoost
    ? sql<boolean>`${activeBoost}`
    : sql<boolean>`not (${activeBoost})`;

  return cursor.activeBoost
    ? or(
        sql<boolean>`not (${activeBoost})`,
        and(sameBoostState, afterPublishedAt),
      )!
    : and(sameBoostState, afterPublishedAt)!;
}

function toPublicJobCard(row: PublicJobCardRow) {
  return {
    ...row,
    wageAmount: Number(row.wageAmount),
    publishedAt: row.publishedAt!,
  } satisfies PublicJobCard;
}

export async function getPublicJobReferenceData(
  database: PublicJobsDatabase = db,
): Promise<PublicReferenceData> {
  const [categoryRows, areaRows] = await Promise.all([
    database
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.name), asc(categories.id)),
    database
      .select({ id: areas.id, name: areas.name })
      .from(areas)
      .where(and(eq(areas.level, "city_regency"), eq(areas.isActive, true)))
      .orderBy(asc(areas.name), asc(areas.id)),
  ]);

  return { categories: categoryRows, areas: areaRows };
}

export async function listPublishedJobs(
  input: PublicJobListInput = {},
  database: PublicJobsDatabase = db,
) {
  const limit = normalizeLimit(input.limit);
  const cursor = decodeCursor(input.cursor);
  const activeBoost = activeBoostExpression();
  const conditions = publicJobConditions(input);
  if (cursor) conditions.push(afterCursorCondition(cursor, activeBoost));

  const rows = await database
    .select({ ...publicJobCardProjection, activeBoost })
    .from(jobs)
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
    .innerJoin(areas, eq(jobs.areaId, areas.id))
    .innerJoin(employerProfiles, eq(jobs.employerId, employerProfiles.userId))
    .where(and(...conditions))
    .orderBy(sql`${activeBoost} desc`, desc(jobs.publishedAt), asc(jobs.id))
    .limit(limit + 1);

  const items = rows.slice(0, limit);
  return {
    items: items.map(toPublicJobCard),
    nextCursor: rows.length > limit ? encodeCursor(items.at(-1)!) : null,
  };
}

export async function getPublishedJob(
  jobId: string,
  database: PublicJobsDatabase = db,
): Promise<PublicJobDetail> {
  const activeBoost = activeBoostExpression();
  const [row] = await database
    .select({
      ...publicJobCardProjection,
      activeBoost,
      description: jobs.description,
      taskScope: jobs.taskScope,
      wageStatus: jobs.wageStatus,
      paymentMethod: jobs.paymentMethod,
      paymentTiming: jobs.paymentTiming,
      toolsProvided: jobs.toolsProvided,
      toolsRequired: jobs.toolsRequired,
    })
    .from(jobs)
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
    .innerJoin(areas, eq(jobs.areaId, areas.id))
    .innerJoin(employerProfiles, eq(jobs.employerId, employerProfiles.userId))
    .where(and(eq(jobs.id, jobId), ...publicJobConditions()))
    .limit(1);

  if (!row) {
    throw new ApplicationError("JOB_NOT_FOUND", "The requested job was not found.");
  }

  return {
    ...toPublicJobCard(row),
    description: row.description,
    taskScope: row.taskScope,
    wageStatus: row.wageStatus,
    paymentMethod: row.paymentMethod,
    paymentTiming: row.paymentTiming,
    toolsProvided: row.toolsProvided,
    toolsRequired: row.toolsRequired,
  };
}
