import { randomUUID } from "node:crypto";
import { expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { synchronizeIdentityInDatabase } from "@/server/auth/onboarding-transaction";
import type { RequestContext } from "@/server/auth/types";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";
import { areas, categories } from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "reads and updates only the authenticated worker profile",
  async () => {
    expect(process.env.RINTARA_ENV).toBe("test");
    const client = postgres(getIntegrationDatabaseUrl(), {
      max: 1,
      prepare: false,
      ssl: process.env.TEST_DATABASE_SSL === "disable" ? false : "require",
    });
    const database = drizzle(client, { schema });

    try {
      const { updateWorkerProfileInDatabase } = await import(
        "@/server/domain/profiles/worker-profile"
      );
      const { queryWorkerProfile } = await import(
        "@/server/queries/profiles/get-worker-profile"
      );
      await migrate(database, { migrationsFolder: "./drizzle" });

      const fixtureId = randomUUID();
      const areaAId = randomUUID();
      const areaBId = randomUUID();
      const inactiveAreaId = randomUUID();
      const provinceAreaId = randomUUID();
      const categoryAId = randomUUID();
      const categoryBId = randomUUID();
      const inactiveCategoryId = randomUUID();

      await database.insert(areas).values([
        {
          id: areaAId,
          level: "city_regency",
          code: `worker-a-${fixtureId}`,
          name: "Kota Worker A",
        },
        {
          id: areaBId,
          level: "city_regency",
          code: `worker-b-${fixtureId}`,
          name: "Kota Worker B",
        },
        {
          id: inactiveAreaId,
          level: "city_regency",
          code: `worker-inactive-${fixtureId}`,
          name: "Kota Worker Nonaktif",
          isActive: false,
        },
        {
          id: provinceAreaId,
          level: "province",
          code: `worker-province-${fixtureId}`,
          name: "Provinsi Worker",
        },
      ]);
      await database.insert(categories).values([
        {
          id: categoryAId,
          slug: `worker-a-${fixtureId}`,
          name: "Kategori Worker A",
          riskLevel: "low",
        },
        {
          id: categoryBId,
          slug: `worker-b-${fixtureId}`,
          name: "Kategori Worker B",
          riskLevel: "low",
        },
        {
          id: inactiveCategoryId,
          slug: `worker-inactive-${fixtureId}`,
          name: "Kategori Worker Nonaktif",
          riskLevel: "low",
          isActive: false,
        },
      ]);

      const workerA = await synchronizeIdentityInDatabase(
        database,
        `worker-a-${fixtureId}`,
        {
          role: "worker",
          displayName: "Worker A",
          areaId: areaAId,
          bio: null,
          availabilityNote: null,
          categoryInterestIds: [categoryAId],
        },
      );
      const workerB = await synchronizeIdentityInDatabase(
        database,
        `worker-b-${fixtureId}`,
        {
          role: "worker",
          displayName: "Worker B",
          areaId: areaAId,
          bio: null,
          availabilityNote: null,
          categoryInterestIds: [categoryBId],
        },
      );
      const employer = await synchronizeIdentityInDatabase(
        database,
        `employer-${fixtureId}`,
        {
          role: "employer",
          displayName: "Employer Uji",
          areaId: areaAId,
          employerType: "individual",
          description: null,
        },
      );

      const context = (
        userId: string,
        role: RequestContext["role"],
        accountStatus: RequestContext["accountStatus"] = "active",
      ): RequestContext => ({
        userId,
        role,
        accountStatus,
        requestId: `request-${fixtureId}`,
      });
      const workerAContext = context(workerA.userId, "worker");
      const workerBContext = context(workerB.userId, "worker");
      const employerContext = context(employer.userId, "employer");

      expect(await queryWorkerProfile(database, workerAContext)).toMatchObject({
        userId: workerA.userId,
        displayName: "Worker A",
        areaId: areaAId,
        categoryInterests: [{ id: categoryAId, isActive: true }],
      });

      await updateWorkerProfileInDatabase(database, workerAContext, {
        displayName: "Worker A Diperbarui",
        areaId: areaBId,
        bio: "Profil sintetis yang diperbarui.",
        availabilityNote: "Tersedia pada akhir pekan.",
        categoryInterestIds: [categoryAId, categoryBId],
      });

      const updated = await queryWorkerProfile(database, workerAContext);
      expect(updated).toMatchObject({
        displayName: "Worker A Diperbarui",
        areaId: areaBId,
        areaName: "Kota Worker B",
        bio: "Profil sintetis yang diperbarui.",
        availabilityNote: "Tersedia pada akhir pekan.",
      });
      expect(updated.categoryInterests.map((category) => category.id)).toEqual([
        categoryAId,
        categoryBId,
      ]);

      const workerBBefore = await queryWorkerProfile(database, workerBContext);
      expect(workerBBefore.displayName).toBe("Worker B");

      await expect(
        updateWorkerProfileInDatabase(database, employerContext, {
          displayName: "Tidak Diizinkan",
          areaId: areaAId,
          bio: null,
          availabilityNote: null,
          categoryInterestIds: [],
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        updateWorkerProfileInDatabase(
          database,
          context(workerA.userId, "worker", "suspended"),
          {
            displayName: "Tidak Diizinkan",
            areaId: areaAId,
            bio: null,
            availabilityNote: null,
            categoryInterestIds: [],
          },
        ),
      ).rejects.toMatchObject({ code: "ACCOUNT_INACTIVE" });

      await expect(
        updateWorkerProfileInDatabase(database, workerAContext, {
          displayName: "Tidak Boleh Tersimpan",
          areaId: areaAId,
          bio: null,
          availabilityNote: null,
          categoryInterestIds: [inactiveCategoryId],
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      await expect(
        updateWorkerProfileInDatabase(database, workerAContext, {
          displayName: "Tidak Boleh Tersimpan",
          areaId: inactiveAreaId,
          bio: null,
          availabilityNote: null,
          categoryInterestIds: [],
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      await expect(
        updateWorkerProfileInDatabase(database, workerAContext, {
          displayName: "Tidak Boleh Tersimpan",
          areaId: provinceAreaId,
          bio: null,
          availabilityNote: null,
          categoryInterestIds: [],
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });

      expect(await queryWorkerProfile(database, workerAContext)).toEqual(updated);
      expect(await queryWorkerProfile(database, workerBContext)).toEqual(
        workerBBefore,
      );

      await updateWorkerProfileInDatabase(database, workerAContext, {
        displayName: updated.displayName,
        areaId: updated.areaId,
        bio: updated.bio,
        availabilityNote: updated.availabilityNote,
        categoryInterestIds: [],
      });
      expect(
        (await queryWorkerProfile(database, workerAContext)).categoryInterests,
      ).toEqual([]);
      expect(await queryWorkerProfile(database, workerBContext)).toEqual(
        workerBBefore,
      );
      await expect(
        queryWorkerProfile(database, employerContext),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
