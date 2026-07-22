import { randomUUID } from "node:crypto";
import { expect, test, mock } from "bun:test";

mock.module("server-only", () => {
  return {};
});
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "enforces cross-account authorization and private address isolation",
  async () => {
    expect(process.env.RINTARA_ENV).toBe("test");

    const client = postgres(getIntegrationDatabaseUrl(), {
      max: 1,
      prepare: false,
      ssl: process.env.TEST_DATABASE_SSL === "disable" ? false : "require",
    });
    const database = drizzle(client, { schema });

    try {
      await migrate(database, { migrationsFolder: "./drizzle" });

      const fixtureId = randomUUID();
      const areaId = randomUUID();
      const categoryId = randomUUID();

      const employer1Id = randomUUID();
      const employer2Id = randomUUID();
      const worker1Id = randomUUID();
      const worker2Id = randomUUID();
      const jobId = randomUUID();
      const applicationId = randomUUID();
      const agreementId = randomUUID();

      await database.transaction(async (tx) => {
        await tx.insert(schema.areas).values({
          id: areaId,
          level: "city_regency",
          code: `auth-${fixtureId}`,
          name: "Kota Otorisasi",
        });
        await tx.insert(schema.categories).values({
          id: categoryId,
          slug: `auth-${fixtureId}`,
          name: "Kategori Otorisasi",
          riskLevel: "low",
        });
        await tx.insert(schema.users).values([
          { id: employer1Id, authSubject: `emp1-${fixtureId}`, role: "employer" },
          { id: employer2Id, authSubject: `emp2-${fixtureId}`, role: "employer" },
          { id: worker1Id, authSubject: `work1-${fixtureId}`, role: "worker" },
          { id: worker2Id, authSubject: `work2-${fixtureId}`, role: "worker" },
        ]);
        await tx.insert(schema.employerProfiles).values([
          { userId: employer1Id, displayName: "Employer 1", employerType: "individual", areaId },
          { userId: employer2Id, displayName: "Employer 2", employerType: "individual", areaId },
        ]);
        await tx.insert(schema.workerProfiles).values([
          { userId: worker1Id, displayName: "Worker 1", areaId },
          { userId: worker2Id, displayName: "Worker 2", areaId },
        ]);
        await tx.insert(schema.jobs).values({
          id: jobId,
          employerId: employer1Id,
          categoryId,
          areaId,
          title: "Pekerjaan Otorisasi",
          description: "Data sintetis untuk pengujian otorisasi.",
          taskScope: "Menguji cross-account access.",
          publicLocationLabel: "Kota Otorisasi",
          startsAt: new Date("2030-01-03T08:00:00.000Z"),
          estimatedMinutes: 120,
          wageAmount: BigInt(150_000),
          wageUnit: "job",
          wageStatus: "compliant",
          paymentMethod: "Transfer",
          paymentTiming: "Setelah selesai",
          riskLevel: "low",
          applicationDeadline: new Date("2030-01-02T08:00:00.000Z"),
          status: "published",
          publishedAt: new Date("2030-01-01T08:00:00.000Z"),
        });
        await tx.insert(schema.jobPrivateDetails).values({
          jobId,
          fullAddress: "Jalan Rahasia No. 1, Kota Otorisasi",
          arrivalInstructions: "Ketuk 3 kali",
        });
        await tx.insert(schema.applications).values({
          id: applicationId,
          jobId,
          workerId: worker1Id,
          note: "Saya bisa",
          firstOpportunityEligibleAtSubmission: false,
          status: "accepted",
          decidedAt: new Date(),
        });
        await tx.insert(schema.agreements).values({
          id: agreementId,
          applicationId,
          jobId,
          workerId: worker1Id,
          employerId: employer1Id,
          termsSnapshot: {
            title: "Pekerjaan Otorisasi",
            categoryId,
            categoryName: "Kategori Otorisasi",
            taskScope: "Menguji cross-account access.",
            generalArea: "Kota Otorisasi",
            fullAddress: "Jalan Rahasia No. 1, Kota Otorisasi",
            arrivalInstructions: "Ketuk 3 kali",
            startsAt: "2030-01-03T08:00:00.000Z",
            estimatedMinutes: 120,
            wageAmount: "150000",
            wageUnit: "job",
            paymentMethod: "Transfer",
            paymentTiming: "Setelah selesai",
            toolsProvided: null,
            toolsRequired: null,
            cancellationWording: "...",
          },
          isFirstOpportunity: false,
          wageStatus: "compliant",
          status: "pending_confirmation",
        });
      });

      const employer1Context = { userId: employer1Id, role: "employer" as const, displayName: "E1", accountStatus: "active" as const, requestId: "test-req" };
      const employer2Context = { userId: employer2Id, role: "employer" as const, displayName: "E2", accountStatus: "active" as const, requestId: "test-req" };
      const worker1Context = { userId: worker1Id, role: "worker" as const, displayName: "W1", accountStatus: "active" as const, requestId: "test-req" };
      const worker2Context = { userId: worker2Id, role: "worker" as const, displayName: "W2", accountStatus: "active" as const, requestId: "test-req" };

      mock.module("@/server/db/client", () => {
        return { db: database };
      });
      const { requireJobOwner, requireAgreementParty } = await import("@/server/auth/authorization");
      const { getEmployerJob } = await import("@/server/queries/jobs/get-employer-job");

      await expect(requireJobOwner(employer1Context, jobId)).resolves.toBeDefined();
      
      await expect(requireJobOwner(employer2Context, jobId)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      await expect(requireJobOwner(worker1Context, jobId)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      await expect(requireAgreementParty(employer1Context, agreementId)).resolves.toBeDefined();
      await expect(requireAgreementParty(worker1Context, agreementId)).resolves.toBeDefined();
      
      await expect(requireAgreementParty(employer2Context, agreementId)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      await expect(requireAgreementParty(worker2Context, agreementId)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });

      await expect(getEmployerJob(jobId, employer1Id)).resolves.toMatchObject({
        fullAddress: "Jalan Rahasia No. 1, Kota Otorisasi",
        arrivalInstructions: "Ketuk 3 kali",
      });
      await expect(getEmployerJob(jobId, employer2Id)).rejects.toMatchObject({
        code: "JOB_NOT_FOUND",
      });
      await expect(getEmployerJob(jobId, worker2Id)).rejects.toMatchObject({
        code: "JOB_NOT_FOUND",
      });

    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
