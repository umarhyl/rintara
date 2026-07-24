import { randomUUID } from "node:crypto";
import { expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
mock.module("next/cache", () => ({
  revalidatePath: () => {},
}));

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "accepts exactly one application transactionally and creates an immutable agreement snapshot",
  async () => {
    expect(process.env.RINTARA_ENV).toBe("test");

    const client = postgres(getIntegrationDatabaseUrl(), {
      max: 5,
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
      const otherEmployerId = randomUUID();
      const workerAId = randomUUID();
      const workerBId = randomUUID();
      const workerCId = randomUUID();
      const experiencedWorkerId = randomUUID();
      const jobId = randomUUID();
      const rollbackJobId = randomUUID();
      const firstOpportunityJobId = randomUUID();
      const completedJobId = randomUUID();
      const concurrentJobId = randomUUID();
      const applicationAId = randomUUID();
      const applicationBId = randomUUID();
      const rollbackApplicationId = randomUUID();
      const existingRollbackApplicationId = randomUUID();
      const firstOpportunityApplicationId = randomUUID();
      const completedApplicationId = randomUUID();
      const completedAgreementId = randomUUID();
      const existingRollbackAgreementId = randomUUID();
      const concurrentApplicationAId = randomUUID();
      const concurrentApplicationBId = randomUUID();

      const startsAt = new Date("2030-04-10T08:00:00.000Z");
      const deadline = new Date("2030-04-09T08:00:00.000Z");
      const publishedAt = new Date("2030-04-01T08:00:00.000Z");
      const completedAt = new Date("2030-03-01T10:00:00.000Z");

      await database.transaction(async (tx) => {
        await tx.insert(schema.areas).values({
          id: areaId,
          level: "city_regency",
          code: `accept-${fixtureId}`,
          name: "Kota Acceptance",
        });
        await tx.insert(schema.categories).values({
          id: categoryId,
          slug: `accept-${fixtureId}`,
          name: "Kategori Acceptance",
          riskLevel: "low",
          firstOpportunityAllowed: true,
        });
        await tx.insert(schema.users).values([
          {
            id: employerId,
            authSubject: `accept-employer-${fixtureId}`,
            role: "employer",
          },
          {
            id: otherEmployerId,
            authSubject: `accept-other-employer-${fixtureId}`,
            role: "employer",
          },
          {
            id: workerAId,
            authSubject: `accept-worker-a-${fixtureId}`,
            role: "worker",
          },
          {
            id: workerBId,
            authSubject: `accept-worker-b-${fixtureId}`,
            role: "worker",
          },
          {
            id: workerCId,
            authSubject: `accept-worker-c-${fixtureId}`,
            role: "worker",
          },
          {
            id: experiencedWorkerId,
            authSubject: `accept-experienced-${fixtureId}`,
            role: "worker",
          },
        ]);
        await tx.insert(schema.employerProfiles).values([
          {
            userId: employerId,
            displayName: "Employer Acceptance",
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
          { userId: workerAId, displayName: "Worker A", areaId },
          { userId: workerBId, displayName: "Worker B", areaId },
          { userId: workerCId, displayName: "Worker C", areaId },
          {
            userId: experiencedWorkerId,
            displayName: "Worker Berpengalaman",
            areaId,
          },
        ]);

        const baseJob = {
          employerId,
          categoryId,
          areaId,
          description: "Pekerjaan acceptance dengan detail lengkap.",
          taskScope: "Melaksanakan tugas acceptance sesuai arahan.",
          publicLocationLabel: "Area Acceptance",
          startsAt,
          estimatedMinutes: 180,
          wageAmount: BigInt(210_000),
          wageUnit: "job" as const,
          wageStatus: "compliant" as const,
          paymentMethod: "Transfer di luar Rintara",
          paymentTiming: "Setelah pekerjaan diverifikasi",
          toolsProvided: "Peralatan dasar tersedia",
          toolsRequired: "Sepatu nyaman",
          riskLevel: "low" as const,
          status: "published" as const,
          visibility: "visible" as const,
          publishedAt,
          applicationDeadline: deadline,
          isFirstOpportunity: false,
        };

        await tx.insert(schema.jobs).values([
          { ...baseJob, id: jobId, title: "Job Acceptance" },
          { ...baseJob, id: rollbackJobId, title: "Job Rollback" },
          {
            ...baseJob,
            id: firstOpportunityJobId,
            title: "Job Kesempatan Pertama",
            isFirstOpportunity: true,
          },
          {
            ...baseJob,
            id: completedJobId,
            title: "Job Bukti Lama",
            status: "completed",
            completedAt,
            applicationDeadline: new Date("2030-02-28T08:00:00.000Z"),
          },
          { ...baseJob, id: concurrentJobId, title: "Job Concurrent" },
        ]);
        await tx.insert(schema.jobPrivateDetails).values([
          {
            jobId,
            fullAddress: "Jalan Privat Acceptance 1",
            arrivalInstructions: "Masuk dari pagar samping.",
          },
          {
            jobId: rollbackJobId,
            fullAddress: "Jalan Privat Rollback 1",
          },
          {
            jobId: firstOpportunityJobId,
            fullAddress: "Jalan Privat First Opportunity 1",
          },
          {
            jobId: completedJobId,
            fullAddress: "Jalan Privat Bukti Lama 1",
          },
          {
            jobId: concurrentJobId,
            fullAddress: "Jalan Privat Concurrent 1",
          },
        ]);

        await tx.insert(schema.applications).values([
          {
            id: applicationAId,
            jobId,
            workerId: workerAId,
            note: "Saya siap menjalankan pekerjaan acceptance.",
            firstOpportunityEligibleAtSubmission: true,
          },
          {
            id: applicationBId,
            jobId,
            workerId: workerBId,
            note: "Saya juga siap menjalankan pekerjaan acceptance.",
            firstOpportunityEligibleAtSubmission: true,
          },
          {
            id: rollbackApplicationId,
            jobId: rollbackJobId,
            workerId: workerAId,
            note: "Lamaran yang akan membuktikan rollback.",
            firstOpportunityEligibleAtSubmission: true,
          },
          {
            id: existingRollbackApplicationId,
            jobId: rollbackJobId,
            workerId: workerBId,
            note: "Lamaran fixture untuk agreement bentrok.",
            firstOpportunityEligibleAtSubmission: true,
            status: "withdrawn",
            withdrawnAt: completedAt,
          },
          {
            id: firstOpportunityApplicationId,
            jobId: firstOpportunityJobId,
            workerId: experiencedWorkerId,
            note: "Lamaran pekerja yang menjadi tidak eligible.",
            firstOpportunityEligibleAtSubmission: true,
          },
          {
            id: completedApplicationId,
            jobId: completedJobId,
            workerId: experiencedWorkerId,
            note: "Lamaran bukti kerja lama.",
            firstOpportunityEligibleAtSubmission: true,
            status: "accepted",
            decidedAt: completedAt,
          },
          {
            id: concurrentApplicationAId,
            jobId: concurrentJobId,
            workerId: workerAId,
            note: "Lamaran concurrent pertama.",
            firstOpportunityEligibleAtSubmission: true,
          },
          {
            id: concurrentApplicationBId,
            jobId: concurrentJobId,
            workerId: workerCId,
            note: "Lamaran concurrent kedua.",
            firstOpportunityEligibleAtSubmission: true,
          },
        ]);

        const snapshot = {
          title: "Snapshot fixture",
          categoryId,
          categoryName: "Kategori Acceptance",
          taskScope: "Snapshot fixture.",
          generalArea: "Area Acceptance",
          fullAddress: "Jalan Privat Fixture",
          arrivalInstructions: null,
          startsAt: startsAt.toISOString(),
          estimatedMinutes: 180,
          wageAmount: "210000",
          wageUnit: "job" as const,
          paymentMethod: "Transfer di luar Rintara",
          paymentTiming: "Setelah pekerjaan diverifikasi",
          toolsProvided: null,
          toolsRequired: null,
          cancellationWording: "Batalkan melalui alur berwenang.",
        };

        await tx.insert(schema.agreements).values([
          {
            id: completedAgreementId,
            applicationId: completedApplicationId,
            jobId: completedJobId,
            workerId: experiencedWorkerId,
            employerId,
            termsSnapshot: snapshot,
            isFirstOpportunity: false,
            wageStatus: "compliant",
            workerConfirmedAt: completedAt,
            employerConfirmedAt: completedAt,
            status: "completed",
          },
          {
            id: existingRollbackAgreementId,
            applicationId: existingRollbackApplicationId,
            jobId: rollbackJobId,
            workerId: workerBId,
            employerId,
            termsSnapshot: snapshot,
            isFirstOpportunity: false,
            wageStatus: "compliant",
          },
        ]);
        await tx.insert(schema.workProofs).values({
          agreementId: completedAgreementId,
          workerId: experiencedWorkerId,
          employerId,
          categoryId,
          jobTitleSnapshot: "Job Bukti Lama",
          areaLabelSnapshot: "Area Acceptance",
          wageAmountSnapshot: BigInt(210_000),
          wageUnitSnapshot: "job",
          startedAt: new Date("2030-03-01T08:00:00.000Z"),
          completedAt,
        });
      });

      type ActiveContext = {
        userId: string;
        role: "worker" | "employer";
        accountStatus: "active";
        requestId: string;
      };
      const employerContext: ActiveContext = {
        userId: employerId,
        role: "employer",
        accountStatus: "active",
        requestId: "accept-test-req",
      };
      const workerContext: ActiveContext = {
        userId: workerAId,
        role: "worker",
        accountStatus: "active",
        requestId: "accept-test-worker-req",
      };
      const otherEmployerContext: ActiveContext = {
        userId: otherEmployerId,
        role: "employer",
        accountStatus: "active",
        requestId: "accept-test-other-req",
      };
      let activeContext = employerContext;

      mock.module("@/server/auth/identity", () => ({
        requireActiveUser: async () => activeContext,
      }));
      mock.module("@/server/db/client", () => ({ db: database }));

      const { acceptApplication } = await import(
        "@/server/domain/applications/actions"
      );
      const { listPublishedJobs } = await import(
        "@/server/queries/jobs/public-jobs"
      );

      await expect(acceptApplication(applicationAId)).resolves.toMatchObject({
        jobId,
        applicationId: applicationAId,
        jobStatus: "filled",
        agreementStatus: "pending_confirmation",
      });

      const [applicationA] = await database
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, applicationAId))
        .limit(1);
      const [applicationB] = await database
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, applicationBId))
        .limit(1);
      const [acceptedJob] = await database
        .select()
        .from(schema.jobs)
        .where(eq(schema.jobs.id, jobId))
        .limit(1);
      const [agreement] = await database
        .select()
        .from(schema.agreements)
        .where(eq(schema.agreements.jobId, jobId))
        .limit(1);

      expect(applicationA.status).toBe("accepted");
      expect(applicationA.decidedAt).not.toBeNull();
      expect(applicationB.status).toBe("rejected");
      expect(applicationB.decidedAt).not.toBeNull();
      expect(acceptedJob.status).toBe("filled");
      expect(agreement.status).toBe("pending_confirmation");
      expect(agreement.workerId).toBe(workerAId);
      expect(agreement.termsSnapshot.fullAddress).toBe(
        "Jalan Privat Acceptance 1",
      );
      expect(agreement.termsSnapshot.arrivalInstructions).toBe(
        "Masuk dari pagar samping.",
      );

      const notificationRows = await database
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.entityId, agreement.id));
      expect(notificationRows).toHaveLength(2);
      expect(JSON.stringify(notificationRows)).not.toContain(
        "Jalan Privat Acceptance 1",
      );

      const auditRows = await database
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.entityId, applicationAId));
      expect(auditRows).toHaveLength(1);
      expect(JSON.stringify(auditRows)).not.toContain("Jalan Privat Acceptance 1");

      const publicJobs = await listPublishedJobs({}, database);
      expect(JSON.stringify(publicJobs)).not.toContain("Jalan Privat Acceptance 1");

      activeContext = workerContext;
      await expect(acceptApplication(applicationBId)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      activeContext = otherEmployerContext;
      await expect(acceptApplication(applicationBId)).rejects.toMatchObject({
        code: "JOB_NOT_FOUND",
      });

      activeContext = employerContext;
      await expect(acceptApplication(applicationBId)).rejects.toMatchObject({
        code: "APPLICATION_NOT_SUBMITTED",
      });
      await expect(
        acceptApplication(firstOpportunityApplicationId),
      ).rejects.toMatchObject({ code: "FIRST_OPPORTUNITY_INELIGIBLE" });

      await expect(acceptApplication(rollbackApplicationId)).rejects.toMatchObject({
        code: "CONCURRENT_ACCEPTANCE_CONFLICT",
      });
      const [rollbackApplication] = await database
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, rollbackApplicationId))
        .limit(1);
      const [rollbackJob] = await database
        .select()
        .from(schema.jobs)
        .where(eq(schema.jobs.id, rollbackJobId))
        .limit(1);
      const rollbackNotifications = await database
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.entityId, existingRollbackAgreementId));
      const rollbackAuditRows = await database
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.entityId, rollbackApplicationId));

      expect(rollbackApplication.status).toBe("submitted");
      expect(rollbackApplication.decidedAt).toBeNull();
      expect(rollbackJob.status).toBe("published");
      expect(rollbackNotifications).toHaveLength(0);
      expect(rollbackAuditRows).toHaveLength(0);

      const concurrentResults = await Promise.allSettled([
        acceptApplication(concurrentApplicationAId),
        acceptApplication(concurrentApplicationBId),
      ]);
      expect(
        concurrentResults.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);

      const concurrentApplications = await database
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.jobId, concurrentJobId));
      const acceptedConcurrentApplications = concurrentApplications.filter(
        (application) => application.status === "accepted",
      );
      const concurrentAgreements = await database
        .select()
        .from(schema.agreements)
        .where(eq(schema.agreements.jobId, concurrentJobId));

      expect(acceptedConcurrentApplications).toHaveLength(1);
      expect(concurrentAgreements).toHaveLength(1);
      expect(
        concurrentApplications.filter(
          (application) => application.status === "rejected",
        ),
      ).toHaveLength(1);
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
