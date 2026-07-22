import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
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
export type PublicJobCategoryFilter = "all" | "event" | "cleaning" | "admin";

export type PublicJobListInput = {
  search?: string;
  category?: PublicJobCategoryFilter;
  categoryId?: string;
  areaId?: string;
  minimumWage?: number;
  maximumWage?: number;
  opportunity?: OpportunityFilter;
  page?: number;
  pageSize?: number;
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

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function normalizePage(value: number | undefined) {
  if (!Number.isInteger(value) || !value || value < 1) return 1;
  return value;
}

function normalizePageSize(value: number | undefined) {
  if (!Number.isInteger(value) || !value || value < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(value, MAX_PAGE_SIZE);
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

function categoryNameForFilter(category: PublicJobCategoryFilter | undefined) {
  if (category === "event") return "Event Helper";
  if (category === "cleaning") return "Light Cleaning";
  if (category === "admin") return "Simple Administration";
  return null;
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

  const categoryName = categoryNameForFilter(input.category);
  if (categoryName) conditions.push(eq(categories.name, categoryName));
  if (input.categoryId) conditions.push(eq(jobs.categoryId, input.categoryId));
  if (input.areaId) conditions.push(eq(jobs.areaId, input.areaId));
  if (input.minimumWage !== undefined) {
    conditions.push(gte(jobs.wageAmount, BigInt(input.minimumWage)));
  }
  if (input.maximumWage !== undefined) {
    conditions.push(lte(jobs.wageAmount, BigInt(input.maximumWage)));
  }
  if (input.opportunity === "first") {
    conditions.push(eq(jobs.isFirstOpportunity, true));
  }
  if (input.opportunity === "general") {
    conditions.push(eq(jobs.isFirstOpportunity, false));
  }

  return conditions;
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
  const page = normalizePage(input.page);
  const pageSize = normalizePageSize(input.pageSize);
  const activeBoost = activeBoostExpression();

  const rows = await database
    .select({ ...publicJobCardProjection, activeBoost })
    .from(jobs)
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
    .innerJoin(areas, eq(jobs.areaId, areas.id))
    .innerJoin(employerProfiles, eq(jobs.employerId, employerProfiles.userId))
    .where(and(...publicJobConditions(input)))
    .orderBy(sql`${activeBoost} desc`, desc(jobs.publishedAt), asc(jobs.id))
    .limit(pageSize + 1)
    .offset((page - 1) * pageSize);

  const hasNextPage = rows.length > pageSize;

  return {
    items: rows.slice(0, pageSize).map(toPublicJobCard),
    page,
    pageSize,
    hasNextPage,
    hasPreviousPage: page > 1,
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
