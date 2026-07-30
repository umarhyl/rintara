import { randomUUID } from "node:crypto";
import { expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
mock.module("next/cache", () => ({ revalidatePath: () => {} }));

import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { RequestContext } from "@/server/auth/types";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

function form(entries: Record<string, string | boolean>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    if (value === true) formData.set(key, "on");
    if (typeof value === "string") formData.set(key, value);
  }

  return formData;
}

databaseTest(
  "creates and toggles admin marketplace configuration with audit records",
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
      const adminId = randomUUID();
      const context: RequestContext = {
        userId: adminId,
        role: "admin",
        accountStatus: "active",
        requestId: `admin-config-${fixtureId}`,
      };

      await database.insert(schema.users).values({
        id: adminId,
        authSubject: `admin-config-${fixtureId}`,
        role: "admin",
      });

      mock.module("@/server/auth/identity", () => ({
        requireActiveUser: async () => context,
      }));
      mock.module("@/server/db/client", () => ({ db: database }));

      const {
        createCategoryAction,
        createPilotAreaAction,
        createWageGuidelineAction,
        setCategoryActiveAction,
        setPilotAreaActiveAction,
        setWageGuidelineActiveAction,
      } = await import("@/server/domain/admin/marketplace-config-actions");
      const { getAdminMarketplaceConfig } = await import(
        "@/server/queries/admin/marketplace-config"
      );

      const category = await createCategoryAction(
        null,
        form({
          name: "Kategori Sintetis",
          slug: `kategori-${fixtureId}`,
          riskLevel: "low",
          firstOpportunityAllowed: true,
          isActive: true,
        }),
      );
      expect(category.ok).toBe(true);
      if (!category.ok) throw new Error(category.message);

      const area = await createPilotAreaAction(
        null,
        form({
          name: "Kota Sintetis",
          code: `CITY-${fixtureId}`,
          isActive: true,
        }),
      );
      expect(area.ok).toBe(true);
      if (!area.ok) throw new Error(area.message);

      const guideline = await createWageGuidelineAction(
        null,
        form({
          areaId: area.id,
          categoryId: category.id,
          unit: "job",
          minimumAmount: "100000",
          recommendedAmount: "150000",
          sourceLabel: "Sumber sintetis",
          effectiveFrom: "2030-01-01",
          isSimulated: true,
          isActive: true,
        }),
      );
      expect(guideline.ok).toBe(true);
      if (!guideline.ok) throw new Error(guideline.message);

      const overlappingGuideline = await createWageGuidelineAction(
        null,
        form({
          areaId: area.id,
          categoryId: category.id,
          unit: "job",
          minimumAmount: "120000",
          recommendedAmount: "170000",
          sourceLabel: "Sumber sintetis overlap",
          effectiveFrom: "2030-06-01",
          isSimulated: true,
          isActive: true,
        }),
      );
      expect(overlappingGuideline).toMatchObject({
        ok: false,
        fieldErrors: {
          effectiveFrom: [
            "Pilih periode yang tidak bertumpang tindih dengan panduan aktif.",
          ],
        },
      });

      const inactiveOverlappingGuideline = await createWageGuidelineAction(
        null,
        form({
          areaId: area.id,
          categoryId: category.id,
          unit: "job",
          minimumAmount: "120000",
          recommendedAmount: "170000",
          sourceLabel: "Sumber sintetis nonaktif",
          effectiveFrom: "2030-06-01",
          isSimulated: true,
          isActive: false,
        }),
      );
      expect(inactiveOverlappingGuideline.ok).toBe(true);
      if (!inactiveOverlappingGuideline.ok) {
        throw new Error(inactiveOverlappingGuideline.message);
      }
      expect(
        await setWageGuidelineActiveAction(
          null,
          form({ id: inactiveOverlappingGuideline.id, isActive: "true" }),
        ),
      ).toMatchObject({
        ok: false,
        message:
          "Panduan Upah tidak dapat diaktifkan karena periodenya bertumpang tindih dengan panduan aktif lain.",
      });

      for (const [action, id] of [
        [setCategoryActiveAction, category.id],
        [setPilotAreaActiveAction, area.id],
        [setWageGuidelineActiveAction, guideline.id],
      ] as const) {
        expect(
          await action(null, form({ id, isActive: "false" })),
        ).toMatchObject({ ok: true, id });
        expect(
          await action(null, form({ id, isActive: "true" })),
        ).toMatchObject({ ok: true, id });
      }

      const [storedCategory] = await database
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, category.id));
      expect(storedCategory).toMatchObject({
        riskLevel: "low",
        firstOpportunityAllowed: true,
        isActive: true,
      });

      const [storedArea] = await database
        .select()
        .from(schema.areas)
        .where(eq(schema.areas.id, area.id));
      expect(storedArea).toMatchObject({
        level: "city_regency",
        isActive: true,
      });

      const [storedGuideline] = await database
        .select()
        .from(schema.wageGuidelines)
        .where(eq(schema.wageGuidelines.id, guideline.id));
      expect(storedGuideline).toMatchObject({
        areaId: area.id,
        categoryId: category.id,
        unit: "job",
        minimumAmount: BigInt(100000),
        recommendedAmount: BigInt(150000),
        isSimulated: true,
        isActive: true,
      });

      const secondCategoryId = randomUUID();
      const secondAreaId = randomUUID();
      const secondGuidelineId = randomUUID();
      await database.insert(schema.categories).values({
        id: secondCategoryId,
        name: "Kategori Sintetis Kedua",
        slug: `kategori-kedua-${fixtureId}`,
        riskLevel: "low",
        firstOpportunityAllowed: true,
      });
      await database.insert(schema.areas).values({
        id: secondAreaId,
        name: "Kota Sintetis Kedua",
        code: `CITY-SECOND-${fixtureId}`,
        level: "city_regency",
      });
      await database.insert(schema.wageGuidelines).values({
        id: secondGuidelineId,
        areaId: secondAreaId,
        categoryId: secondCategoryId,
        unit: "job",
        minimumAmount: BigInt(120000),
        recommendedAmount: BigInt(180000),
        sourceLabel: "Sumber sintetis kedua",
        isSimulated: true,
        effectiveFrom: "2031-01-01",
        createdBy: adminId,
      });

      const firstPage = await getAdminMarketplaceConfig(
        { limit: 1 },
        context,
        database,
      );
      expect(firstPage.areas).toHaveLength(1);
      expect(firstPage.categories).toHaveLength(1);
      expect(firstPage.wageGuidelines).toHaveLength(1);
      expect(firstPage.areaNextCursor).toEqual(expect.any(String));
      expect(firstPage.categoryNextCursor).toEqual(expect.any(String));
      expect(firstPage.wageGuidelineNextCursor).toEqual(expect.any(String));

      const secondPage = await getAdminMarketplaceConfig(
        {
          areaCursor: firstPage.areaNextCursor!,
          categoryCursor: firstPage.categoryNextCursor!,
          wageGuidelineCursor: firstPage.wageGuidelineNextCursor!,
          limit: 1,
        },
        context,
        database,
      );
      expect(secondPage.areas).toHaveLength(1);
      expect(secondPage.categories).toHaveLength(1);
      expect(secondPage.wageGuidelines).toHaveLength(1);
      expect(secondPage.areas[0]?.id).not.toBe(firstPage.areas[0]?.id);
      expect(secondPage.categories[0]?.id).not.toBe(
        firstPage.categories[0]?.id,
      );
      expect(secondPage.wageGuidelines[0]?.id).not.toBe(
        firstPage.wageGuidelines[0]?.id,
      );

      for (const cursorName of [
        "areaCursor",
        "categoryCursor",
        "wageGuidelineCursor",
      ] as const) {
        await expect(
          getAdminMarketplaceConfig(
            { [cursorName]: "not-a-cursor" },
            context,
            database,
          ),
        ).rejects.toMatchObject({
          code: "VALIDATION_FAILED",
          message: "Invalid pagination cursor.",
        });
      }

      await expect(
        getAdminMarketplaceConfig(
          {},
          { ...context, role: "worker" },
          database,
        ),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        getAdminMarketplaceConfig(
          {},
          { ...context, accountStatus: "suspended" },
          database,
        ),
      ).rejects.toMatchObject({ code: "ACCOUNT_INACTIVE" });

      const auditRows = await database
        .select({ action: schema.auditLogs.action })
        .from(schema.auditLogs)
        .where(
          and(
            eq(schema.auditLogs.actorId, adminId),
            inArray(schema.auditLogs.entityId, [
              category.id,
              area.id,
              guideline.id,
            ]),
          ),
        );
      expect(auditRows.map(({ action }) => action).sort()).toEqual(
        [
          "admin.category.activate",
          "admin.category.create",
          "admin.category.deactivate",
          "admin.pilot_area.activate",
          "admin.pilot_area.create",
          "admin.pilot_area.deactivate",
          "admin.wage_guideline.activate",
          "admin.wage_guideline.create",
          "admin.wage_guideline.deactivate",
        ].sort(),
      );
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
