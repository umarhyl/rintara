import { randomUUID } from "node:crypto";
import { expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "expires unfilled jobs atomically and remains idempotent",
  async () => {
    expect(process.env.RINTARA_ENV).toBe("test");
    const client = postgres(getIntegrationDatabaseUrl(), {
      max: 2,
      prepare: false,
      ssl: process.env.TEST_DATABASE_SSL === "disable" ? false : "require",
    });
    const database = drizzle(client, { schema });

    try {
      await migrate(database, { migrationsFolder: "./drizzle" });

      const fixtureId = randomUUID();
      const areaId = randomUUID();
      const categoryId = randomUUID();
      const employerId = randomUUID();
      const workerId = randomUUID();
      const jobId = randomUUID();
      const applicationId = randomUUID();
      // Keep this fixture outside the time range used by the shared integration
      // fixtures so the bounded maintenance batch has one eligible job.
      const now = new Date("2000-05-01T08:00:00.000Z");
      const startsAt = new Date("2000-05-02T07:00:00.000Z");

      await database.transaction(async (tx) => {
        await tx.insert(schema.areas).values({
          id: areaId,
          level: "city_regency",
          code: `expiry-${fixtureId}`,
          name: "Kota Expiry",
        });
        await tx.insert(schema.categories).values({
          id: categoryId,
          slug: `expiry-${fixtureId}`,
          name: "Kategori Expiry",
          riskLevel: "low",
          firstOpportunityAllowed: true,
        });
        await tx.insert(schema.users).values([
          {
            id: employerId,
            authSubject: `expiry-employer-${fixtureId}`,
            role: "employer",
          },
          {
            id: workerId,
            authSubject: `expiry-worker-${fixtureId}`,
            role: "worker",
          },
        ]);
        await tx.insert(schema.employerProfiles).values({
          userId: employerId,
          displayName: "Employer Expiry",
          employerType: "individual",
          areaId,
        });
        await tx.insert(schema.workerProfiles).values({
          userId: workerId,
          displayName: "Worker Expiry",
          areaId,
        });
        await tx.insert(schema.jobs).values({
          id: jobId,
          employerId,
          categoryId,
          areaId,
          title: "Pekerjaan yang melewati batas pemilihan",
          description: "Deskripsi pekerjaan expiry yang memenuhi batas validasi.",
          taskScope: "Menyelesaikan tugas expiry sesuai instruksi.",
          publicLocationLabel: "Area Expiry",
          startsAt,
          estimatedMinutes: 120,
          wageAmount: BigInt(150000),
          wageUnit: "job",
          wageStatus: "compliant",
          paymentMethod: "Tunai di luar Rintara",
          paymentTiming: "Setelah pekerjaan",
          riskLevel: "low",
          isFirstOpportunity: true,
          applicationDeadline: new Date("2000-05-01T06:00:00.000Z"),
          status: "published",
          visibility: "visible",
          publishedAt: new Date("2000-04-20T08:00:00.000Z"),
        });
        await tx.insert(schema.jobPrivateDetails).values({
          jobId,
          fullAddress: "Jalan Expiry Privat Nomor 1",
        });
        await tx.insert(schema.applications).values({
          id: applicationId,
          jobId,
          workerId,
          note: "Saya siap membantu pekerjaan expiry ini sampai selesai.",
          firstOpportunityEligibleAtSubmission: true,
        });
      });

      mock.module("@/server/db/client", () => ({ db: database }));
      const { expireUnfilledJobs } = await import(
        "@/server/domain/jobs/expiry"
      );

      await expect(
        expireUnfilledJobs({ now, requestId: "expiry-test" }),
      ).resolves.toEqual({
        expiredJobCount: 1,
        rejectedApplicationCount: 1,
      });

      const [job] = await database
        .select({ status: schema.jobs.status })
        .from(schema.jobs)
        .where(eq(schema.jobs.id, jobId))
        .limit(1);
      const [application] = await database
        .select({ status: schema.applications.status })
        .from(schema.applications)
        .where(eq(schema.applications.id, applicationId))
        .limit(1);
      const notificationRows = await database
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.entityId, jobId));
      const auditRows = await database
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.entityId, jobId));

      expect(job.status).toBe("expired");
      expect(application.status).toBe("rejected");
      expect(notificationRows).toHaveLength(1);
      expect(auditRows).toHaveLength(1);

      await expect(
        expireUnfilledJobs({ now, requestId: "expiry-test-retry" }),
      ).resolves.toEqual({
        expiredJobCount: 0,
        rejectedApplicationCount: 0,
      });
    } finally {
      await client.end();
    }
  },
);
