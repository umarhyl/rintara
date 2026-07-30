import "server-only";

import { Buffer } from "node:buffer";
import { and, asc, desc, eq, gt, lt, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { areas, categories, wageGuidelines } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

type MarketplaceConfigDatabase = PostgresJsDatabase<typeof schema>;

export type AdminMarketplaceConfigInput = {
  areaCursor?: string;
  categoryCursor?: string;
  wageGuidelineCursor?: string;
  limit?: number;
};

type NamedCursor = {
  isActive: boolean;
  name: string;
  id: string;
};

type WageGuidelineCursor = {
  isActive: boolean;
  effectiveFrom: string;
  createdAt: Date;
  id: string;
};

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeLimit(limit: number | undefined) {
  return Number.isInteger(limit) && limit && limit > 0
    ? Math.min(limit, MAX_LIMIT)
    : DEFAULT_LIMIT;
}

function invalidCursor(field: string): never {
  throw new ApplicationError(
    "VALIDATION_FAILED",
    "Invalid pagination cursor.",
    { [field]: ["The pagination cursor is malformed."] },
  );
}

function decodeCursorObject(
  value: string | undefined,
  kind: "area" | "category" | "wage-guideline",
  field: string,
) {
  if (!value) return null;

  try {
    if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) {
      invalidCursor(field);
    }

    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) invalidCursor(field);

    const parsed: unknown = JSON.parse(decoded.toString("utf8"));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("k" in parsed) ||
      parsed.k !== kind
    ) {
      invalidCursor(field);
    }

    return parsed;
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    invalidCursor(field);
  }
}

function decodeNamedCursor(
  value: string | undefined,
  kind: "area" | "category",
  field: string,
): NamedCursor | null {
  const parsed = decodeCursorObject(value, kind, field);
  if (!parsed) return null;

  if (
    !("a" in parsed) ||
    !("n" in parsed) ||
    !("i" in parsed) ||
    (parsed.a !== 0 && parsed.a !== 1) ||
    typeof parsed.n !== "string" ||
    typeof parsed.i !== "string" ||
    !UUID_PATTERN.test(parsed.i)
  ) {
    invalidCursor(field);
  }

  return {
    isActive: parsed.a === 1,
    name: parsed.n,
    id: parsed.i,
  };
}

function decodeWageGuidelineCursor(
  value: string | undefined,
): WageGuidelineCursor | null {
  const field = "wageGuidelineCursor";
  const parsed = decodeCursorObject(value, "wage-guideline", field);
  if (!parsed) return null;

  if (
    !("a" in parsed) ||
    !("e" in parsed) ||
    !("c" in parsed) ||
    !("i" in parsed) ||
    (parsed.a !== 0 && parsed.a !== 1) ||
    typeof parsed.e !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(parsed.e) ||
    typeof parsed.c !== "string" ||
    typeof parsed.i !== "string" ||
    !UUID_PATTERN.test(parsed.i)
  ) {
    invalidCursor(field);
  }

  const createdAt = new Date(parsed.c);
  if (
    Number.isNaN(createdAt.getTime()) ||
    createdAt.toISOString() !== parsed.c
  ) {
    invalidCursor(field);
  }

  return {
    isActive: parsed.a === 1,
    effectiveFrom: parsed.e,
    createdAt,
    id: parsed.i,
  };
}

function encodeNamedCursor(
  kind: "area" | "category",
  row: { isActive: boolean; name: string; id: string },
) {
  return Buffer.from(
    JSON.stringify({
      k: kind,
      a: row.isActive ? 1 : 0,
      n: row.name,
      i: row.id,
    }),
  ).toString("base64url");
}

function encodeWageGuidelineCursor(row: {
  isActive: boolean;
  effectiveFrom: string;
  createdAt: Date;
  id: string;
}) {
  return Buffer.from(
    JSON.stringify({
      k: "wage-guideline",
      a: row.isActive ? 1 : 0,
      e: row.effectiveFrom,
      c: row.createdAt.toISOString(),
      i: row.id,
    }),
  ).toString("base64url");
}

function afterCategoryCursor(cursor: NamedCursor) {
  const afterName = or(
    gt(categories.name, cursor.name),
    and(eq(categories.name, cursor.name), gt(categories.id, cursor.id)),
  )!;

  return cursor.isActive
    ? or(
        eq(categories.isActive, false),
        and(eq(categories.isActive, true), afterName),
      )!
    : and(eq(categories.isActive, false), afterName)!;
}

function afterAreaCursor(cursor: NamedCursor) {
  const afterName = or(
    gt(areas.name, cursor.name),
    and(eq(areas.name, cursor.name), gt(areas.id, cursor.id)),
  )!;

  return cursor.isActive
    ? or(
        eq(areas.isActive, false),
        and(eq(areas.isActive, true), afterName),
      )!
    : and(eq(areas.isActive, false), afterName)!;
}

function afterWageGuidelineCursor(cursor: WageGuidelineCursor) {
  const afterEffectiveDate = or(
    lt(wageGuidelines.effectiveFrom, cursor.effectiveFrom),
    and(
      eq(wageGuidelines.effectiveFrom, cursor.effectiveFrom),
      lt(wageGuidelines.createdAt, cursor.createdAt),
    ),
    and(
      eq(wageGuidelines.effectiveFrom, cursor.effectiveFrom),
      eq(wageGuidelines.createdAt, cursor.createdAt),
      gt(wageGuidelines.id, cursor.id),
    ),
  )!;

  return cursor.isActive
    ? or(
        eq(wageGuidelines.isActive, false),
        and(eq(wageGuidelines.isActive, true), afterEffectiveDate),
      )!
    : and(eq(wageGuidelines.isActive, false), afterEffectiveDate)!;
}

