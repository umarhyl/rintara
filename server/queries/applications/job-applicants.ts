import "server-only";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
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

type JobApplicantsDatabase = PostgresJsDatabase<typeof schema>;

export type ApplicantStatus = "submitted" | "accepted" | "rejected" | "withdrawn";

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
  proofEntries: ApplicantPassportProof[];
};

export type JobApplicantsResult = {
  job: {
    id: string;
    title: string;
    categoryId: string;
    categoryName: string;
    isFirstOpportunity: boolean;
  };
  applicants: JobApplicantListItem[];
};

type ApplicantBaseRow = Omit<
  JobApplicantListItem,
  | "skillInterests"
  | "completedJobs"
  | "verifiedCategoryCount"
  | "latestCompletedAt"
  | "proofEntries"
  | "isEligibleForJobCategoryNow"
> & {
  jobCategoryId: string;
};

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
    proofEntries: [],
  };
}

export async function listJobApplicants(
  jobId: string,
  employerId: string,
  database: JobApplicantsDatabase = db,
): Promise<JobApplicantsResult> {
  const [job] = await database
    .select({
      id: jobs.id,
      title: jobs.title,
      categoryId: jobs.categoryId,
      categoryName: categories.name,
      isFirstOpportunity: jobs.isFirstOpportunity,
    })
    .from(jobs)
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
    .where(and(eq(jobs.id, jobId), eq(jobs.employerId, employerId)))
    .limit(1);

  if (!job) {
    throw new ApplicationError(
      "JOB_NOT_FOUND",
      "Job not found or not owned by you.",
    );
  }

  const applicantRows = await database
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
    .where(and(eq(applications.jobId, job.id), eq(jobs.employerId, employerId)))
    .orderBy(asc(applications.status), asc(applications.submittedAt), asc(applications.id));

  if (applicantRows.length === 0) {
    return { job, applicants: [] };
  }

  const workerIds = applicantRows.map((applicant) => applicant.workerId);

  const [interestRows, proofRows] = await Promise.all([
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
        id: workProofs.id,
        workerId: workProofs.workerId,
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
          inArray(workProofs.workerId, workerIds),
          eq(workProofs.verificationStatus, "verified"),
          isNull(workProofs.revokedAt),
        ),
      )
      .orderBy(desc(workProofs.completedAt), desc(workProofs.id)),
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

  const proofsByWorker = new Map<string, ApplicantPassportProof[]>();
  for (const proof of proofRows) {
    const proofs = proofsByWorker.get(proof.workerId) ?? [];
    proofs.push({
      id: proof.id,
      categoryId: proof.categoryId,
      categoryName: proof.categoryName,
      jobTitle: proof.jobTitle,
      areaLabel: proof.areaLabel,
      completedAt: proof.completedAt,
      verificationStatus: "verified",
    });
    proofsByWorker.set(proof.workerId, proofs);
  }

  return {
    job,
    applicants: applicantRows.map((row) => {
      const applicant = emptyPassportSummary(row);
      const proofEntries = proofsByWorker.get(row.workerId) ?? [];
      const verifiedCategoryIds = new Set(
        proofEntries.map((proof) => proof.categoryId),
      );

      return {
        ...applicant,
        skillInterests: interestsByWorker.get(row.workerId) ?? [],
        completedJobs: proofEntries.length,
        verifiedCategoryCount: verifiedCategoryIds.size,
        latestCompletedAt: proofEntries[0]?.completedAt ?? null,
        proofEntries,
        isEligibleForJobCategoryNow: !verifiedCategoryIds.has(row.jobCategoryId),
      };
    }),
  };
}

export async function getApplicantPassport(
  jobId: string,
  applicationId: string,
  employerId: string,
  database: JobApplicantsDatabase = db,
) {
  const result = await listJobApplicants(jobId, employerId, database);
  const applicant = result.applicants.find(
    (item) => item.id === applicationId && item.jobId === result.job.id,
  );

  if (!applicant) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Applicant Passport not found or not available.",
    );
  }

  return {
    job: result.job,
    applicant,
  };
}
