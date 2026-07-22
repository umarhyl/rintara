"use server";

import { createClient } from "@/lib/supabase/server";
import { ApplicationError } from "@/server/errors/application-error";
import { getAuthenticationCallbackUrl } from "./environment";
import { mapAuthProviderError } from "./provider-errors";
import { signInSchema, signUpSchema } from "./schemas";

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
