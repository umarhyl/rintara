import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";

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

    try {
      await migrate(drizzle(client), { migrationsFolder: "./drizzle" });

      const indexes = await client<{ indexname: string }[]>`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname IN (
            'applications_job_worker_unique',
            'applications_one_accepted_per_job',
            'work_proofs_agreement_unique',
            'opportunity_credits_source_job_unique'
          )
      `;

      expect(indexes.map((row) => row.indexname).sort()).toEqual([
        "applications_job_worker_unique",
        "applications_one_accepted_per_job",
        "opportunity_credits_source_job_unique",
        "work_proofs_agreement_unique",
      ]);
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
