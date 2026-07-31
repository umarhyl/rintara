import { z } from "zod";
import { safeApplicationPath } from "./redirects";

const applicationUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    "Expected an HTTP(S) application URL",
  );

export function getAuthenticationCallbackUrl(nextPath?: string): string {
  const baseUrl = applicationUrlSchema.parse(
    process.env.RINTARA_APP_URL ?? "http://localhost:3000",
  );

  const callbackUrl = new URL("/auth/callback", baseUrl);
  if (nextPath) {
    callbackUrl.searchParams.set(
      "next",
      safeApplicationPath(nextPath, "/account/continue"),
    );
  }

  return callbackUrl.toString();
}

export function getEmailVerificationCallbackUrl(
  nextPath?: string,
  selectedRole?: "worker" | "employer" | null,
): string {
  const onboardingPath = getRegistrationOnboardingPath(
    nextPath,
    selectedRole,
  );
  const callbackUrl = new URL(getAuthenticationCallbackUrl(onboardingPath));
  callbackUrl.searchParams.set("flow", "signup");
  return callbackUrl.toString();
}

export function getRegistrationOnboardingPath(
  nextPath?: string,
  selectedRole?: "worker" | "employer" | null,
): string {
  const safeSelectedRole =
    selectedRole === "worker" || selectedRole === "employer"
      ? selectedRole
      : null;
  const safeNextPath = nextPath
    ? safeApplicationPath(nextPath, "/account/continue")
    : null;
  return safeSelectedRole
    ? `/onboarding/${safeSelectedRole}${
        safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : ""
      }`
    : safeNextPath
      ? `/onboarding/role?next=${encodeURIComponent(safeNextPath)}`
      : "/onboarding/role";
}

export function getPasswordRecoveryCallbackUrl(): string {
  const callbackUrl = new URL(getAuthenticationCallbackUrl());
  callbackUrl.searchParams.set("next", "/reset-password");
  return callbackUrl.toString();
}
