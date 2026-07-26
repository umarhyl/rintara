import "server-only";

import { Buffer } from "node:buffer";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  applications,
  agreements,
  areas,
  categories,
  jobs,
  workProofs,
  workerInterests,
  workerProfiles,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
import { getJobSelectionCutoff } from "@/server/domain/jobs/selection-cutoff";

type JobApplicantsDatabase = PostgresJsDatabase<typeof schema>;

export type ApplicantStatus = "submitted" | "accepted" | "rejected" | "withdrawn";

export type JobApplicantListInput = {
  cursor?: string;
  limit?: number;
};

export type ApplicantPassportInput = {
  cursor?: string;
  limit?: number;
};

export type ApplicantPassportProof = {
  id: string;
  categoryId: string;
  categoryName: string;
  jobTitle: string;
  areaLabel: string;
  completedAt: Date;
  verificationStatus: "verified";
};

export type JobApplicantListItem = {
  id: string;
  jobId: string;
  workerId: string;
  workerDisplayName: string;
  workerAreaName: string;
  workerBio: string | null;
  availabilityNote: string | null;
  note: string;
  status: ApplicantStatus;
  agreementId: string | null;
  submittedAt: Date;
  firstOpportunityEligibleAtSubmission: boolean;
  isEligibleForJobCategoryNow: boolean;
  skillInterests: {
    id: string;
    name: string;
    isActive: boolean;
  }[];
  completedJobs: number;
  verifiedCategoryCount: number;
  latestCompletedAt: Date | null;
};

export type JobApplicantsResult = {
  job: {
    id: string;
    title: string;
    categoryId: string;
    categoryName: string;
    isFirstOpportunity: boolean;
    status:
      | "draft"
      | "published"
      | "filled"
      | "in_progress"
      | "completed"
      | "expired"
      | "cancelled";
    applicationDeadline: Date;
    selectionCutoff: Date;
    submittedApplicationCount: number;
  };
  applicants: JobApplicantListItem[];
  nextCursor: string | null;
};

type ApplicantBaseRow = Omit<
  JobApplicantListItem,
  | "skillInterests"
  | "completedJobs"
  | "verifiedCategoryCount"
  | "latestCompletedAt"
  | "isEligibleForJobCategoryNow"
> & {
  jobCategoryId: string;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const applicantStatuses: ApplicantStatus[] = [
  "submitted",
  "accepted",
  "rejected",
  "withdrawn",
];
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
      parsed.length !== 3 ||
      !applicantStatuses.includes(parsed[0] as ApplicantStatus) ||
      typeof parsed[1] !== "string" ||
      typeof parsed[2] !== "string" ||
      !UUID_PATTERN.test(parsed[2])
    ) {
      invalidCursor();
    }

    const submittedAt = new Date(parsed[1]);
    if (
      Number.isNaN(submittedAt.getTime()) ||
      submittedAt.toISOString() !== parsed[1]
    ) {
      invalidCursor();
    }

    return {
      status: parsed[0] as ApplicantStatus,
      submittedAt,
      id: parsed[2],
    };
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    invalidCursor();
  }
}

function encodeCursor(row: ApplicantBaseRow) {
  return Buffer.from(
    JSON.stringify([row.status, row.submittedAt.toISOString(), row.id]),
  ).toString("base64url");
}

function decodeProofCursor(value: string | undefined) {
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

    const completedAt = new Date(parsed[0]);
    if (
      Number.isNaN(completedAt.getTime()) ||
      completedAt.toISOString() !== parsed[0]
    ) {
      invalidCursor();
    }

    return { completedAt, id: parsed[1] };
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    invalidCursor();
  }
}

function encodeProofCursor(row: ApplicantPassportProof) {
  return Buffer.from(
    JSON.stringify([row.completedAt.toISOString(), row.id]),
  ).toString("base64url");
}

function emptyPassportSummary(row: ApplicantBaseRow): JobApplicantListItem {
  return {
    id: row.id,
    jobId: row.jobId,
    workerId: row.workerId,
    workerDisplayName: row.workerDisplayName,
    workerAreaName: row.workerAreaName,
    workerBio: row.workerBio,
    availabilityNote: row.availabilityNote,
    note: row.note,
    status: row.status,
    agreementId: row.agreementId,
    submittedAt: row.submittedAt,
    firstOpportunityEligibleAtSubmission:
      row.firstOpportunityEligibleAtSubmission,
    isEligibleForJobCategoryNow: true,
    skillInterests: [],
    completedJobs: 0,
    verifiedCategoryCount: 0,
    latestCompletedAt: null,
  };
}

