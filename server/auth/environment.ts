import { z } from "zod";

const applicationUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    "Expected an HTTP(S) application URL",
  );

export function getAuthenticationCallbackUrl(): string {
  const baseUrl = applicationUrlSchema.parse(
    process.env.RINTARA_APP_URL ?? "http://localhost:3000",
  );

  return new URL("/auth/callback", baseUrl).toString();
}

