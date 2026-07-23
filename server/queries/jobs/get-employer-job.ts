import "server-only";

import { db } from "@/server/db/client";
import { applications, areas, categories, jobs, jobPrivateDetails } from "@/server/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { ApplicationError } from "@/server/errors/application-error";

export async function getEmployerJob(jobId: string, employerId: string) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.employerId, employerId)))
    .limit(1);

  if (!job) {
    throw new ApplicationError("JOB_NOT_FOUND", "Job not found or not owned by you.");
  }

  const [privateDetails] = await db
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
  ReturnType<typeof listEmployerJobs>
>[number];

export async function listEmployerJobs(employerId: string) {
  const rows = await db
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
    .where(eq(jobs.employerId, employerId))
    .groupBy(jobs.id, categories.name, areas.name)
    .orderBy(desc(jobs.createdAt), asc(jobs.id));

  return rows.map((row) => ({
    ...row,
    wageAmount: Number(row.wageAmount),
  }));
}

export type EmployerJobDetail = Awaited<ReturnType<typeof getEmployerJobDetail>>;

export async function getEmployerJobDetail(jobId: string, employerId: string) {
  const [job] = await db
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
    .where(and(eq(jobs.id, jobId), eq(jobs.employerId, employerId)))
    .groupBy(jobs.id, categories.name, areas.name)
    .limit(1);

  if (!job) {
    throw new ApplicationError("JOB_NOT_FOUND", "Job not found or not owned by you.");
  }

  const [privateDetails] = await db
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
