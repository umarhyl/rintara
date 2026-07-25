import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { publicJobCardProjection } from "@/server/queries/public-job-projection";
import {
  applications,
  agreements,
  jobBoosts,
  jobPrivateDetails,
  jobs,
  opportunityCredits,
  workProofs,
  workSessions,
} from "@/server/db/schema";

describe("database schema invariants", () => {
  test("defines all one-to-one and one-source uniqueness boundaries", () => {
    const applicationIndexes = getTableConfig(applications).indexes.map(
      (index) => index.config.name,
    );
    const agreementIndexes = getTableConfig(agreements).indexes.map(
      (index) => index.config.name,
    );
    const sessionIndexes = getTableConfig(workSessions).indexes.map(
      (index) => index.config.name,
    );
    const proofIndexes = getTableConfig(workProofs).indexes.map(
      (index) => index.config.name,
    );
    const creditIndexes = getTableConfig(opportunityCredits).indexes.map(
      (index) => index.config.name,
    );
    const boostIndexes = getTableConfig(jobBoosts).indexes.map(
      (index) => index.config.name,
    );

    expect(applicationIndexes).toContain("applications_job_worker_unique");
    expect(applicationIndexes).toContain("applications_one_accepted_per_job");
    expect(agreementIndexes).toContain("agreements_application_unique");
    expect(agreementIndexes).toContain("agreements_job_unique");
    expect(sessionIndexes).toContain("work_sessions_agreement_unique");
    expect(proofIndexes).toContain("work_proofs_agreement_unique");
    expect(creditIndexes).toContain("opportunity_credits_source_job_unique");
    expect(boostIndexes).toContain("job_boosts_credit_unique");
  });

  test("keeps private job details in a separate table", () => {
    const publicColumns = Object.keys(jobs);
    const privateColumns = Object.keys(jobPrivateDetails);

    expect(publicColumns).not.toContain("fullAddress");
    expect(publicColumns).not.toContain("arrivalInstructions");
    expect(privateColumns).toContain("fullAddress");
    expect(privateColumns).toContain("arrivalInstructions");
  });

  test("public job projection excludes all private location fields", () => {
    const projectionFields = Object.keys(publicJobCardProjection);

    expect(projectionFields).not.toContain("fullAddress");
    expect(projectionFields).not.toContain("arrivalInstructions");
    expect(projectionFields).not.toContain("hiddenReason");
    expect(projectionFields).not.toContain("employerId");
  });

  test("public job queries never reference private job details", async () => {
    const source = await Bun.file("server/queries/jobs/public-jobs.ts").text();

    expect(source).not.toMatch(/jobPrivateDetails|job_private_details/);
  });

  test("generated migration contains critical PostgreSQL constraints", () => {
    const migrationDirectory = join(process.cwd(), "drizzle");
    const migrationFiles = readdirSync(migrationDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    expect(migrationFiles.length).toBeGreaterThan(0);

    const migrationSql = migrationFiles
      .map((file) => readFileSync(join(migrationDirectory, file), "utf8"))
      .join("\n");

    expect(migrationSql).toContain("applications_one_accepted_per_job");
    expect(migrationSql).toMatch(
      /WHERE "applications"\."status" = 'accepted'/,
    );
    expect(migrationSql).toContain("jobs_wage_amount_positive_check");
    expect(migrationSql).toContain("reports_has_target_check");
    expect(migrationSql).toContain("job_boosts_exact_duration_check");
  });
});
