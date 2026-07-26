import { NextResponse, type NextRequest } from "next/server";
import { ApplicationError } from "@/server/errors/application-error";
import { getPublicAccountPresentationState } from "@/server/queries/public-account-state";

export const dynamic = "force-dynamic";

const privateResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

export async function GET(request: NextRequest) {
  // The proxy removes caller-supplied values and replaces this header only
  // after validating provider claims. It affects presentation only; private
  // pages and commands retain independent server authorization.
  const authenticated =
    request.headers.get("x-rintara-verified-session") === "authenticated";

  if (!authenticated) {
    return NextResponse.json(
      { authenticated: false, state: "anonymous" },
      { headers: privateResponseHeaders },
    );
  }

  // The common header only needs the inexpensive signed-in flag. The richer
  // account lookup is opt-in for controls whose copy depends on role/profile.
  if (request.nextUrl.searchParams.get("detail") !== "account") {
    return NextResponse.json(
      { authenticated: true },
      { headers: privateResponseHeaders },
    );
  }

  try {
    const accountState = await getPublicAccountPresentationState();

    return NextResponse.json(
      {
        authenticated: true,
        ...accountState,
      },
      { headers: privateResponseHeaders },
    );
  } catch (error) {
    if (
      error instanceof ApplicationError &&
      error.code === "UNAUTHENTICATED"
    ) {
      return NextResponse.json(
        { authenticated: false, state: "anonymous" },
        { headers: privateResponseHeaders },
      );
    }

    return NextResponse.json(
      { authenticated: true, state: "unavailable" },
      { status: 503, headers: privateResponseHeaders },
    );
  }
}
