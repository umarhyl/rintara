import { randomUUID } from "node:crypto";
import { expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "lists owned job applicants with authorized Passport data and protects private fields",
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
      const currentCategoryId = randomUUID();
      const otherCategoryId = randomUUID();
      const employerId = randomUUID();
      const otherEmployerId = randomUUID();
      const workerAId = randomUUID();
      const workerBId = randomUUID();
      const jobId = randomUUID();
      const applicationAId = randomUUID();
      const applicationBId = randomUUID();
      const proofJobAId = randomUUID();
      const proofApplicationAId = randomUUID();
      const proofAgreementAId = randomUUID();
      const revokedProofJobId = randomUUID();
      const revokedProofApplicationId = randomUUID();
      const revokedProofAgreementId = randomUUID();
      const proofJobBId = randomUUID();
      const proofApplicationBId = randomUUID();
      const proofAgreementBId = randomUUID();

      const start = new Date("2030-03-10T08:00:00.000Z");
      const deadline = new Date("2030-03-09T08:00:00.000Z");
      const publishedAt = new Date("2030-03-01T08:00:00.000Z");
      const completedAt = new Date("2030-02-01T10:00:00.000Z");

      await database.transaction(async (tx) => {
        await tx.insert(schema.areas).values({
          id: areaId,
          level: "city_regency",
          code: `job-applicants-${fixtureId}`,
          name: "Kota Pelamar",
        });
        await tx.insert(schema.categories).values([
          {
            id: currentCategoryId,
            slug: `current-${fixtureId}`,
            name: "Kategori Saat Ini",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: otherCategoryId,
            slug: `other-${fixtureId}`,
            name: "Kategori Lain",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
        ]);
        await tx.insert(schema.users).values([
          {
            id: employerId,
            authSubject: `applicant-employer-${fixtureId}`,
            role: "employer",
          },
          {
            id: otherEmployerId,
            authSubject: `applicant-other-employer-${fixtureId}`,
            role: "employer",
          },
          {
            id: workerAId,
            authSubject: `applicant-worker-a-${fixtureId}`,
            role: "worker",
          },
          {
            id: workerBId,
            authSubject: `applicant-worker-b-${fixtureId}`,
            role: "worker",
          },
        ]);
        await tx.insert(schema.employerProfiles).values([
          {
            userId: employerId,
            displayName: "Employer Pelamar",
            employerType: "business",
            areaId,
          },
          {
            userId: otherEmployerId,
            displayName: "Employer Lain",
            employerType: "business",
            areaId,
          },
        ]);
        await tx.insert(schema.workerProfiles).values([
          {
            userId: workerAId,
            displayName: "Worker A",
            areaId,
            bio: "Berpengalaman membantu pekerjaan ringan.",
            availabilityNote: "Siap pagi.",
          },
          {
            userId: workerBId,
            displayName: "Worker B",
            areaId,
          },
        ]);
        await tx.insert(schema.workerInterests).values([
          { workerId: workerAId, categoryId: currentCategoryId },
          { workerId: workerAId, categoryId: otherCategoryId },
          { workerId: workerBId, categoryId: currentCategoryId },
        ]);

        const baseJob = {
          employerId,
          areaId,
          description: "Pekerjaan untuk menguji daftar pelamar.",
          taskScope: "Menguji daftar pelamar dan Paspor.",
          publicLocationLabel: "Area Pelamar",
          startsAt: start,
          estimatedMinutes: 120,
          wageAmount: BigInt(180_000),
          wageUnit: "job" as const,
          wageStatus: "compliant" as const,
          paymentMethod: "Transfer di luar Rintara",
          paymentTiming: "Setelah selesai",
          riskLevel: "low" as const,
          visibility: "visible" as const,
          publishedAt,
          completedAt,
        };

        await tx.insert(schema.jobs).values([
          {
            ...baseJob,
            id: jobId,
            categoryId: currentCategoryId,
            title: "Pekerjaan Dengan Pelamar",
            applicationDeadline: deadline,
            status: "published",
            completedAt: null,
            isFirstOpportunity: true,
          },
          {
            ...baseJob,
            id: proofJobAId,
            categoryId: otherCategoryId,
            title: "Bukti Kategori Lain",
            applicationDeadline: new Date("2030-01-30T08:00:00.000Z"),
            status: "completed",
            isFirstOpportunity: false,
          },
          {
            ...baseJob,
            id: revokedProofJobId,
            categoryId: currentCategoryId,
            title: "Bukti Dicabut",
            applicationDeadline: new Date("2030-01-30T08:00:00.000Z"),
            status: "completed",
            isFirstOpportunity: false,
          },
          {
            ...baseJob,
            id: proofJobBId,
            categoryId: currentCategoryId,
            title: "Bukti Kategori Saat Ini",
            applicationDeadline: new Date("2030-01-30T08:00:00.000Z"),
            status: "completed",
            isFirstOpportunity: false,
          },
        ]);
        await tx.insert(schema.jobPrivateDetails).values({
          jobId,
          fullAddress: "Alamat privat tidak boleh bocor",
          arrivalInstructions: "Instruksi privat tidak boleh bocor",
        });
        await tx.insert(schema.applications).values([
          {
            id: applicationAId,
            jobId,
            workerId: workerAId,
            note: "Saya siap membantu sesuai jadwal.",
            firstOpportunityEligibleAtSubmission: true,
          },
          {
            id: applicationBId,
            jobId,
            workerId: workerBId,
            note: "Saya pernah mengerjakan kategori ini.",
            firstOpportunityEligibleAtSubmission: true,
          },
          {
            id: proofApplicationAId,
            jobId: proofJobAId,
            workerId: workerAId,
            note: "Lamaran bukti.",
            firstOpportunityEligibleAtSubmission: true,
            status: "accepted",
            decidedAt: completedAt,
          },
          {
            id: revokedProofApplicationId,
            jobId: revokedProofJobId,
            workerId: workerAId,
            note: "Lamaran bukti dicabut.",
            firstOpportunityEligibleAtSubmission: true,
            status: "accepted",
            decidedAt: completedAt,
          },
          {
            id: proofApplicationBId,
            jobId: proofJobBId,
            workerId: workerBId,
            note: "Lamaran bukti kategori saat ini.",
            firstOpportunityEligibleAtSubmission: true,
            status: "accepted",
            decidedAt: completedAt,
          },
        ]);

        const agreementSnapshot = {
          title: "Snapshot",
          categoryId: currentCategoryId,
          categoryName: "Kategori Saat Ini",
          taskScope: "Snapshot tugas.",
          generalArea: "Area Pelamar",
          fullAddress: "Alamat snapshot privat",
          arrivalInstructions: null,
          startsAt: start.toISOString(),
          estimatedMinutes: 120,
          wageAmount: "180000",
          wageUnit: "job" as const,
          paymentMethod: "Transfer di luar Rintara",
          paymentTiming: "Setelah selesai",
          toolsProvided: null,
          toolsRequired: null,
          cancellationWording: "Batalkan melalui alur berwenang.",
        };

        await tx.insert(schema.agreements).values([
          {
            id: proofAgreementAId,
            applicationId: proofApplicationAId,
            jobId: proofJobAId,
            workerId: workerAId,
            employerId,
            termsSnapshot: {
              ...agreementSnapshot,
              categoryId: otherCategoryId,
              categoryName: "Kategori Lain",
            },
            isFirstOpportunity: false,
            wageStatus: "compliant",
            workerConfirmedAt: completedAt,
            employerConfirmedAt: completedAt,
            status: "completed",
          },
          {
            id: revokedProofAgreementId,
            applicationId: revokedProofApplicationId,
            jobId: revokedProofJobId,
            workerId: workerAId,
            employerId,
            termsSnapshot: agreementSnapshot,
            isFirstOpportunity: false,
            wageStatus: "compliant",
            workerConfirmedAt: completedAt,
            employerConfirmedAt: completedAt,
            status: "completed",
          },
          {
            id: proofAgreementBId,
            applicationId: proofApplicationBId,
            jobId: proofJobBId,
            workerId: workerBId,
            employerId,
            termsSnapshot: agreementSnapshot,
            isFirstOpportunity: false,
            wageStatus: "compliant",
            workerConfirmedAt: completedAt,
            employerConfirmedAt: completedAt,
            status: "completed",
          },
        ]);
        await tx.insert(schema.workProofs).values([
          {
            agreementId: proofAgreementAId,
            workerId: workerAId,
            employerId,
            categoryId: otherCategoryId,
            jobTitleSnapshot: "Bukti Kategori Lain",
            areaLabelSnapshot: "Area Pelamar",
            wageAmountSnapshot: BigInt(180_000),
            wageUnitSnapshot: "job",
            startedAt: new Date("2030-02-01T08:00:00.000Z"),
            completedAt,
          },
          {
            agreementId: revokedProofAgreementId,
            workerId: workerAId,
            employerId,
            categoryId: currentCategoryId,
            jobTitleSnapshot: "Bukti Dicabut",
            areaLabelSnapshot: "Area Pelamar",
            wageAmountSnapshot: BigInt(180_000),
            wageUnitSnapshot: "job",
            startedAt: new Date("2030-02-02T08:00:00.000Z"),
            completedAt: new Date("2030-02-02T10:00:00.000Z"),
            verificationStatus: "revoked",
            revokedAt: new Date("2030-02-03T08:00:00.000Z"),
            revokedBy: employerId,
            revocationReason: "Fixture revoked proof.",
          },
          {
            agreementId: proofAgreementBId,
            workerId: workerBId,
            employerId,
            categoryId: currentCategoryId,
            jobTitleSnapshot: "Bukti Kategori Saat Ini",
            areaLabelSnapshot: "Area Pelamar",
            wageAmountSnapshot: BigInt(180_000),
            wageUnitSnapshot: "job",
            startedAt: new Date("2030-02-04T08:00:00.000Z"),
            completedAt: new Date("2030-02-04T10:00:00.000Z"),
          },
        ]);
      });

      const { getApplicantPassport, listJobApplicants } = await import(
        "@/server/queries/applications/job-applicants"
      );

      const result = await listJobApplicants(jobId, employerId, database);

      expect(result.job.title).toBe("Pekerjaan Dengan Pelamar");
      expect(result.applicants).toHaveLength(2);

      const workerA = result.applicants.find(
        (applicant) => applicant.id === applicationAId,
      );
      const workerB = result.applicants.find(
        (applicant) => applicant.id === applicationBId,
      );

      expect(workerA?.skillInterests.map((skill) => skill.name).sort()).toEqual([
        "Kategori Lain",
        "Kategori Saat Ini",
      ]);
      expect(workerA?.completedJobs).toBe(1);
      expect(workerA?.proofEntries.map((proof) => proof.jobTitle)).toEqual([
        "Bukti Kategori Lain",
      ]);
      expect(workerA?.isEligibleForJobCategoryNow).toBe(true);
      expect(workerB?.completedJobs).toBe(1);
      expect(workerB?.isEligibleForJobCategoryNow).toBe(false);

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("Alamat privat tidak boleh bocor");
      expect(serialized).not.toContain("Instruksi privat tidak boleh bocor");
      expect(serialized).not.toContain("Alamat snapshot privat");
      expect(serialized).not.toContain("Bukti Dicabut");

      await expect(
        listJobApplicants(jobId, otherEmployerId, database),
      ).rejects.toMatchObject({ code: "JOB_NOT_FOUND" });
      await expect(
        getApplicantPassport(jobId, applicationAId, otherEmployerId, database),
      ).rejects.toMatchObject({ code: "JOB_NOT_FOUND" });

      const passport = await getApplicantPassport(
        jobId,
        applicationAId,
        employerId,
        database,
      );
      expect(passport.applicant.id).toBe(applicationAId);
      expect(passport.applicant.proofEntries).toHaveLength(1);
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
