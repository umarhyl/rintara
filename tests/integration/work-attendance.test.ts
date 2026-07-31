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
import { ApplicationError } from "@/server/errors/application-error";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;
process.env.CHECK_IN_CODE_PEPPER =
  "rintara-test-only-check-in-code-pepper-32-characters";

databaseTest(
  "handles check-in code lifecycle, check-out, active report block, and one Work Proof",
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
      const workerId = randomUUID();
      const otherWorkerId = randomUUID();
      const adminId = randomUUID();
      const jobId = randomUUID();
      const otherJobId = randomUUID();
      const applicationId = randomUUID();
      const otherApplicationId = randomUUID();
      const agreementId = randomUUID();
      const otherAgreementId = randomUUID();
      const reportId = randomUUID();
      const startsAt = new Date("2030-05-10T08:00:00.000Z");
      const now = new Date("2030-05-01T08:00:00.000Z");
      const snapshot = {
        title: "Attendance Fixture",
        categoryId,
        categoryName: "Kategori Attendance",
        taskScope: "Menyelesaikan pekerjaan attendance.",
        generalArea: "Area Attendance",
        fullAddress: "Jalan Attendance Privat 1",
        arrivalInstructions: "Masuk dari pintu utama.",
        startsAt: startsAt.toISOString(),
        estimatedMinutes: 120,
        wageAmount: "200000",
        wageUnit: "job" as const,
        paymentMethod: "Transfer di luar Rintara",
        paymentTiming: "Setelah pekerjaan diverifikasi",
        toolsProvided: "Peralatan tersedia",
        toolsRequired: null,
        cancellationWording: "Batalkan melalui alur berwenang.",
      };

      await database.transaction(async (tx) => {
        await tx.insert(schema.areas).values({
          id: areaId,
          level: "city_regency",
          code: `work-${fixtureId}`,
          name: "Kota Work",
        });
        await tx.insert(schema.categories).values({
          id: categoryId,
          slug: `work-${fixtureId}`,
          name: "Kategori Work",
          riskLevel: "low",
          firstOpportunityAllowed: true,
        });
        await tx.insert(schema.users).values([
          { id: employerId, authSubject: `work-employer-${fixtureId}`, role: "employer" },
          { id: workerId, authSubject: `work-worker-${fixtureId}`, role: "worker" },
          { id: otherWorkerId, authSubject: `work-other-worker-${fixtureId}`, role: "worker" },
          { id: adminId, authSubject: `work-admin-${fixtureId}`, role: "admin" },
        ]);
        await tx.insert(schema.employerProfiles).values({
          userId: employerId,
          displayName: "Employer Work",
          employerType: "business",
          areaId,
        });
        await tx.insert(schema.workerProfiles).values([
          { userId: workerId, displayName: "Worker Work", areaId },
          { userId: otherWorkerId, displayName: "Worker Lain", areaId },
        ]);
        await tx.insert(schema.jobs).values([
          {
            id: jobId,
            employerId,
            categoryId,
            areaId,
            title: "Attendance Job",
            description: "Fixture attendance.",
            taskScope: "Fixture attendance.",
            publicLocationLabel: "Area Attendance",
            startsAt,
            estimatedMinutes: 120,
            wageAmount: BigInt(200_000),
            wageUnit: "job",
            wageStatus: "compliant",
            paymentMethod: "Transfer",
            paymentTiming: "Setelah verifikasi",
            riskLevel: "low",
            isFirstOpportunity: true,
            applicationDeadline: new Date("2030-05-08T08:00:00.000Z"),
            status: "filled",
            visibility: "visible",
            publishedAt: now,
          },
          {
            id: otherJobId,
            employerId,
            categoryId,
            areaId,
            title: "Other Attendance Job",
            description: "Fixture attendance kedua.",
            taskScope: "Fixture attendance kedua.",
            publicLocationLabel: "Area Attendance",
            startsAt,
            estimatedMinutes: 120,
            wageAmount: BigInt(200_000),
            wageUnit: "job",
            wageStatus: "compliant",
            paymentMethod: "Transfer",
            paymentTiming: "Setelah verifikasi",
            riskLevel: "low",
            applicationDeadline: new Date("2030-05-08T08:00:00.000Z"),
            status: "filled",
            visibility: "visible",
            publishedAt: now,
          },
        ]);
        await tx.insert(schema.applications).values([
          {
            id: applicationId,
            jobId,
            workerId,
            note: "Saya siap mengikuti attendance.",
            firstOpportunityEligibleAtSubmission: true,
            status: "accepted",
            decidedAt: now,
          },
          {
            id: otherApplicationId,
            jobId: otherJobId,
            workerId: otherWorkerId,
            note: "Saya siap mengikuti attendance lain.",
            firstOpportunityEligibleAtSubmission: true,
            status: "accepted",
            decidedAt: now,
          },
        ]);
        await tx.insert(schema.agreements).values([
          {
            id: agreementId,
            applicationId,
            jobId,
            workerId,
            employerId,
            termsSnapshot: snapshot,
            isFirstOpportunity: true,
            wageStatus: "compliant",
            workerConfirmedAt: now,
            employerConfirmedAt: now,
            status: "active",
          },
          {
            id: otherAgreementId,
            applicationId: otherApplicationId,
            jobId: otherJobId,
            workerId: otherWorkerId,
            employerId,
            termsSnapshot: snapshot,
            isFirstOpportunity: false,
            wageStatus: "compliant",
            workerConfirmedAt: now,
            employerConfirmedAt: now,
            status: "active",
          },
        ]);
        await tx.insert(schema.workSessions).values([
          { agreementId, status: "scheduled" },
          { agreementId: otherAgreementId, status: "scheduled" },
        ]);
      });

      type TestContext = {
        userId: string;
        role: "worker" | "employer" | "admin";
        accountStatus: "active" | "suspended";
        requestId: string;
      };
      const employerContext: TestContext = {
        userId: employerId,
        role: "employer",
        accountStatus: "active",
        requestId: "work-employer",
      };
      const workerContext: TestContext = {
        userId: workerId,
        role: "worker",
        accountStatus: "active",
        requestId: "work-worker",
      };
      const otherWorkerContext: TestContext = {
        userId: otherWorkerId,
        role: "worker",
        accountStatus: "active",
        requestId: "work-other-worker",
      };
      const adminContext: TestContext = {
        userId: adminId,
        role: "admin",
        accountStatus: "active",
        requestId: "work-admin",
      };
      let activeContext: TestContext | null = employerContext;

      mock.module("@/server/auth/identity", () => ({
        requireActiveUser: async () => {
          if (!activeContext) {
            throw new ApplicationError("UNAUTHENTICATED", "Authentication required.");
          }
          if (activeContext.accountStatus !== "active") {
            throw new ApplicationError("ACCOUNT_INACTIVE", "Account inactive.");
          }
          return activeContext;
        },
      }));
      mock.module("@/server/db/client", () => ({ db: database }));

      const {
        checkIn,
        checkOut,
        generateCheckInCode,
        verifyCompletion,
      } = await import("@/server/domain/work/actions");
      const { getAuthorizedWorkEvidence } = await import(
        "@/server/domain/work/evidence"
      );
      const { getWorkView } = await import("@/server/queries/work/get-work-session");
      const { getMyPassport } = await import(
        "@/server/queries/profiles/get-worker-passport"
      );

      const generated = await generateCheckInCode(agreementId);
      expect(generated.code).toMatch(/^\d{6}$/);
      const [codedSession] = await database
        .select()
        .from(schema.workSessions)
        .where(eq(schema.workSessions.agreementId, agreementId))
        .limit(1);
      expect(codedSession.checkInCodeHash).toStartWith("scrypt:");
      expect(codedSession.checkInCodeHash).not.toContain(generated.code);
      expect(codedSession.checkInCodeExpiresAt).not.toBeNull();

      activeContext = otherWorkerContext;
      await expect(
        checkIn({ agreementId: otherAgreementId, code: generated.code }),
      ).rejects.toMatchObject({ code: "CODE_EXPIRED" });

      activeContext = workerContext;
      await expect(checkIn({ agreementId, code: "000000" })).rejects.toMatchObject({
        code: "CODE_INVALID",
      });

      await database
        .update(schema.workSessions)
        .set({ checkInCodeExpiresAt: new Date("2000-01-01T00:00:00.000Z") })
        .where(eq(schema.workSessions.agreementId, agreementId));
      await expect(checkIn({ agreementId, code: generated.code })).rejects.toMatchObject({
        code: "CODE_EXPIRED",
      });

      activeContext = employerContext;
      const replacement = await generateCheckInCode(agreementId);
      activeContext = workerContext;
      const invalidReplacementCode =
        replacement.code === "000000" ? "000001" : "000000";

      for (let attempt = 1; attempt <= 5; attempt += 1) {
        await expect(
          checkIn({ agreementId, code: invalidReplacementCode }),
        ).rejects.toMatchObject({
          code: attempt === 5 ? "CODE_LOCKED" : "CODE_INVALID",
        });
      }
      const [lockedSession] = await database
        .select({
          failedAttempts: schema.workSessions.checkInFailedAttempts,
        })
        .from(schema.workSessions)
        .where(eq(schema.workSessions.agreementId, agreementId))
        .limit(1);
      expect(lockedSession.failedAttempts).toBe(5);
      await expect(
        checkIn({ agreementId, code: replacement.code }),
      ).rejects.toMatchObject({ code: "CODE_LOCKED" });

      activeContext = employerContext;
      const usableReplacement = await generateCheckInCode(agreementId);
      activeContext = workerContext;
      const checkInResult = await checkIn({
        agreementId,
        code: usableReplacement.code,
      });
      expect(checkInResult).toMatchObject({ agreementId, status: "checked_in" });

      const checkedInView = await getWorkView(agreementId);
      expect(checkedInView.session.status).toBe("checked_in");
      expect(checkedInView.jobStatus).toBe("in_progress");
      expect(checkedInView.allowedActions.checkOut).toBe(true);

      await expect(checkIn({ agreementId, code: usableReplacement.code })).rejects.toMatchObject({
        code: "INVALID_STATE_TRANSITION",
      });

      await expect(
        checkOut({
          agreementId,
          completionNote: "Pekerjaan selesai sesuai arahan.",
        }),
      ).rejects.toMatchObject({ code: "WORK_EVIDENCE_REQUIRED" });

      const [activeSession] = await database
        .select({ id: schema.workSessions.id })
        .from(schema.workSessions)
        .where(eq(schema.workSessions.agreementId, agreementId))
        .limit(1);
      await database.insert(schema.workCompletionEvidence).values({
        workSessionId: activeSession.id,
        storagePath: `${agreementId}/integration-fixture.webp`,
        mimeType: "image/webp",
        byteSize: 1024,
        sha256: "a".repeat(64),
        uploadedBy: workerId,
      });

      activeContext = otherWorkerContext;
      await expect(
        getAuthorizedWorkEvidence(agreementId),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      activeContext = employerContext;
      await expect(getAuthorizedWorkEvidence(agreementId)).resolves.toMatchObject({
        mimeType: "image/webp",
        byteSize: 1024,
      });

      activeContext = null;
      await expect(
        getAuthorizedWorkEvidence(agreementId),
      ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

      activeContext = adminContext;
      await expect(getAuthorizedWorkEvidence(agreementId)).resolves.toMatchObject({
        mimeType: "image/webp",
      });

      activeContext = workerContext;
      const checkOutResult = await checkOut({
        agreementId,
        completionNote: "Pekerjaan selesai sesuai arahan.",
      });
      expect(checkOutResult).toMatchObject({ agreementId, status: "checked_out" });

      activeContext = employerContext;
      await database.insert(schema.reports).values({
        id: reportId,
        reporterId: workerId,
        reason: "terms_mismatch",
        description: "Fixture active report.",
        agreementId,
        status: "open",
      });
      await expect(verifyCompletion(agreementId)).rejects.toMatchObject({
        code: "ACTIVE_REPORT_BLOCKS_COMPLETION",
      });

      await database
        .update(schema.reports)
        .set({
          status: "rejected",
          moderatorId: adminId,
          moderatorNote: "Fixture report rejected.",
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.reports.id, reportId));

      const completion = await verifyCompletion(agreementId);
      expect(completion).toMatchObject({
        jobId,
        agreementId,
        credit: {
          issued: true,
        },
      });
      expect(completion.workProofId).toBeString();
      expect(completion.credit.creditId).toBeString();

      const retry = await verifyCompletion(agreementId);
      expect(retry.workProofId).toBe(completion.workProofId);

      const [completedAgreement] = await database
        .select()
        .from(schema.agreements)
        .where(eq(schema.agreements.id, agreementId))
        .limit(1);
      const [completedJob] = await database
        .select()
        .from(schema.jobs)
        .where(eq(schema.jobs.id, jobId))
        .limit(1);
      const [verifiedSession] = await database
        .select()
        .from(schema.workSessions)
        .where(eq(schema.workSessions.agreementId, agreementId))
        .limit(1);
      const proofs = await database
        .select()
        .from(schema.workProofs)
        .where(eq(schema.workProofs.agreementId, agreementId));

      expect(completedAgreement.status).toBe("completed");
      expect(completedJob.status).toBe("completed");
      expect(verifiedSession.status).toBe("verified");
      expect(proofs).toHaveLength(1);
      expect(proofs[0]!.categoryId).toBe(categoryId);

      activeContext = workerContext;
      const passport = await getMyPassport({}, undefined, database);
      expect(passport.summary).toEqual({
        completedJobs: 1,
        verifiedCategoryCount: 1,
      });
      expect(passport.entries).toHaveLength(1);
      expect(passport.entries[0]).toMatchObject({
        id: completion.workProofId,
        categoryId,
        categoryName: "Kategori Work",
        jobTitle: snapshot.title,
        areaLabel: snapshot.generalArea,
        verificationStatus: "verified",
      });
      expect(passport.nextCursor).toBeNull();

      activeContext = employerContext;
      await expect(
        getMyPassport({}, undefined, database),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    } finally {
      await client.end();
    }
  },
);
