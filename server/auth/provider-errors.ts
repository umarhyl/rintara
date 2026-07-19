import type { AuthError } from "@supabase/supabase-js";
import { ApplicationError } from "@/server/errors/application-error";

type AuthOperation = "sign-up" | "sign-in" | "sign-out";

export function mapAuthProviderError(
  error: Pick<AuthError, "code" | "status">,
  operation: AuthOperation,
): ApplicationError {
  if (
    operation === "sign-in" &&
    (error.code === "invalid_credentials" || error.status === 400)
  ) {
    return new ApplicationError(
      "UNAUTHENTICATED",
      "Email atau kata sandi tidak valid.",
    );
  }

  if (
    operation === "sign-up" &&
    (error.code === "user_already_exists" || error.code === "email_exists")
  ) {
    return new ApplicationError(
      "VALIDATION_FAILED",
      "Akun tidak dapat dibuat dengan data tersebut.",
    );
  }

  if (operation === "sign-up" && error.code === "weak_password") {
    return new ApplicationError(
      "VALIDATION_FAILED",
      "Kata sandi tidak memenuhi persyaratan keamanan.",
    );
  }

  if (operation === "sign-out") {
    return new ApplicationError(
      "INTERNAL_ERROR",
      "Tidak dapat keluar saat ini. Silakan coba lagi.",
    );
  }

  return new ApplicationError(
    "INTERNAL_ERROR",
    "Layanan autentikasi tidak tersedia. Silakan coba lagi.",
  );
}

