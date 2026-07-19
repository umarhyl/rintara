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
import { areas, users, workerProfiles } from "@/server/db/schema";

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
      await database.insert(areas).values({
        id: areaId,
        level: "city_regency",
        code: `test-${areaId}`,
        name: "Kota Uji",
      });

      const authSubject = `auth-${randomUUID()}`;
      const workerInput = {
        role: "worker",
        displayName: "Ayu Pratama",
        areaId,
        bio: null,
        availabilityNote: null,
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
