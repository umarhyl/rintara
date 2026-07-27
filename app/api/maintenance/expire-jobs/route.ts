import { timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { expireUnfilledJobs } from "@/server/domain/jobs/expiry";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incomingRequestId = request.headers.get("x-request-id")?.trim();
  const result = await expireUnfilledJobs({
    requestId:
      incomingRequestId && incomingRequestId.length <= 128
        ? incomingRequestId
        : randomUUID(),
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
