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
    const safeNextPath = safeApplicationPath(nextPath, "/account/continue");
    callbackUrl.searchParams.set(
      "next",
      `/onboarding/role?next=${encodeURIComponent(safeNextPath)}`,
    );
  }

  return callbackUrl.toString();
}
