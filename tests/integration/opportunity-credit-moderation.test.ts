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

databaseTest(
  "redeems Opportunity Credit idempotently and applies moderated revocations",
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
      const adminId = randomUUID();
      const sourceJobId = randomUUID();
      const secondSourceJobId = randomUUID();
      const targetJobId = randomUUID();
      const mismatchJobId = randomUUID();
      const applicationId = randomUUID();
      const agreementId = randomUUID();
      const proofId = randomUUID();
      const creditId = randomUUID();
      const conflictingCreditId = randomUUID();
      const now = new Date("2030-06-01T08:00:00.000Z");
      const startsAt = new Date("2030-06-10T08:00:00.000Z");
      const snapshot = {
        title: "Reward Fixture",
        categoryId,
        categoryName: "Kategori Reward",
        taskScope: "Menyelesaikan pekerjaan reward.",
        generalArea: "Area Reward",
        fullAddress: "Jalan Reward Privat 1",
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
          code: `reward-${fixtureId}`,
          name: "Kota Reward",
        });
        await tx.insert(schema.categories).values({
          id: categoryId,
          slug: `reward-${fixtureId}`,
          name: "Kategori Reward",
          riskLevel: "low",
          firstOpportunityAllowed: true,
        });
        await tx.insert(schema.users).values([
          { id: employerId, authSubject: `reward-employer-${fixtureId}`, role: "employer" },
          { id: workerId, authSubject: `reward-worker-${fixtureId}`, role: "worker" },
          { id: adminId, authSubject: `reward-admin-${fixtureId}`, role: "admin" },
        ]);
        await tx.insert(schema.employerProfiles).values({
          userId: employerId,
          displayName: "Employer Reward",
          employerType: "business",
          areaId,
        });
        await tx.insert(schema.workerProfiles).values({
          userId: workerId,
          displayName: "Worker Reward",
          areaId,
        });
        await tx.insert(schema.jobs).values([
          {
            id: sourceJobId,
            employerId,
            categoryId,
            areaId,
            title: "Completed Reward Source",
            description: "Fixture source.",
            taskScope: "Fixture source.",
            publicLocationLabel: "Area Reward",
            startsAt,
            estimatedMinutes: 120,
            wageAmount: BigInt(200_000),
            wageUnit: "job",
            wageStatus: "compliant",
            paymentMethod: "Transfer",
            paymentTiming: "Setelah verifikasi",
            riskLevel: "low",
            isFirstOpportunity: true,
            applicationDeadline: new Date("2030-06-09T08:00:00.000Z"),
            status: "completed",
            visibility: "visible",
            publishedAt: now,
            completedAt: new Date("2030-06-10T11:00:00.000Z"),
          },
          {
            id: secondSourceJobId,
            employerId,
            categoryId,
            areaId,
            title: "Second Reward Source",
            description: "Fixture second source.",
            taskScope: "Fixture second source.",
            publicLocationLabel: "Area Reward",
            startsAt,
            estimatedMinutes: 120,
            wageAmount: BigInt(200_000),
            wageUnit: "job",
            wageStatus: "compliant",
            paymentMethod: "Transfer",
            paymentTiming: "Setelah verifikasi",
            riskLevel: "low",
            isFirstOpportunity: true,
            applicationDeadline: new Date("2030-06-09T08:00:00.000Z"),
            status: "completed",
            visibility: "visible",
            publishedAt: now,
            completedAt: new Date("2030-06-10T11:00:00.000Z"),
          },
          {
            id: targetJobId,
            employerId,
            categoryId,
            areaId,
            title: "Boost Target",
            description: "Fixture target.",
            taskScope: "Fixture target.",
            publicLocationLabel: "Area Reward",
            startsAt,
            estimatedMinutes: 120,
            wageAmount: BigInt(200_000),
            wageUnit: "job",
            wageStatus: "compliant",
            paymentMethod: "Transfer",
            paymentTiming: "Setelah verifikasi",
            riskLevel: "low",
            applicationDeadline: new Date("2030-06-09T08:00:00.000Z"),
            status: "published",
            visibility: "visible",
            publishedAt: now,
          },
          {
            id: mismatchJobId,
            employerId,
            categoryId,
            areaId,
            title: "Mismatched Report Target",
            description: "Fixture mismatch.",
            taskScope: "Fixture mismatch.",
            publicLocationLabel: "Area Reward",
            startsAt,
            estimatedMinutes: 120,
            wageAmount: BigInt(200_000),
            wageUnit: "job",
            wageStatus: "compliant",
            paymentMethod: "Transfer",
            paymentTiming: "Setelah verifikasi",
            riskLevel: "low",
            applicationDeadline: new Date("2030-06-09T08:00:00.000Z"),
            status: "published",
            visibility: "visible",
            publishedAt: now,
          },
        ]);
        await tx.insert(schema.applications).values({
          id: applicationId,
          jobId: sourceJobId,
          workerId,
          note: "Saya siap mengikuti reward.",
          firstOpportunityEligibleAtSubmission: true,
          status: "accepted",
          decidedAt: now,
        });
        await tx.insert(schema.agreements).values({
          id: agreementId,
          applicationId,
          jobId: sourceJobId,
          workerId,
          employerId,
          termsSnapshot: snapshot,
          isFirstOpportunity: true,
          wageStatus: "compliant",
          workerConfirmedAt: now,
          employerConfirmedAt: now,
          status: "completed",
        });
        await tx.insert(schema.workProofs).values({
          id: proofId,
          agreementId,
          workerId,
          employerId,
          categoryId,
          jobTitleSnapshot: "Completed Reward Source",
          areaLabelSnapshot: "Area Reward",
          wageAmountSnapshot: BigInt(200_000),
          wageUnitSnapshot: "job",
          startedAt: startsAt,
          completedAt: new Date("2030-06-10T11:00:00.000Z"),
          verificationStatus: "verified",
        });
        await tx.insert(schema.opportunityCredits).values([
          {
            id: creditId,
            employerId,
            sourceJobId,
            status: "earned",
            earnedAt: now,
          },
          {
            id: conflictingCreditId,
            employerId,
            sourceJobId: secondSourceJobId,
            status: "earned",
            earnedAt: now,
          },
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
        requestId: "reward-employer",
      };
      const workerContext: TestContext = {
        userId: workerId,
        role: "worker",
        accountStatus: "active",
        requestId: "reward-worker",
      };
      const adminContext: TestContext = {
        userId: adminId,
        role: "admin",
        accountStatus: "active",
        requestId: "reward-admin",
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

      const { redeemOpportunityCredit } = await import("@/server/domain/rewards/actions");
      const {
        adminResolveReport,
        adminStartReportReview,
        createReport,
      } = await import("@/server/domain/reports/actions");

      const redemption = await redeemOpportunityCredit({
        creditId,
        jobId: targetJobId,
        idempotencyKey: `redeem-${fixtureId}`,
      });
      const retry = await redeemOpportunityCredit({
        creditId,
        jobId: targetJobId,
        idempotencyKey: `redeem-${fixtureId}`,
      });
      expect(retry).toEqual(redemption);

      const boosts = await database
        .select()
        .from(schema.jobBoosts)
        .where(eq(schema.jobBoosts.creditId, creditId));
      expect(boosts).toHaveLength(1);
      expect(boosts[0]!.endsAt.getTime() - boosts[0]!.startsAt.getTime()).toBe(
        24 * 60 * 60 * 1000,
      );

      await expect(
        redeemOpportunityCredit({
          creditId: conflictingCreditId,
          jobId: targetJobId,
          idempotencyKey: `conflict-${fixtureId}`,
        }),
      ).rejects.toMatchObject({ code: "BOOST_ALREADY_ACTIVE" });

      const [conflictingCredit] = await database
        .select()
        .from(schema.opportunityCredits)
        .where(eq(schema.opportunityCredits.id, conflictingCreditId))
        .limit(1);
      expect(conflictingCredit.status).toBe("earned");

      activeContext = workerContext;
      await expect(
        createReport({
          agreementId,
          jobId: mismatchJobId,
          reason: "terms_mismatch",
          description: "Target campuran tidak cocok.",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      const report = await createReport({
        agreementId,
        reportedUserId: employerId,
        reason: "terms_mismatch",
        description: "Ketentuan setelah pekerjaan tidak sesuai bukti.",
      });

      activeContext = adminContext;
      await adminStartReportReview(report.id);
      await adminResolveReport({
        reportId: report.id,
        outcome: "resolved",
        moderatorNote: "Bukti cocok untuk revokasi reward dan suspensi akun.",
        actions: {
          suspendUser: true,
          revokeWorkProofId: proofId,
          revokeCreditId: creditId,
        },
      });

      const [revokedProof] = await database
        .select()
        .from(schema.workProofs)
        .where(eq(schema.workProofs.id, proofId))
        .limit(1);
      const [revokedCredit] = await database
        .select()
        .from(schema.opportunityCredits)
        .where(eq(schema.opportunityCredits.id, creditId))
        .limit(1);
      const [revokedBoost] = await database
        .select()
        .from(schema.jobBoosts)
        .where(eq(schema.jobBoosts.id, redemption.boostId))
        .limit(1);
      const [suspendedEmployer] = await database
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, employerId))
        .limit(1);

      expect(revokedProof.verificationStatus).toBe("revoked");
      expect(revokedCredit.status).toBe("revoked");
      expect(revokedCredit.redeemedAt).not.toBeNull();
      expect(revokedCredit.targetJobId).toBe(targetJobId);
      expect(revokedBoost.status).toBe("revoked");
      expect(suspendedEmployer.status).toBe("suspended");
    } finally {
      await client.end();
    }
  },
);
