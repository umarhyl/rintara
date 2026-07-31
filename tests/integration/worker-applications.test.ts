import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { expect, mock, test } from "bun:test";

mock.module("server-only", () => {
  return {};
});
mock.module("next/cache", () => {
  return {
    revalidatePath: () => {},
  };
});

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "supports worker applications and rejects invalid application attempts",
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
      const employerId = randomUUID();
      const workerId = randomUUID();
      const experiencedWorkerId = randomUUID();
      const normalJobId = randomUUID();
      const lateJobId = randomUUID();
      const firstOpportunityJobId = randomUUID();
      const previousJobId = randomUUID();
      const previousApplicationId = randomUUID();
      const previousAgreementId = randomUUID();
      const paginatedApplicationId = randomUUID();

      const futureStart = new Date("2030-02-10T08:00:00.000Z");
      const futureDeadline = new Date("2030-02-08T08:00:00.000Z");
      const pastDeadline = new Date("2020-02-09T08:00:00.000Z");
      const now = new Date("2030-01-01T08:00:00.000Z");

      await database.transaction(async (tx) => {
        await tx.insert(schema.areas).values({
          id: areaId,
          level: "city_regency",
          code: `application-${fixtureId}`,
          name: "Kota Lamaran",
        });
        await tx.insert(schema.categories).values({
          id: categoryId,
          slug: `application-${fixtureId}`,
          name: "Kategori Lamaran",
          riskLevel: "low",
          firstOpportunityAllowed: true,
        });
        await tx.insert(schema.users).values([
          {
            id: employerId,
            authSubject: `application-employer-${fixtureId}`,
            role: "employer",
          },
          {
            id: workerId,
            authSubject: `application-worker-${fixtureId}`,
            role: "worker",
          },
          {
            id: experiencedWorkerId,
            authSubject: `application-experienced-${fixtureId}`,
            role: "worker",
          },
        ]);
        await tx.insert(schema.employerProfiles).values({
          userId: employerId,
          displayName: "Employer Lamaran",
          employerType: "business",
          areaId,
        });
        await tx.insert(schema.workerProfiles).values([
          {
            userId: workerId,
            displayName: "Worker Lamaran",
            areaId,
          },
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
          description:
            "Pekerjaan pengujian lamaran dengan ketentuan lengkap.",
          taskScope: "Melakukan tugas sesuai arahan\nMelaporkan penyelesaian",
          publicLocationLabel: "Area Lamaran",
          startsAt: futureStart,
          estimatedMinutes: 120,
          wageAmount: BigInt(150_000),
          wageUnit: "job" as const,
          wageStatus: "compliant" as const,
          paymentMethod: "Transfer setelah pekerjaan",
          paymentTiming: "Setelah selesai",
          riskLevel: "low" as const,
          status: "published" as const,
          visibility: "visible" as const,
          publishedAt: now,
        };

        await tx.insert(schema.jobs).values([
          {
            ...baseJob,
            id: normalJobId,
            title: "Pekerjaan Lamaran Normal",
            applicationDeadline: futureDeadline,
            isFirstOpportunity: false,
          },
          {
            ...baseJob,
            id: lateJobId,
            title: "Pekerjaan Lamaran Terlambat",
            applicationDeadline: pastDeadline,
            isFirstOpportunity: false,
          },
          {
            ...baseJob,
            id: firstOpportunityJobId,
            title: "Pekerjaan Kesempatan Pertama",
            applicationDeadline: futureDeadline,
            isFirstOpportunity: true,
          },
          {
            ...baseJob,
            id: previousJobId,
            title: "Pekerjaan Bukti Sebelumnya",
            applicationDeadline: futureDeadline,
            isFirstOpportunity: false,
            status: "completed",
            completedAt: now,
          },
        ]);

        await tx.insert(schema.applications).values({
          id: previousApplicationId,
          jobId: previousJobId,
          workerId: experiencedWorkerId,
          note: "Lamaran sebelumnya untuk membuat bukti kerja.",
          firstOpportunityEligibleAtSubmission: true,
          status: "accepted",
          decidedAt: now,
        });
        await tx.insert(schema.agreements).values({
          id: previousAgreementId,
          applicationId: previousApplicationId,
          jobId: previousJobId,
          workerId: experiencedWorkerId,
          employerId,
          termsSnapshot: {
            title: "Pekerjaan Bukti Sebelumnya",
            categoryId,
            categoryName: "Kategori Lamaran",
            taskScope: "Melakukan tugas sesuai arahan",
            generalArea: "Area Lamaran",
            fullAddress: "Alamat privat fixture",
            arrivalInstructions: null,
            startsAt: futureStart.toISOString(),
            estimatedMinutes: 120,
            wageAmount: "150000",
            wageUnit: "job",
            paymentMethod: "Transfer setelah pekerjaan",
            paymentTiming: "Setelah selesai",
            toolsProvided: null,
            toolsRequired: null,
            cancellationWording: "Batalkan melalui alur berwenang.",
          },
          isFirstOpportunity: false,
          wageStatus: "compliant",
          workerConfirmedAt: now,
          employerConfirmedAt: now,
          status: "completed",
        });
        await tx.insert(schema.workProofs).values({
          agreementId: previousAgreementId,
          workerId: experiencedWorkerId,
          employerId,
          categoryId,
          jobTitleSnapshot: "Pekerjaan Bukti Sebelumnya",
          areaLabelSnapshot: "Area Lamaran",
          wageAmountSnapshot: BigInt(150_000),
          wageUnitSnapshot: "job",
          startedAt: new Date("2029-12-01T08:00:00.000Z"),
          completedAt: new Date("2029-12-01T10:00:00.000Z"),
        });
      });

      const workerContext = {
        userId: workerId,
        role: "worker" as const,
        accountStatus: "active" as const,
        requestId: "test-req",
      };
      const employerContext = {
        userId: employerId,
        role: "employer" as const,
        accountStatus: "active" as const,
        requestId: "test-req",
      };
      const experiencedWorkerContext = {
        userId: experiencedWorkerId,
        role: "worker" as const,
        accountStatus: "active" as const,
        requestId: "test-req",
      };
      let activeContext: typeof workerContext | typeof employerContext =
        workerContext;

      mock.module("@/server/auth/identity", () => {
        return {
          requireActiveUser: async () => activeContext,
        };
      });
      mock.module("@/server/db/client", () => {
        return { db: database };
      });

      const { submitApplication, withdrawApplication } = await import(
        "@/server/domain/applications/actions"
      );
      const { listMyApplications } = await import(
        "@/server/queries/applications/worker-applications"
      );
      const { getWorkerJobApplicationState } = await import(
        "@/server/queries/applications/worker-job-application"
      );
      const { listMyNotifications } = await import(
        "@/server/queries/notifications"
      );
      const { markAllNotificationsRead, markNotificationRead } = await import(
        "@/server/domain/notifications/actions"
      );

      await expect(
        submitApplication("not-a-job-id", {
          note: "Catatan ini valid tetapi pengenal pekerjaannya tidak valid.",
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      await expect(
        withdrawApplication("not-an-application-id"),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      await expect(
        getWorkerJobApplicationState(
          "not-a-job-id",
          workerContext,
          database,
          now,
        ),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });

      await expect(
        getWorkerJobApplicationState(
          normalJobId,
          workerContext,
          database,
          now,
        ),
      ).resolves.toEqual({ state: "eligible" });
      await expect(
        getWorkerJobApplicationState(
          firstOpportunityJobId,
          experiencedWorkerContext,
          database,
          now,
        ),
      ).resolves.toEqual({ state: "ineligible" });
      await expect(
        getWorkerJobApplicationState(
          previousJobId,
          experiencedWorkerContext,
          database,
          now,
        ),
      ).resolves.toEqual({
        state: "existing",
        applicationStatus: "accepted",
        agreementId: previousAgreementId,
      });
      await expect(
        getWorkerJobApplicationState(
          lateJobId,
          workerContext,
          database,
          now,
        ),
      ).resolves.toEqual({ state: "unavailable" });
      await expect(
        getWorkerJobApplicationState(
          randomUUID(),
          workerContext,
          database,
          now,
        ),
      ).resolves.toEqual({ state: "unavailable" });
      await expect(
        getWorkerJobApplicationState(
          normalJobId,
          employerContext,
          database,
          now,
        ),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      const experiencedHistory = await listMyApplications(
        {},
        experiencedWorkerContext,
        database,
        now,
      );
      expect(experiencedHistory.items).toHaveLength(1);
      expect(experiencedHistory.items[0]).toMatchObject({
        id: previousApplicationId,
        publicDetailAvailable: false,
      });

      const application = await submitApplication(normalJobId, {
        note: "Saya tersedia sesuai jadwal dan siap mengikuti arahan tugas.",
      });
      expect(application.status).toBe("submitted");
      await expect(
        getWorkerJobApplicationState(
          normalJobId,
          workerContext,
          database,
          now,
        ),
      ).resolves.toEqual({
        state: "existing",
        applicationStatus: "submitted",
      });

      const notificationsAfterSubmission = await listMyNotifications(
        {},
        employerContext,
        database,
      );
      expect(notificationsAfterSubmission.items).toHaveLength(1);
      expect(notificationsAfterSubmission.items[0]).toMatchObject({
        type: "application_submitted",
        title: "Lamaran baru diterima",
        href: `/employer/jobs/${normalJobId}/applicants`,
      });
      expect(notificationsAfterSubmission.items[0]!.body).toContain(
        "Pekerjaan Lamaran Normal",
      );
      expect(notificationsAfterSubmission.items[0]!.body).not.toContain(
        "Saya tersedia",
      );
      expect(notificationsAfterSubmission.items[0]!.body).not.toContain(
        "Alamat privat",
      );
      activeContext = employerContext;
      await markNotificationRead(notificationsAfterSubmission.items[0]!.id);
      const notificationsAfterRead = await listMyNotifications(
        {},
        employerContext,
        database,
      );
      expect(notificationsAfterRead.unreadCount).toBe(0);
      expect(notificationsAfterRead.items[0]!.readAt).not.toBeNull();
      await expect(
        markNotificationRead(notificationsAfterSubmission.items[0]!.id),
      ).resolves.toMatchObject({
        notificationId: notificationsAfterSubmission.items[0]!.id,
      });
      activeContext = workerContext;
      const submissionAuditRows = await database
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.entityId, application.applicationId));
      expect(submissionAuditRows).toHaveLength(1);
      expect(submissionAuditRows[0]).toMatchObject({
        actorId: workerId,
        action: "submit_application",
        entityType: "application",
      });
      expect(JSON.stringify(submissionAuditRows[0]!.metadata)).not.toContain(
        "Saya tersedia",
      );

      await database.insert(schema.applications).values({
        id: paginatedApplicationId,
        jobId: firstOpportunityJobId,
        workerId,
        note: "Lamaran kedua untuk memverifikasi cursor pagination.",
        firstOpportunityEligibleAtSubmission: true,
        submittedAt: new Date("2020-01-01T08:00:00.000Z"),
      });

      const firstPage = await listMyApplications(
        { limit: 1 },
        undefined,
        database,
        now,
      );
      expect(firstPage.items).toHaveLength(1);
      expect(firstPage.items[0]!.id).toBe(application.applicationId);
      expect(firstPage.items[0]!.jobTitle).toBe("Pekerjaan Lamaran Normal");
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await listMyApplications(
        { cursor: firstPage.nextCursor!, limit: 1 },
        undefined,
        database,
        now,
      );
      expect(secondPage.items.map(({ id }) => id)).toEqual([
        paginatedApplicationId,
      ]);
      expect(secondPage.nextCursor).toBeNull();

      await expect(
        listMyApplications(
          { cursor: "not-a-cursor" },
          workerContext,
          database,
        ),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      await expect(
        listMyApplications(
          {
            cursor: Buffer.from(
              JSON.stringify(["2020-01-01T08:00:00.000Z", "not-a-uuid"]),
              "utf8",
            ).toString("base64url"),
          },
          workerContext,
          database,
        ),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      await expect(
        listMyApplications({}, employerContext, database),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        listMyApplications(
          {},
          { ...workerContext, accountStatus: "suspended" },
          database,
        ),
      ).rejects.toMatchObject({ code: "ACCOUNT_INACTIVE" });

      await expect(
        submitApplication(normalJobId, {
          note: "Saya mencoba mengirim lamaran kedua untuk pekerjaan sama.",
        }),
      ).rejects.toMatchObject({ code: "APPLICATION_ALREADY_EXISTS" });
      expect(
        (await listMyNotifications({}, employerContext, database)).items,
      ).toHaveLength(1);

      await expect(
        submitApplication(lateJobId, {
          note: "Saya terlambat melamar pekerjaan ini.",
        }),
      ).rejects.toMatchObject({ code: "JOB_NOT_AVAILABLE" });

      activeContext = employerContext;
      await expect(
        submitApplication(firstOpportunityJobId, {
          note: "Akun pemberi kerja tidak boleh melamar pekerjaan.",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      activeContext = experiencedWorkerContext;
      await expect(
        submitApplication(firstOpportunityJobId, {
          note: "Saya sudah punya bukti kerja untuk kategori ini.",
        }),
      ).rejects.toMatchObject({ code: "FIRST_OPPORTUNITY_INELIGIBLE" });

      activeContext = workerContext;
      const withdrawn = await withdrawApplication(application.applicationId);
      expect(withdrawn.status).toBe("withdrawn");

      const [withdrawnRow] = await database
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, application.applicationId))
        .limit(1);
      expect(withdrawnRow.status).toBe("withdrawn");
      expect(withdrawnRow.withdrawnAt).not.toBeNull();

      const notificationsAfterWithdrawal = await listMyNotifications(
        {},
        employerContext,
        database,
      );
      expect(notificationsAfterWithdrawal.items).toHaveLength(2);
      expect(notificationsAfterWithdrawal.items[0]).toMatchObject({
        type: "application_withdrawn",
        title: "Lamaran ditarik",
        href: `/employer/jobs/${normalJobId}/applicants`,
      });
      expect(notificationsAfterWithdrawal.items[0]!.body).not.toContain(
        "Saya tersedia",
      );
      activeContext = employerContext;
      await expect(markAllNotificationsRead()).resolves.toMatchObject({
        updatedCount: 1,
      });
      expect(
        (await listMyNotifications({}, employerContext, database)).unreadCount,
      ).toBe(0);
      activeContext = workerContext;
      const applicationAuditRows = await database
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.entityId, application.applicationId));
      expect(
        applicationAuditRows.map(({ action }) => action).sort(),
      ).toEqual(["submit_application", "withdraw_application"]);

      await expect(
        getWorkerJobApplicationState(
          normalJobId,
          workerContext,
          database,
          now,
        ),
      ).resolves.toEqual({
        state: "eligible",
        isResubmission: true,
      });

      const replacementNote =
        "Saya memperbaiki catatan dan tetap tersedia mengikuti seluruh jadwal.";
      const resubmitted = await submitApplication(normalJobId, {
        note: replacementNote,
      });
      expect(resubmitted).toEqual({
        applicationId: application.applicationId,
        status: "submitted",
      });

      const [resubmittedRow] = await database
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, application.applicationId))
        .limit(1);
      expect(resubmittedRow).toMatchObject({
        id: application.applicationId,
        status: "submitted",
        note: replacementNote,
        withdrawnAt: null,
        decidedAt: null,
      });

      const notificationsAfterResubmission = await listMyNotifications(
        {},
        employerContext,
        database,
      );
      expect(notificationsAfterResubmission.items).toHaveLength(3);
      expect(notificationsAfterResubmission.items[0]).toMatchObject({
        type: "application_submitted",
        title: "Lamaran dikirim ulang",
        href: `/employer/jobs/${normalJobId}/applicants`,
      });
      expect(notificationsAfterResubmission.items[0]!.body).not.toContain(
        replacementNote,
      );

      const activeApplications = await listMyApplications(
        { view: "active" },
        workerContext,
        database,
        now,
      );
      expect(activeApplications.items.map(({ id }) => id)).toContain(
        application.applicationId,
      );
      const historicalApplications = await listMyApplications(
        { view: "history" },
        workerContext,
        database,
        now,
      );
      expect(historicalApplications.items.map(({ id }) => id)).not.toContain(
        application.applicationId,
      );

      await expect(
        withdrawApplication(application.applicationId),
      ).resolves.toMatchObject({ status: "withdrawn" });
      await expect(
        withdrawApplication(application.applicationId),
      ).rejects.toMatchObject({ code: "APPLICATION_NOT_WITHDRAWABLE" });
      expect(
        (await listMyNotifications({}, employerContext, database)).items,
      ).toHaveLength(4);
      expect(
        (
          await database
            .select()
            .from(schema.auditLogs)
            .where(eq(schema.auditLogs.entityId, application.applicationId))
        ).map(({ action }) => action).sort(),
      ).toEqual([
        "resubmit_application",
        "submit_application",
        "withdraw_application",
        "withdraw_application",
      ]);
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
