import "server-only";

import { asc, desc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { areas, categories, wageGuidelines } from "@/server/db/schema";

export type AdminMarketplaceConfig = Awaited<
  ReturnType<typeof getAdminMarketplaceConfig>
>;

export async function getAdminMarketplaceConfig() {
  const [areaRows, categoryRows, guidelineRows] = await Promise.all([
    db
      .select({
        id: areas.id,
        code: areas.code,
        name: areas.name,
        level: areas.level,
        isActive: areas.isActive,
      })
      .from(areas)
      .orderBy(desc(areas.isActive), asc(areas.name), asc(areas.id)),
    db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        riskLevel: categories.riskLevel,
        firstOpportunityAllowed: categories.firstOpportunityAllowed,
        isActive: categories.isActive,
      })
      .from(categories)
      .orderBy(desc(categories.isActive), asc(categories.name), asc(categories.id)),
    db
      .select({
        id: wageGuidelines.id,
        areaId: wageGuidelines.areaId,
        categoryId: wageGuidelines.categoryId,
        unit: wageGuidelines.unit,
        minimumAmount: wageGuidelines.minimumAmount,
        recommendedAmount: wageGuidelines.recommendedAmount,
        sourceLabel: wageGuidelines.sourceLabel,
        sourceUrl: wageGuidelines.sourceUrl,
        isSimulated: wageGuidelines.isSimulated,
        effectiveFrom: wageGuidelines.effectiveFrom,
        effectiveTo: wageGuidelines.effectiveTo,
        isActive: wageGuidelines.isActive,
      })
      .from(wageGuidelines)
      .orderBy(
        desc(wageGuidelines.isActive),
        desc(wageGuidelines.effectiveFrom),
        desc(wageGuidelines.createdAt),
      ),
  ]);

  const areaNameById = new Map(areaRows.map((area) => [area.id, area.name]));
  const categoryNameById = new Map(
    categoryRows.map((category) => [category.id, category.name]),
  );

  return {
    areas: areaRows,
    categories: categoryRows,
    wageGuidelines: guidelineRows.map((guideline) => ({
      ...guideline,
      areaName: areaNameById.get(guideline.areaId) ?? "Area tidak tersedia",
      categoryName:
        categoryNameById.get(guideline.categoryId) ?? "Kategori tidak tersedia",
      minimumAmount: Number(guideline.minimumAmount),
      recommendedAmount: Number(guideline.recommendedAmount),
    })),
  };
}
