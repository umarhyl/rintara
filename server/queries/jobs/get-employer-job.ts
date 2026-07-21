import { db } from "@/server/db/client";
import { jobs, jobPrivateDetails } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
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
