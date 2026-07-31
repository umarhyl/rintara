"use server";

import { cookies } from "next/headers";
import {
  requestPasswordRecovery,
  resendSignUpVerification,
  signIn,
  signUp,
  updatePassword,
} from "@/server/auth/adapters";
import { ApplicationError } from "@/server/errors/application-error";
import {
  getRegistrationOnboardingPath,
  REGISTRATION_ONBOARDING_COOKIE,
} from "@/server/auth/environment";

export type AuthFormResult =
  | { ok: true; nextStep?: "confirm-or-sign-in" }
  | { ok: false; message: string };

function safeAuthFailure(error: unknown): AuthFormResult {
  if (error instanceof ApplicationError) {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: "Layanan autentikasi sedang tidak tersedia. Silakan coba lagi." };
}

async function rememberRegistrationOnboarding(
  nextPath?: string,
  selectedRole?: "worker" | "employer" | null,
) {
  if (!selectedRole) return;

  const cookieStore = await cookies();
  cookieStore.set(
    REGISTRATION_ONBOARDING_COOKIE,
    getRegistrationOnboardingPath(nextPath, selectedRole),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60,
    },
  );
}

export async function submitSignIn(credentials: { email: string; password: string }): Promise<AuthFormResult> {
  try {
    await signIn(credentials);
    return { ok: true };
  } catch (error) {
    return safeAuthFailure(error);
  }
}

export async function submitSignUp(credentials: {
  email: string;
  password: string;
  nextPath?: string;
  selectedRole?: "worker" | "employer" | null;
}): Promise<AuthFormResult> {
  try {
    const result = await signUp(
      { email: credentials.email, password: credentials.password },
      {
        nextPath: credentials.nextPath,
        selectedRole: credentials.selectedRole,
      },
    );
    await rememberRegistrationOnboarding(
      credentials.nextPath,
      credentials.selectedRole,
    );
    return {
      ok: true,
      nextStep:
        result.state === "confirm-or-sign-in"
          ? "confirm-or-sign-in"
          : undefined,
    };
  } catch (error) {
    return safeAuthFailure(error);
  }
}

export async function submitVerificationEmailRequest(input: {
  email: string;
  nextPath?: string;
  selectedRole?: "worker" | "employer" | null;
}): Promise<AuthFormResult> {
  try {
    await resendSignUpVerification(
      { email: input.email },
      { nextPath: input.nextPath, selectedRole: input.selectedRole },
    );
    await rememberRegistrationOnboarding(input.nextPath, input.selectedRole);
    return { ok: true };
  } catch (error) {
    return safeAuthFailure(error);
  }
}

export async function submitPasswordRecoveryRequest(input: {
  email: string;
}): Promise<AuthFormResult> {
  try {
    await requestPasswordRecovery(input);
    return { ok: true };
  } catch (error) {
    return safeAuthFailure(error);
  }
}

export async function submitPasswordUpdate(input: {
  password: string;
  passwordConfirmation: string;
}): Promise<AuthFormResult> {
  try {
    await updatePassword(input);
    return { ok: true };
  } catch (error) {
    return safeAuthFailure(error);
  }
}
