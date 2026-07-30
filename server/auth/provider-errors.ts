import type { AuthError } from "@supabase/supabase-js";
import { ApplicationError } from "@/server/errors/application-error";

type AuthOperation =
  | "sign-up"
  | "sign-in"
  | "sign-out"
  | "password-recovery"
  | "password-update";

export function isExistingAccountSignUpError(
  error: Pick<AuthError, "code">,
): boolean {
  return (
    error.code === "user_already_exists" || error.code === "email_exists"
  );
}

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
    isExistingAccountSignUpError(error)
  ) {
    return new ApplicationError(
      "VALIDATION_FAILED",
      "Pendaftaran belum dapat dilanjutkan. Coba masuk atau pulihkan kata sandi.",
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

  if (
    operation === "password-update" &&
    (error.code === "session_not_found" ||
      error.code === "bad_jwt" ||
      error.status === 401)
  ) {
    return new ApplicationError(
      "UNAUTHENTICATED",
      "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
    );
  }

  if (operation === "password-update" && error.code === "weak_password") {
    return new ApplicationError(
      "VALIDATION_FAILED",
      "Kata sandi tidak memenuhi persyaratan keamanan.",
    );
  }

  return new ApplicationError(
    "INTERNAL_ERROR",
    "Layanan autentikasi tidak tersedia. Silakan coba lagi.",
  );
}
