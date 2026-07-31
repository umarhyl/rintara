import "server-only";

import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export function isAuthorizedMaintenanceRequest(request: NextRequest): boolean {
  const authorization = request.headers.get("authorization");
  const providedSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const providedSecretBytes = Buffer.from(providedSecret);
  const configuredSecrets = [
    process.env.CRON_SECRET,
    process.env.RINTARA_MAINTENANCE_SECRET,
  ].filter((secret): secret is string => Boolean(secret));

  return configuredSecrets.some((configuredSecret) => {
    const configuredSecretBytes = Buffer.from(configuredSecret);
    return (
      configuredSecretBytes.length >= 32 &&
      providedSecretBytes.length === configuredSecretBytes.length &&
      timingSafeEqual(providedSecretBytes, configuredSecretBytes)
    );
  });
}
