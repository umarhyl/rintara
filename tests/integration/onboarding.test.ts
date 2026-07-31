import { randomUUID } from "node:crypto";
import { expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
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
  employerProfiles,
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
    const createdAreaIds: string[] = [];
    const createdCategoryIds: string[] = [];
    const createdAuthSubjects: string[] = [];

    try {
      await migrate(database, { migrationsFolder: "./drizzle" });
      const areaId = randomUUID();
      const inactiveAreaId = randomUUID();
      const provinceId = randomUUID();
      createdAreaIds.push(areaId, inactiveAreaId, provinceId);
      await database.insert(areas).values({
        id: areaId,
        level: "city_regency",
        code: `test-${areaId}`,
        name: `000 Kota Uji ${areaId}`,
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
      createdCategoryIds.push(...activeCategoryIds, inactiveCategoryId);
      await database.insert(categories).values([
        {
          id: activeCategoryIds[0],
          slug: `test-${activeCategoryIds[0]}`,
          name: `000 Kategori Uji A ${activeCategoryIds[0]}`,
          riskLevel: "low",
          firstOpportunityAllowed: true,
        },
        {
          id: activeCategoryIds[1],
          slug: `test-${activeCategoryIds[1]}`,
          name: `000 Kategori Uji B ${activeCategoryIds[1]}`,
          riskLevel: "restricted",
          firstOpportunityAllowed: false,
        },
        {
          id: inactiveCategoryId,
          slug: `test-${inactiveCategoryId}`,
          name: `000 Kategori Uji Nonaktif ${inactiveCategoryId}`,
          riskLevel: "low",
          firstOpportunityAllowed: true,
          isActive: false,
        },
      ]);

      const referenceData = await queryOnboardingReferenceData(database);
      expect(referenceData.areas).toContainEqual({
        id: areaId,
        name: `000 Kota Uji ${areaId}`,
      });
      expect(referenceData.areas.some((area) => area.id === inactiveAreaId)).toBe(false);
      expect(referenceData.areas.some((area) => area.id === provinceId)).toBe(false);
      expect(referenceData.categories).toContainEqual({
        id: activeCategoryIds[0],
        name: `000 Kategori Uji A ${activeCategoryIds[0]}`,
      });
      expect(
        referenceData.categories.some((category) => category.id === inactiveCategoryId),
      ).toBe(false);

      const authSubject = `auth-${randomUUID()}`;
      createdAuthSubjects.push(authSubject);
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
      createdAuthSubjects.push(inactiveInterestSubject);
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
      createdAuthSubjects.push(invalidAreaSubject);
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
      createdAuthSubjects.push(suspendedSubject);
      await database.insert(users).values({
        authSubject: suspendedSubject,
        role: "worker",
        status: "suspended",
      });
      await expect(
        synchronizeIdentityInDatabase(database, suspendedSubject, workerInput),
      ).rejects.toMatchObject({ code: "ACCOUNT_INACTIVE" });

      const rollbackSubject = `auth-${randomUUID()}`;
      createdAuthSubjects.push(rollbackSubject);
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
      if (createdAuthSubjects.length > 0) {
        const createdUsers = await database
          .select({ id: users.id })
          .from(users)
          .where(inArray(users.authSubject, createdAuthSubjects));
        const createdUserIds = createdUsers.map(({ id }) => id);
        if (createdUserIds.length > 0) {
          await database
            .delete(workerInterests)
            .where(inArray(workerInterests.workerId, createdUserIds));
          await database
            .delete(workerProfiles)
            .where(inArray(workerProfiles.userId, createdUserIds));
          await database
            .delete(employerProfiles)
            .where(inArray(employerProfiles.userId, createdUserIds));
          await database.delete(users).where(inArray(users.id, createdUserIds));
        }
      }
      if (createdCategoryIds.length > 0) {
        await database
          .delete(categories)
          .where(inArray(categories.id, createdCategoryIds));
      }
      if (createdAreaIds.length > 0) {
        await database.delete(areas).where(inArray(areas.id, createdAreaIds));
      }
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
