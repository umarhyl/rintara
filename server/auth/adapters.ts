"use server";

import { createClient } from "@/lib/supabase/server";
import { ApplicationError } from "@/server/errors/application-error";
import {
  getAuthenticationCallbackUrl,
  getPasswordRecoveryCallbackUrl,
} from "./environment";
import { mapAuthProviderError } from "./provider-errors";
import {
  passwordRecoveryRequestSchema,
  passwordUpdateSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";

function parseCredentials(
  schema: typeof signInSchema,
  input: unknown,
): { email: string; password: string } {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Periksa kembali email dan kata sandi.",
    );
  }

  return result.data;
}

export async function signUp(input: unknown, nextPath?: string) {
  const credentials = parseCredentials(signUpSchema, input);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: { emailRedirectTo: getAuthenticationCallbackUrl(nextPath) },
  });

  if (error) {
    throw mapAuthProviderError(error, "sign-up");
  }

  return {
    requiresEmailConfirmation: data.session === null,
  };
}

export async function signIn(input: unknown) {
  const credentials = parseCredentials(signInSchema, input);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    throw mapAuthProviderError(error, "sign-in");
  }

  return { signedIn: true as const };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw mapAuthProviderError(error, "sign-out");
  }

  return { signedOut: true as const };
}

export async function requestPasswordRecovery(input: unknown) {
  const result = passwordRecoveryRequestSchema.safeParse(input);

  if (!result.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Masukkan alamat email yang valid.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    result.data.email,
    { redirectTo: getPasswordRecoveryCallbackUrl() },
  );

  if (error) {
    throw mapAuthProviderError(error, "password-recovery");
  }

  return { requested: true as const };
}

export async function updatePassword(input: unknown) {
  const result = passwordUpdateSchema.safeParse(input);

  if (!result.success) {
    const confirmationError = result.error.issues.some(
      (issue) => issue.path[0] === "passwordConfirmation",
    );
    throw new ApplicationError(
      "VALIDATION_FAILED",
      confirmationError
        ? "Konfirmasi kata sandi tidak cocok."
        : "Kata sandi harus terdiri dari 8–128 karakter.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    throw mapAuthProviderError(error, "password-update");
  }

  return { updated: true as const };
}
