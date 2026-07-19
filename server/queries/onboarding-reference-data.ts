import "server-only";

import {
  queryOnboardingAreaOptions,
  queryOnboardingReferenceData,
  type OnboardingAreaOption,
  type OnboardingReferenceData,
} from "./onboarding-reference-data-query";

export type {
  OnboardingAreaOption,
  OnboardingCategoryOption,
  OnboardingReferenceData,
} from "./onboarding-reference-data-query";

export async function getOnboardingReferenceData(): Promise<OnboardingReferenceData> {
  const { db } = await import("@/server/db/client");
  return queryOnboardingReferenceData(db);
}

export async function getOnboardingAreaOptions(): Promise<
  OnboardingAreaOption[]
> {
  const { db } = await import("@/server/db/client");
  return queryOnboardingAreaOptions(db);
}