async function enrichApplicants(
  applicantRows: ApplicantBaseRow[],
  database: JobApplicantsDatabase,
) {
  if (applicantRows.length === 0) return [];

  const workerIds = applicantRows.map((applicant) => applicant.workerId);

  const jobCategoryId = applicantRows[0]!.jobCategoryId;
  const [interestRows, proofSummaryRows] = await Promise.all([
    database
      .select({
        workerId: workerInterests.workerId,
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
      })
      .from(workerInterests)
      .innerJoin(categories, eq(workerInterests.categoryId, categories.id))
      .where(inArray(workerInterests.workerId, workerIds))
      .orderBy(asc(categories.name), asc(categories.id)),
    database
      .select({
        workerId: workProofs.workerId,
        completedJobs: sql<number>`count(*)::int`,
        verifiedCategoryCount:
          sql<number>`count(distinct ${workProofs.categoryId})::int`,
        latestCompletedAt: sql<Date | null>`max(${workProofs.completedAt})`,
        hasCurrentCategoryProof:
          sql<boolean>`bool_or(${workProofs.categoryId} = ${jobCategoryId})`,
      })
      .from(workProofs)
      .where(
        and(
          inArray(workProofs.workerId, workerIds),
          eq(workProofs.verificationStatus, "verified"),
          isNull(workProofs.revokedAt),
        ),
      )
      .groupBy(workProofs.workerId),
  ]);

  const interestsByWorker = new Map<string, JobApplicantListItem["skillInterests"]>();
  for (const interest of interestRows) {
    const interests = interestsByWorker.get(interest.workerId) ?? [];
    interests.push({
      id: interest.id,
      name: interest.name,
      isActive: interest.isActive,
    });
    interestsByWorker.set(interest.workerId, interests);
  }

  const proofSummaryByWorker = new Map(
    proofSummaryRows.map((summary) => [summary.workerId, summary]),
  );

  return applicantRows.map((row) => {
    const applicant = emptyPassportSummary(row);
    const proofSummary = proofSummaryByWorker.get(row.workerId);

    return {
      ...applicant,
      skillInterests: interestsByWorker.get(row.workerId) ?? [],
      completedJobs: proofSummary?.completedJobs ?? 0,
      verifiedCategoryCount: proofSummary?.verifiedCategoryCount ?? 0,
      latestCompletedAt: proofSummary?.latestCompletedAt ?? null,
      isEligibleForJobCategoryNow:
        !(proofSummary?.hasCurrentCategoryProof ?? false),
    };
  });
}

