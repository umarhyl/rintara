"use server";

import { ApplicationError } from "@/server/errors/application-error";

export type OnboardingActionResult =
  | { ok: true; role: "worker" | "employer" }
  | { ok: false; message: string };

export type WorkerOnboardingActionInput = {
  displayName: string;
  areaId: string;
  bio?: string | null;
  availabilityNote?: string | null;
  categoryInterestIds?: string[];
};

export type EmployerOnboardingActionInput = {
  displayName: string;
  areaId: string;
  employerType: "individual" | "business" | "community";
  description?: string | null;
};

function safeOnboardingFailure(error: unknown): OnboardingActionResult {
  if (!(error instanceof ApplicationError)) {
    return {
      ok: false,
      message: "Profil belum dapat disimpan. Silakan coba lagi.",
    };
  }

  switch (error.code) {
    case "UNAUTHENTICATED":
      return {
        ok: false,
        message: "Sesi kamu telah berakhir. Masuk kembali untuk melanjutkan.",
      };
    case "ACCOUNT_INACTIVE":
      return {
        ok: false,
        message: "Akun ini sedang dibatasi dan belum dapat melanjutkan.",
      };
    case "FORBIDDEN":
      return {
        ok: false,
        message: "Peran akun ini sudah dipilih dan tidak dapat diubah.",
      };
    case "VALIDATION_FAILED":
      return { ok: false, message: error.message };
    default:
      return {
        ok: false,
        message: "Profil belum dapat disimpan. Silakan coba lagi.",
      };
  }
}

export async function submitWorkerOnboarding(
  input: WorkerOnboardingActionInput,
): Promise<OnboardingActionResult> {
  try {
    const { completeOnboarding } = await import("@/server/auth/onboarding");
    await completeOnboarding({ ...input, role: "worker" });
    return { ok: true, role: "worker" };
  } catch (error) {
    return safeOnboardingFailure(error);
  }
}

export async function submitEmployerOnboarding(
  input: EmployerOnboardingActionInput,
): Promise<OnboardingActionResult> {
  try {
    const { completeOnboarding } = await import("@/server/auth/onboarding");
    await completeOnboarding({ ...input, role: "employer" });
    return { ok: true, role: "employer" };
  } catch (error) {
    return safeOnboardingFailure(error);
  }
}
