"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { ApplicationError } from "@/server/errors/application-error";
import {
  getEmailVerificationCallbackUrl,
  getPasswordRecoveryCallbackUrl,
  getRegistrationOnboardingPath,
} from "./environment";
import {
  isExistingAccountSignUpError,
  mapAuthProviderError,
} from "./provider-errors";
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

type SignUpContinuation = {
  nextPath?: string;
  selectedRole?: "worker" | "employer" | null;
};

export async function signUp(
  input: unknown,
  continuation: SignUpContinuation = {},
) {
  const credentials = parseCredentials(signUpSchema, input);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new ApplicationError(
      "INTERNAL_ERROR",
      "Layanan autentikasi sedang tidak tersedia. Silakan coba lagi.",
    );
  }

  // Temporary demo path: create self-service accounts as email-confirmed so
  // registration can establish a session and continue straight to onboarding.
  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: createError } = await admin.auth.admin.createUser({
    ...credentials,
    email_confirm: true,
    user_metadata: {
      rintara_onboarding_path: getRegistrationOnboardingPath(
        continuation.nextPath,
        continuation.selectedRole,
      ),
    },
  });

  if (createError && !isExistingAccountSignUpError(createError)) {
    throw mapAuthProviderError(createError, "sign-up");
  }

  if (createError) {
    return { state: "confirm-or-sign-in" as const };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    if (isExistingAccountSignUpError(error)) {
      return { state: "confirm-or-sign-in" as const };
    }

    throw mapAuthProviderError(error, "sign-up");
  }

  return { state: "signed-in" as const };
}

export async function resendSignUpVerification(
  input: unknown,
  continuation: SignUpContinuation = {},
) {
  const result = passwordRecoveryRequestSchema.safeParse(input);

  if (!result.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Masukkan alamat email yang valid.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: result.data.email,
    options: {
      emailRedirectTo: getEmailVerificationCallbackUrl(
        continuation.nextPath,
        continuation.selectedRole,
      ),
    },
  });

  if (error?.status === 429) {
    throw new ApplicationError(
      "RATE_LIMITED",
      "Terlalu banyak permintaan. Tunggu sebentar sebelum mengirim ulang.",
    );
  }

  // Expected provider errors for unknown or already-confirmed addresses are
  // deliberately collapsed into the same result to prevent account discovery.
  if (error && (error.status ?? 500) >= 500) {
    throw mapAuthProviderError(error, "sign-up");
  }

  return { requested: true as const };
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
