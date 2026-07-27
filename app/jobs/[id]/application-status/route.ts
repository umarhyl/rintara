import { NextResponse, type NextRequest } from "next/server";

import { ApplicationError } from "@/server/errors/application-error";
import { getWorkerJobApplicationState } from "@/server/queries/applications/worker-job-application";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const privateResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

function errorStatus(error: ApplicationError) {
  switch (error.code) {
    case "VALIDATION_FAILED":
      return 400;
    case "UNAUTHENTICATED":
      return 401;
    case "ACCOUNT_INACTIVE":
    case "FORBIDDEN":
      return 403;
    case "ONBOARDING_REQUIRED":
      return 409;
    default:
      return 503;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const state = await getWorkerJobApplicationState(id);

    return NextResponse.json(state, { headers: privateResponseHeaders });
  } catch (error) {
    return NextResponse.json(
      { state: "unavailable" },
      {
        status:
          error instanceof ApplicationError ? errorStatus(error) : 503,
        headers: privateResponseHeaders,
      },
    );
  }
}
