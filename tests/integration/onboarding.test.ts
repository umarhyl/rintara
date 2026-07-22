import { randomUUID } from "node:crypto";
import { expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { synchronizeIdentityInDatabase } from "@/server/auth/onboarding-transaction";
import type { OnboardingInput } from "@/server/auth/schemas";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";
import {
  areas,
  categories,
  users,
  workerInterests,
  workerProfiles,
} from "@/server/db/schema";
import { queryOnboardingReferenceData } from "@/server/queries/onboarding-reference-data-query";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "onboarding is atomic, idempotent, and role immutable",
  async () => {
    expect(process.env.RINTARA_ENV).toBe("test");
    const client = postgres(getIntegrationDatabaseUrl(), {
      max: 4,
      prepare: false,
      ssl: process.env.TEST_DATABASE_SSL === "disable" ? false : "require",
    });
    const database = drizzle(client, { schema });

    try {
      await migrate(database, { migrationsFolder: "./drizzle" });
      const areaId = randomUUID();
      const inactiveAreaId = randomUUID();
      const provinceId = randomUUID();
      await database.insert(areas).values({
        id: areaId,
        level: "city_regency",
        code: `test-${areaId}`,
        name: "Kota Uji",
      });
      await database.insert(areas).values({
        id: inactiveAreaId,
        level: "city_regency",
        code: `test-${inactiveAreaId}`,
        name: "Kota Uji Nonaktif",
        isActive: false,
      });
      await database.insert(areas).values({
        id: provinceId,
        level: "province",
        code: `test-${provinceId}`,
        name: "Provinsi Uji",
      });

      const activeCategoryIds = [randomUUID(), randomUUID()];
      const inactiveCategoryId = randomUUID();
      await database.insert(categories).values([
        {
          id: activeCategoryIds[0],
          slug: `test-${activeCategoryIds[0]}`,
          name: "Kategori Uji A",
          riskLevel: "low",
          firstOpportunityAllowed: true,
        },
        {
          id: activeCategoryIds[1],
          slug: `test-${activeCategoryIds[1]}`,
          name: "Kategori Uji B",
          riskLevel: "restricted",
          firstOpportunityAllowed: false,
        },
        {
          id: inactiveCategoryId,
          slug: `test-${inactiveCategoryId}`,
          name: "Kategori Uji Nonaktif",
          riskLevel: "low",
          firstOpportunityAllowed: true,
          isActive: false,
        },
      ]);

      const referenceData = await queryOnboardingReferenceData(database);
      expect(referenceData.areas).toContainEqual({ id: areaId, name: "Kota Uji" });
      expect(referenceData.areas.some((area) => area.id === inactiveAreaId)).toBe(false);
      expect(referenceData.areas.some((area) => area.id === provinceId)).toBe(false);
      expect(referenceData.categories).toContainEqual({
        id: activeCategoryIds[0],
        name: "Kategori Uji A",
      });
      expect(
        referenceData.categories.some((category) => category.id === inactiveCategoryId),
      ).toBe(false);

      const authSubject = `auth-${randomUUID()}`;
      const workerInput = {
        role: "worker",
        displayName: "Ayu Pratama",
        areaId,
        bio: null,
        availabilityNote: null,
        categoryInterestIds: activeCategoryIds,
      } satisfies OnboardingInput;

      const first = await synchronizeIdentityInDatabase(
        database,
        authSubject,
        workerInput,
      );
      const retry = await synchronizeIdentityInDatabase(
        database,
        authSubject,
        workerInput,
      );

      expect(retry).toEqual(first);
      expect(
        await database
          .select({ id: users.id })
          .from(users)
          .where(eq(users.authSubject, authSubject)),
      ).toHaveLength(1);
      expect(
        await database
          .select({ categoryId: workerInterests.categoryId })
          .from(workerInterests)
          .where(eq(workerInterests.workerId, first.userId)),
      ).toHaveLength(2);
      expect(
        await database
          .select({ id: workerProfiles.userId })
          .from(workerProfiles)
          .where(eq(workerProfiles.userId, first.userId)),
      ).toHaveLength(1);

      await database
        .update(areas)
        .set({ isActive: false })
        .where(eq(areas.id, areaId));
      expect(
        await synchronizeIdentityInDatabase(
          database,
          authSubject,
          workerInput,
        ),
      ).toEqual(first);

      await expect(
        synchronizeIdentityInDatabase(database, authSubject, {
          role: "employer",
          displayName: "Sinar Event",
          areaId,
          employerType: "business",
          description: null,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await database
        .update(areas)
        .set({ isActive: true })
        .where(eq(areas.id, areaId));

      const inactiveInterestSubject = `auth-${randomUUID()}`;
      await expect(
        synchronizeIdentityInDatabase(database, inactiveInterestSubject, {
          ...workerInput,
          categoryInterestIds: [inactiveCategoryId],
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      expect(
        await database
          .select({ id: users.id })
          .from(users)
          .where(eq(users.authSubject, inactiveInterestSubject)),
      ).toHaveLength(0);

      const invalidAreaSubject = `auth-${randomUUID()}`;
      await expect(
        synchronizeIdentityInDatabase(database, invalidAreaSubject, {
          ...workerInput,
          areaId: provinceId,
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      expect(
        await database
          .select({ id: users.id })
          .from(users)
          .where(eq(users.authSubject, invalidAreaSubject)),
      ).toHaveLength(0);

      const suspendedSubject = `auth-${randomUUID()}`;
      await database.insert(users).values({
        authSubject: suspendedSubject,
        role: "worker",
        status: "suspended",
      });
      await expect(
        synchronizeIdentityInDatabase(database, suspendedSubject, workerInput),
      ).rejects.toMatchObject({ code: "ACCOUNT_INACTIVE" });

      const rollbackSubject = `auth-${randomUUID()}`;
      const invalidProfile = {
        ...workerInput,
        displayName: "x".repeat(121),
      } as OnboardingInput;
      await expect(
        synchronizeIdentityInDatabase(
          database,
          rollbackSubject,
          invalidProfile,
        ),
      ).rejects.toBeDefined();
      expect(
        await database
          .select({ id: users.id })
          .from(users)
          .where(eq(users.authSubject, rollbackSubject)),
      ).toHaveLength(0);
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
