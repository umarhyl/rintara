"use server";

import "server-only";

import { db } from "@/server/db/client";
import { ApplicationError } from "@/server/errors/application-error";
import { getVerifiedAuthSubject } from "./identity";
import {
  synchronizeIdentityInDatabase,
  type OnboardingResult,
} from "./onboarding-transaction";
import { onboardingSchema, type OnboardingInput } from "./schemas";

export type { OnboardingResult } from "./onboarding-transaction";

function parseOnboardingInput(input: unknown): OnboardingInput {
  const result = onboardingSchema.safeParse(input);

  if (!result.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Periksa kembali data profil dan peran yang dipilih.",
    );
  }

  return result.data;
}

export async function completeOnboarding(
  input: unknown,
): Promise<OnboardingResult> {
  const authSubject = await getVerifiedAuthSubject();
  const parsedInput = parseOnboardingInput(input);
  return synchronizeIdentityInDatabase(db, authSubject, parsedInput);
}
