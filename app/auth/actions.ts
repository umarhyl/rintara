"use server";

import { signIn, signUp } from "@/server/auth/adapters";
import { ApplicationError } from "@/server/errors/application-error";

export type AuthFormResult =
  | { ok: true; requiresEmailConfirmation?: boolean }
  | { ok: false; message: string };

function safeAuthFailure(error: unknown): AuthFormResult {
  if (error instanceof ApplicationError) {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: "Layanan autentikasi sedang tidak tersedia. Silakan coba lagi." };
}

export async function submitSignIn(credentials: { email: string; password: string }): Promise<AuthFormResult> {
  try {
    await signIn(credentials);
    return { ok: true };
  } catch (error) {
    return safeAuthFailure(error);
  }
}

export async function submitSignUp(credentials: { email: string; password: string; nextPath?: string }): Promise<AuthFormResult> {
  try {
    const result = await signUp(
      { email: credentials.email, password: credentials.password },
      credentials.nextPath,
    );
    return { ok: true, requiresEmailConfirmation: result.requiresEmailConfirmation };
  } catch (error) {
    return safeAuthFailure(error);
  }
}