export type AdminMarketplaceConfig = Awaited<
  ReturnType<typeof getAdminMarketplaceConfig>
>;

export async function getAdminMarketplaceConfig(
  input: AdminMarketplaceConfigInput = {},
  context?: RequestContext,
  database: MarketplaceConfigDatabase = db,
) {
  assertRole(
    assertActiveUser(context ?? (await requireActiveUser())),
    "admin",
  );

  const limit = normalizeLimit(input.limit);
  const areaCursor = decodeNamedCursor(
    input.areaCursor,
    "area",
    "areaCursor",
  );
  const categoryCursor = decodeNamedCursor(
    input.categoryCursor,
    "category",
    "categoryCursor",
  );
  const wageGuidelineCursor = decodeWageGuidelineCursor(
    input.wageGuidelineCursor,
  );

  const [areaRows, categoryRows, wageGuidelineRows] = await Promise.all([
    database
      .select({
        id: areas.id,
        code: areas.code,
        name: areas.name,
        level: areas.level,
        isActive: areas.isActive,
      })
      .from(areas)
      .where(
        and(
          eq(areas.level, "city_regency"),
          areaCursor ? afterAreaCursor(areaCursor) : undefined,
        ),
      )
      .orderBy(desc(areas.isActive), asc(areas.name), asc(areas.id))
      .limit(limit + 1),
    database
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        riskLevel: categories.riskLevel,
        firstOpportunityAllowed: categories.firstOpportunityAllowed,
        isActive: categories.isActive,
      })
      .from(categories)
      .where(categoryCursor ? afterCategoryCursor(categoryCursor) : undefined)
      .orderBy(
        desc(categories.isActive),
        asc(categories.name),
        asc(categories.id),
      )
      .limit(limit + 1),
    database
      .select({
        id: wageGuidelines.id,
        areaId: wageGuidelines.areaId,
        areaName: areas.name,
        categoryId: wageGuidelines.categoryId,
        categoryName: categories.name,
        unit: wageGuidelines.unit,
        minimumAmount: wageGuidelines.minimumAmount,
        recommendedAmount: wageGuidelines.recommendedAmount,
        sourceLabel: wageGuidelines.sourceLabel,
        sourceUrl: wageGuidelines.sourceUrl,
        isSimulated: wageGuidelines.isSimulated,
        effectiveFrom: wageGuidelines.effectiveFrom,
        effectiveTo: wageGuidelines.effectiveTo,
        isActive: wageGuidelines.isActive,
        createdAt: wageGuidelines.createdAt,
      })
      .from(wageGuidelines)
      .innerJoin(areas, eq(wageGuidelines.areaId, areas.id))
      .innerJoin(categories, eq(wageGuidelines.categoryId, categories.id))
      .where(
        wageGuidelineCursor
          ? afterWageGuidelineCursor(wageGuidelineCursor)
          : undefined,
      )
      .orderBy(
        desc(wageGuidelines.isActive),
        desc(wageGuidelines.effectiveFrom),
        desc(wageGuidelines.createdAt),
        asc(wageGuidelines.id),
      )
      .limit(limit + 1),
  ]);

  const canReuseAreaPage = !areaCursor && areaRows.length <= limit;
  const canReuseCategoryPage =
    !categoryCursor && categoryRows.length <= limit;

  const [activeAreaOptions, activeCategoryOptions] = await Promise.all([
    canReuseAreaPage
      ? Promise.resolve(areaRows.filter((area) => area.isActive))
      : database
          .select({
            id: areas.id,
            code: areas.code,
            name: areas.name,
            level: areas.level,
            isActive: areas.isActive,
          })
          .from(areas)
          .where(
            and(
              eq(areas.level, "city_regency"),
              eq(areas.isActive, true),
            ),
          )
          .orderBy(asc(areas.name), asc(areas.id))
          .limit(MAX_LIMIT),
    canReuseCategoryPage
      ? Promise.resolve(
          categoryRows.filter((category) => category.isActive),
        )
      : database
          .select({
            id: categories.id,
            slug: categories.slug,
            name: categories.name,
            riskLevel: categories.riskLevel,
            firstOpportunityAllowed: categories.firstOpportunityAllowed,
            isActive: categories.isActive,
          })
          .from(categories)
          .where(eq(categories.isActive, true))
          .orderBy(asc(categories.name), asc(categories.id))
          .limit(MAX_LIMIT),
  ]);

  const areaItems = areaRows.slice(0, limit);
  const categoryItems = categoryRows.slice(0, limit);
  const wageGuidelinePageRows = wageGuidelineRows.slice(0, limit);

  return {
    areas: areaItems,
    areaNextCursor:
      areaRows.length > limit
        ? encodeNamedCursor("area", areaItems.at(-1)!)
        : null,
    categories: categoryItems,
    categoryNextCursor:
      categoryRows.length > limit
        ? encodeNamedCursor("category", categoryItems.at(-1)!)
        : null,
    wageGuidelines: wageGuidelinePageRows.map(({ createdAt, ...guideline }) => {
      void createdAt;
      return {
        ...guideline,
        minimumAmount: Number(guideline.minimumAmount),
        recommendedAmount: Number(guideline.recommendedAmount),
      };
    }),
    wageGuidelineNextCursor:
      wageGuidelineRows.length > limit
        ? encodeWageGuidelineCursor(wageGuidelinePageRows.at(-1)!)
        : null,
    activeAreaOptions,
    activeCategoryOptions,
  };
}
