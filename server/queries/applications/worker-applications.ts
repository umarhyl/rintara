import "server-only";

import { and, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  applications,
  areas,
  categories,
  employerProfiles,
  jobs,
} from "@/server/db/schema";

type WorkerApplicationsDatabase = PostgresJsDatabase<typeof schema>;

export type WorkerApplicationListItem = {
  id: string;
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
};

type WorkerApplicationRow = Omit<
  WorkerApplicationListItem,
  "wageAmount"
> & {
  wageAmount: bigint;
};

function toWorkerApplicationItem(row: WorkerApplicationRow) {
  return {
    ...row,
    wageAmount: Number(row.wageAmount),
  } satisfies WorkerApplicationListItem;
}

export async function listWorkerApplications(
  workerId: string,
  database: WorkerApplicationsDatabase = db,
) {
  const rows = await database
    .select({
      id: applications.id,
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
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(categories, eq(jobs.categoryId, categories.id))
    .innerJoin(areas, eq(jobs.areaId, areas.id))
    .innerJoin(employerProfiles, eq(jobs.employerId, employerProfiles.userId))
    .where(and(eq(applications.workerId, workerId)))
    .orderBy(desc(applications.submittedAt), desc(applications.id));

  return rows.map(toWorkerApplicationItem);
}