export async function listJobApplicants(
  jobId: string,
  input: JobApplicantListInput = {},
  context?: RequestContext,
  database: JobApplicantsDatabase = db,
): Promise<JobApplicantsResult> {
  const actor = assertActiveUser(context ?? (await requireActiveUser()));
  if (actor.role !== "employer" && actor.role !== "admin") {
    throw new ApplicationError(
      "FORBIDDEN",
      "This operation is not available for the current account.",
    );
  }

  const limit = normalizeLimit(input.limit);
  const cursor = decodeCursor(input.cursor);
  const [job] = await database
    .select({
      id: jobs.id,
      title: jobs.title,
      categoryId: jobs.categoryId,
      categoryName: categories.name,
      isFirstOpportunity: jobs.isFirstOpportunity,
      status: jobs.status,
      applicationDeadline: jobs.applicationDeadline,
      startsAt: jobs.startsAt,
    })
    .from(jobs)
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
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
    throw new ApplicationError(
      "JOB_NOT_FOUND",
      "Job not found or not owned by you.",
    );
  }

  const [applicantRows, [submittedCountRow]] = await Promise.all([
    database
      .select({
        id: applications.id,
        jobId: applications.jobId,
        workerId: applications.workerId,
        workerDisplayName: workerProfiles.displayName,
        workerAreaName: areas.name,
        workerBio: workerProfiles.bio,
        availabilityNote: workerProfiles.availabilityNote,
        note: applications.note,
        status: applications.status,
        agreementId: agreements.id,
        submittedAt: applications.submittedAt,
        firstOpportunityEligibleAtSubmission:
          applications.firstOpportunityEligibleAtSubmission,
        jobCategoryId: jobs.categoryId,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(workerProfiles, eq(applications.workerId, workerProfiles.userId))
      .innerJoin(areas, eq(workerProfiles.areaId, areas.id))
      .leftJoin(agreements, eq(agreements.applicationId, applications.id))
      .where(
        and(
          eq(applications.jobId, job.id),
          cursor
            ? or(
                gt(applications.status, cursor.status),
                and(
                  eq(applications.status, cursor.status),
                  gt(applications.submittedAt, cursor.submittedAt),
                ),
                and(
                  eq(applications.status, cursor.status),
                  eq(applications.submittedAt, cursor.submittedAt),
                  gt(applications.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(applications.status),
        asc(applications.submittedAt),
        asc(applications.id),
      )
      .limit(limit + 1),
    database
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(applications)
      .where(
        and(
          eq(applications.jobId, job.id),
          eq(applications.status, "submitted"),
        ),
      ),
  ]);

  const {
    startsAt,
    ...jobSummary
  } = job;
  const resultJob: JobApplicantsResult["job"] = {
    ...jobSummary,
    selectionCutoff: getJobSelectionCutoff(startsAt),
    submittedApplicationCount: submittedCountRow?.count ?? 0,
  };

  if (applicantRows.length === 0) {
    return { job: resultJob, applicants: [], nextCursor: null };
  }

  const pageRows = applicantRows.slice(0, limit);

  return {
    job: resultJob,
    applicants: await enrichApplicants(pageRows, database),
    nextCursor:
      applicantRows.length > limit ? encodeCursor(pageRows.at(-1)!) : null,
  };
}

export async function getApplicantPassport(
  jobId: string,
  applicationId: string,
  input: ApplicantPassportInput = {},
  context?: RequestContext,
  database: JobApplicantsDatabase = db,
) {
  const actor = assertActiveUser(context ?? (await requireActiveUser()));
  const [row] = await database
    .select({
      id: applications.id,
      jobId: applications.jobId,
      workerId: applications.workerId,
      workerDisplayName: workerProfiles.displayName,
      workerAreaName: areas.name,
      workerBio: workerProfiles.bio,
      availabilityNote: workerProfiles.availabilityNote,
      note: applications.note,
      status: applications.status,
      agreementId: agreements.id,
      submittedAt: applications.submittedAt,
      firstOpportunityEligibleAtSubmission:
        applications.firstOpportunityEligibleAtSubmission,
      jobCategoryId: jobs.categoryId,
      employerId: jobs.employerId,
      jobTitle: jobs.title,
      categoryName: categories.name,
      isFirstOpportunity: jobs.isFirstOpportunity,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
    .innerJoin(workerProfiles, eq(applications.workerId, workerProfiles.userId))
    .innerJoin(areas, eq(workerProfiles.areaId, areas.id))
    .leftJoin(agreements, eq(agreements.applicationId, applications.id))
    .where(and(eq(applications.id, applicationId), eq(applications.jobId, jobId)))
    .limit(1);

  if (
    !row ||
    !(
      actor.role === "admin" ||
      (actor.role === "employer" &&
        actor.userId === row.employerId &&
        row.status === "submitted") ||
      (actor.role === "worker" && actor.userId === row.workerId)
    )
  ) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Applicant Passport not found or not available.",
    );
  }

  const [applicant] = await enrichApplicants([row], database);
  const limit = normalizeLimit(input.limit);
  const cursor = decodeProofCursor(input.cursor);
  const proofRows = await database
    .select({
      id: workProofs.id,
      categoryId: workProofs.categoryId,
      categoryName: categories.name,
      jobTitle: workProofs.jobTitleSnapshot,
      areaLabel: workProofs.areaLabelSnapshot,
      completedAt: workProofs.completedAt,
      verificationStatus: workProofs.verificationStatus,
    })
    .from(workProofs)
    .innerJoin(categories, eq(workProofs.categoryId, categories.id))
    .where(
      and(
        eq(workProofs.workerId, row.workerId),
        eq(workProofs.verificationStatus, "verified"),
        isNull(workProofs.revokedAt),
        cursor
          ? or(
              lt(workProofs.completedAt, cursor.completedAt),
              and(
                eq(workProofs.completedAt, cursor.completedAt),
                lt(workProofs.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(workProofs.completedAt), desc(workProofs.id))
    .limit(limit + 1);
  const proofEntries = proofRows.slice(0, limit).map((proof) => ({
    ...proof,
    verificationStatus: "verified" as const,
  }));

  return {
    job: {
      id: row.jobId,
      title: row.jobTitle,
      categoryId: row.jobCategoryId,
      categoryName: row.categoryName,
      isFirstOpportunity: row.isFirstOpportunity,
    },
    applicant: applicant!,
    proofEntries,
    nextCursor:
      proofRows.length > limit
        ? encodeProofCursor(proofEntries.at(-1)!)
        : null,
  };
}
