import { db } from "@/server/db/client";
import { areas, categories, wageGuidelines } from "@/server/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

export async function getJobReferenceData() {
  const activeAreas = await db
    .select({ id: areas.id, name: areas.name })
    .from(areas)
    .where(and(eq(areas.level, "city_regency"), eq(areas.isActive, true)))
    .orderBy(asc(areas.name), asc(areas.id));

  const activeCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      riskLevel: categories.riskLevel,
      firstOpportunityAllowed: categories.firstOpportunityAllowed,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.name), asc(categories.id));

  const activeGuidelines = await db
    .select({
      areaId: wageGuidelines.areaId,
      categoryId: wageGuidelines.categoryId,
      minimumAmount: wageGuidelines.minimumAmount,
      recommendedAmount: wageGuidelines.recommendedAmount,
      unit: wageGuidelines.unit,
      sourceLabel: wageGuidelines.sourceLabel,
      isSimulated: wageGuidelines.isSimulated,
      effectiveFrom: wageGuidelines.effectiveFrom,
      effectiveTo: wageGuidelines.effectiveTo,
    })
    .from(wageGuidelines)
    .where(eq(wageGuidelines.isActive, true))
    .orderBy(
      desc(wageGuidelines.effectiveFrom),
      desc(wageGuidelines.createdAt),
      asc(wageGuidelines.id),
    );

  return {
    areas: activeAreas,
    categories: activeCategories,
    wageGuidelines: activeGuidelines.map((wg) => ({
      ...wg,
      minimumAmount: Number(wg.minimumAmount),
      recommendedAmount: Number(wg.recommendedAmount),
    })),
  };
}
