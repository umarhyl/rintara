import "server-only";

import { and, eq, lte } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  applications,
  auditLogs,
  jobs,
  notifications,
} from "@/server/db/schema";

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;

export type ExpireUnfilledJobsResult = {
  expiredJobCount: number;
  rejectedApplicationCount: number;
};

export async function expireUnfilledJobs({
  now = new Date(),
  requestId,
  limit = DEFAULT_BATCH_SIZE,
}: {
  now?: Date;
  requestId: string;
  limit?: number;
}): Promise<ExpireUnfilledJobsResult> {
  const batchSize = Math.max(1, Math.min(Math.trunc(limit), MAX_BATCH_SIZE));
  const latestStartAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return db.transaction(async (tx) => {
    const expiringJobs = await tx
      .select({
        id: jobs.id,
        employerId: jobs.employerId,
        title: jobs.title,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "published"),
          lte(jobs.startsAt, latestStartAt),
        ),
      )
      .orderBy(jobs.startsAt, jobs.id)
      .limit(batchSize)
      .for("update", { skipLocked: true });

    let expiredJobCount = 0;
    let rejectedApplicationCount = 0;

    for (const job of expiringJobs) {
      const [expiredJob] = await tx
        .update(jobs)
        .set({ status: "expired", updatedAt: now })
        .where(and(eq(jobs.id, job.id), eq(jobs.status, "published")))
        .returning({ id: jobs.id });

      if (!expiredJob) continue;
      expiredJobCount += 1;

      const rejectedApplications = await tx
        .update(applications)
        .set({ status: "rejected", decidedAt: now })
        .where(
          and(
            eq(applications.jobId, job.id),
            eq(applications.status, "submitted"),
          ),
        )
        .returning({
          id: applications.id,
          workerId: applications.workerId,
        });

      rejectedApplicationCount += rejectedApplications.length;

      await tx.insert(notifications).values([
        {
          recipientId: job.employerId,
          type: "job_expired",
          title: "Batas pemilihan pekerja berakhir",
          body: `Pekerjaan "${job.title}" ditutup karena belum ada pekerja yang dipilih.`,
          entityType: "job",
          entityId: job.id,
          createdAt: now,
        },
        ...rejectedApplications.map((application) => ({
          recipientId: application.workerId,
          type: "application_rejected",
          title: "Pekerjaan ditutup",
          body: `Pekerjaan "${job.title}" ditutup tanpa pekerja terpilih.`,
          entityType: "application",
          entityId: application.id,
          createdAt: now,
        })),
      ]);

      await tx.insert(auditLogs).values({
        actorId: null,
        action: "expire_unfilled_job",
        entityType: "job",
        entityId: job.id,
        requestId,
        metadata: {
          previousStatus: "published",
          newStatus: "expired",
          rejectedApplicationCount: rejectedApplications.length,
        },
        createdAt: now,
      });
    }

    return {
      expiredJobCount,
      rejectedApplicationCount,
    };
  });
}
