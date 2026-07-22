import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeApplicationPath } from "@/server/auth/redirects";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeApplicationPath(request.nextUrl.searchParams.get("next"));

  function failedAuthenticationUrl() {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("error", "authentication_failed");
    if (next !== "/account/continue") signInUrl.searchParams.set("next", next);
    return signInUrl;
  }

  if (!code) {
    return NextResponse.redirect(failedAuthenticationUrl());
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(failedAuthenticationUrl());
  }

  return NextResponse.redirect(new URL(next, request.url));
}
