import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // The proxy removes caller-supplied values and replaces this header only
  // after validating provider claims. It affects presentation only; private
  // pages and commands retain independent server authorization.
  const authenticated =
    request.headers.get("x-rintara-verified-session") === "authenticated";

  return NextResponse.json(
    { authenticated },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    },
  );
}
