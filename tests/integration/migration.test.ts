import { randomUUID } from "node:crypto";
import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "applies migrations and exposes critical indexes in isolated PostgreSQL",
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

      const indexes = await client<{ indexname: string }[]>`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname IN (
            'applications_job_worker_unique',
            'applications_one_accepted_per_job',
            'jobs_unfilled_expiry_idx',
            'wage_guidelines_lookup_idx',
            'work_completion_evidence_session_unique',
            'work_proofs_agreement_unique',
            'opportunity_credits_source_job_unique'
          )
      `;

      expect(indexes.map((row) => row.indexname).sort()).toEqual([
        "applications_job_worker_unique",
        "applications_one_accepted_per_job",
        "jobs_unfilled_expiry_idx",
        "opportunity_credits_source_job_unique",
        "wage_guidelines_lookup_idx",
        "work_completion_evidence_session_unique",
        "work_proofs_agreement_unique",
      ]);

      const fixtureId = randomUUID();
      const areaId = randomUUID();
      const categoryId = randomUUID();
      const employerId = randomUUID();
      const workerId = randomUUID();
      const jobId = randomUUID();
      const cutoffJobId = randomUUID();
      const startsAt = new Date("2030-01-03T08:00:00.000Z");

      const application = {
        jobId,
        workerId,
        note: "Saya siap membantu.",
        firstOpportunityEligibleAtSubmission: false,
      } as const;
      const job = {
        employerId,
        categoryId,
        areaId,
        description: "Data sintetis untuk pengujian constraint.",
        taskScope: "Menguji satu aplikasi per worker dan job.",
        publicLocationLabel: "Kota Integrasi",
        startsAt,
        estimatedMinutes: 120,
        wageAmount: BigInt(150_000),
        wageUnit: "job" as const,
        wageStatus: "compliant" as const,
        paymentMethod: "Transfer di luar Rintara",
        paymentTiming: "Setelah pekerjaan selesai",
        riskLevel: "low" as const,
        status: "published" as const,
        publishedAt: new Date("2030-01-01T08:00:00.000Z"),
      };

      await database.transaction(async (tx) => {
        await tx.insert(schema.areas).values({
          id: areaId,
          level: "city_regency",
          code: `integration-${fixtureId}`,
          name: "Kota Integrasi",
        });
        await tx.insert(schema.categories).values({
          id: categoryId,
          slug: `integration-${fixtureId}`,
          name: "Kategori Integrasi",
          riskLevel: "low",
        });
        await tx.insert(schema.users).values([
          {
            id: employerId,
            authSubject: `integration-employer-${fixtureId}`,
            role: "employer",
          },
          {
            id: workerId,
            authSubject: `integration-worker-${fixtureId}`,
            role: "worker",
          },
        ]);
        await tx.insert(schema.employerProfiles).values({
          userId: employerId,
          displayName: "Employer Integrasi",
          employerType: "individual",
          areaId,
        });
        await tx.insert(schema.workerProfiles).values({
          userId: workerId,
          displayName: "Worker Integrasi",
          areaId,
        });
        await tx.insert(schema.jobs).values({
          ...job,
          id: jobId,
          title: "Pekerjaan Integrasi",
          applicationDeadline: new Date(startsAt.getTime() - 86_400_001),
        });
      });

      await expect(
        database.insert(schema.jobs).values({
          ...job,
          id: cutoffJobId,
          title: "Pekerjaan Tepat Cutoff",
          applicationDeadline: new Date(startsAt.getTime() - 86_400_000),
        }).execute(),
      ).rejects.toMatchObject({
        cause: {
          code: "23514",
          constraint_name: "jobs_deadline_before_start_check",
        },
      });

      await expect(
        database.transaction(async (tx) => {
          await tx.insert(schema.applications).values(application);
          await tx.insert(schema.applications).values(application);
        }),
      ).rejects.toMatchObject({
        cause: {
          code: "23505",
          constraint_name: "applications_job_worker_unique",
        },
      });
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
