import { and, asc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/server/db/schema";
import { areas, categories } from "@/server/db/schema";

export type OnboardingAreaOption = {
  id: string;
  name: string;
};

export type OnboardingCategoryOption = {
  id: string;
  name: string;
};

export type OnboardingReferenceData = {
  areas: OnboardingAreaOption[];
  categories: OnboardingCategoryOption[];
};

type ReferenceDatabase = PostgresJsDatabase<typeof schema>;

const MAX_ONBOARDING_AREAS = 1_000;
const MAX_ONBOARDING_CATEGORIES = 200;

export async function queryOnboardingAreaOptions(
  database: ReferenceDatabase,
): Promise<OnboardingAreaOption[]> {
  return database
    .select({ id: areas.id, name: areas.name })
    .from(areas)
    .where(and(eq(areas.level, "city_regency"), eq(areas.isActive, true)))
    .orderBy(asc(areas.name), asc(areas.id))
    .limit(MAX_ONBOARDING_AREAS);
}

export async function queryOnboardingCategoryOptions(
  database: ReferenceDatabase,
): Promise<OnboardingCategoryOption[]> {
  return database
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.name), asc(categories.id))
    .limit(MAX_ONBOARDING_CATEGORIES);
}

export async function queryOnboardingReferenceData(
  database: ReferenceDatabase,
): Promise<OnboardingReferenceData> {
  const [activeAreas, activeCategories] = await Promise.all([
    queryOnboardingAreaOptions(database),
    queryOnboardingCategoryOptions(database),
  ]);

  return {
    areas: activeAreas,
    categories: activeCategories,
  };
}
