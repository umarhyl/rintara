import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const authenticatedRoutePrefixes = [
  "/worker",
  "/employer",
  "/admin",
  "/onboarding",
  "/account/continue",
] as const;
const publicAuthStatusPath = "/auth/status";
const verifiedSessionHeader = "x-rintara-verified-session";

function requiresAuthenticatedSession(pathname: string) {
  return authenticatedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSupabaseSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(verifiedSessionHeader);

  if (
    !requiresAuthenticatedSession(request.nextUrl.pathname) &&
    request.nextUrl.pathname !== publicAuthStatusPath
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let refreshedCookies: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];
  let refreshedHeaders: Record<string, string> = {};

  function nextResponse() {
    const next = NextResponse.next({ request: { headers: requestHeaders } });

    for (const [name, value] of Object.entries(refreshedHeaders)) {
      next.headers.set(name, value);
    }
    for (const { name, value, options } of refreshedCookies) {
      next.cookies.set(name, value, options);
    }

    return next;
  }

  let response = nextResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          refreshedCookies = cookiesToSet;
          refreshedHeaders = headersToSet;

          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          requestHeaders.set("cookie", request.cookies.toString());

          response = nextResponse();
        },
      },
    },
  );

  // Reject anonymous protected requests before React can stream any private
  // page shell. Page queries and commands still enforce role and relationship.
  const { data, error } = await supabase.auth.getClaims();
  const authenticated = !error && typeof data?.claims?.sub === "string";
  requestHeaders.set(
    verifiedSessionHeader,
    authenticated ? "authenticated" : "anonymous",
  );
  response = nextResponse();

  if (
    requiresAuthenticatedSession(request.nextUrl.pathname) &&
    !authenticated
  ) {
    const signInUrl = request.nextUrl.clone();
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    signInUrl.pathname = "/sign-in";
    signInUrl.search = "";
    signInUrl.searchParams.set("next", nextPath);

    const redirectResponse = NextResponse.redirect(signInUrl);
    for (const [name, value] of Object.entries(refreshedHeaders)) {
      redirectResponse.headers.set(name, value);
    }
    for (const { name, value, options } of refreshedCookies) {
      redirectResponse.cookies.set(name, value, options);
    }

    return redirectResponse;
  }

  return response;
}
