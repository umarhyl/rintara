import { randomUUID } from "node:crypto";
import { expect, test } from "bun:test";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { RequestContext } from "@/server/auth/types";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "updates only the authenticated employer profile with an active pilot area",
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
      const activeAreaId = randomUUID();
      const replacementAreaId = randomUUID();
      const inactiveAreaId = randomUUID();
      const provinceAreaId = randomUUID();
      const employerAId = randomUUID();
      const employerBId = randomUUID();
      const workerId = randomUUID();

      await database.insert(schema.areas).values([
        {
          id: activeAreaId,
          level: "city_regency",
          code: `employer-active-${fixtureId}`,
          name: "Kota Employer Aktif",
        },
        {
          id: replacementAreaId,
          level: "city_regency",
          code: `employer-replacement-${fixtureId}`,
          name: "Kota Employer Pengganti",
        },
        {
          id: inactiveAreaId,
          level: "city_regency",
          code: `employer-inactive-${fixtureId}`,
          name: "Kota Employer Nonaktif",
          isActive: false,
        },
        {
          id: provinceAreaId,
          level: "province",
          code: `employer-province-${fixtureId}`,
          name: "Provinsi Employer",
        },
      ]);

      await database.insert(schema.users).values([
        {
          id: employerAId,
          authSubject: `employer-a-${fixtureId}`,
          role: "employer",
        },
        {
          id: employerBId,
          authSubject: `employer-b-${fixtureId}`,
          role: "employer",
        },
        {
          id: workerId,
          authSubject: `employer-worker-${fixtureId}`,
          role: "worker",
        },
      ]);

      await database.insert(schema.employerProfiles).values([
        {
          userId: employerAId,
          displayName: "Employer A",
          employerType: "individual",
          areaId: activeAreaId,
        },
        {
          userId: employerBId,
          displayName: "Employer B",
          employerType: "community",
          areaId: activeAreaId,
        },
      ]);
      await database.insert(schema.workerProfiles).values({
        userId: workerId,
        displayName: "Worker Uji",
        areaId: activeAreaId,
      });

      const context = (
        userId: string,
        role: RequestContext["role"],
        accountStatus: RequestContext["accountStatus"] = "active",
      ): RequestContext => ({
        userId,
        role,
        accountStatus,
        requestId: `employer-profile-${fixtureId}`,
      });

      const { updateEmployerProfileInDatabase } = await import(
        "@/server/domain/profiles/employer-profile"
      );

      await updateEmployerProfileInDatabase(
        database,
        context(employerAId, "employer"),
        {
          displayName: "Employer A Diperbarui",
          employerType: "business",
          areaId: replacementAreaId,
          description: "Profil sintetis yang sudah diperbarui.",
        },
      );

      const profiles = await database
        .select()
        .from(schema.employerProfiles)
        .where(
          eq(schema.employerProfiles.userId, employerAId),
        );
      expect(profiles[0]).toMatchObject({
        userId: employerAId,
        displayName: "Employer A Diperbarui",
        employerType: "business",
        areaId: replacementAreaId,
        description: "Profil sintetis yang sudah diperbarui.",
      });

      const [otherProfile] = await database
        .select()
        .from(schema.employerProfiles)
        .where(eq(schema.employerProfiles.userId, employerBId));
      expect(otherProfile.displayName).toBe("Employer B");

      for (const invalidAreaId of [inactiveAreaId, provinceAreaId]) {
        await expect(
          updateEmployerProfileInDatabase(
            database,
            context(employerAId, "employer"),
            {
              displayName: "Tidak Tersimpan",
              employerType: "business",
              areaId: invalidAreaId,
              description: null,
            },
          ),
        ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      }

      await expect(
        updateEmployerProfileInDatabase(
          database,
          context(workerId, "worker"),
          {
            displayName: "Tidak Berwenang",
            employerType: "individual",
            areaId: activeAreaId,
            description: null,
          },
        ),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        updateEmployerProfileInDatabase(
          database,
          context(employerAId, "employer", "suspended"),
          {
            displayName: "Akun Ditangguhkan",
            employerType: "individual",
            areaId: activeAreaId,
            description: null,
          },
        ),
      ).rejects.toMatchObject({ code: "ACCOUNT_INACTIVE" });
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
