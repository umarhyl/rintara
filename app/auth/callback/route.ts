import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeApplicationPath } from "@/server/auth/redirects";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeApplicationPath(request.nextUrl.searchParams.get("next"));
  const flow = request.nextUrl.searchParams.get("flow");

  function failedAuthenticationUrl() {
    if (next === "/reset-password") {
      const recoveryUrl = new URL("/forgot-password", request.url);
      recoveryUrl.searchParams.set("error", "recovery_failed");
      return recoveryUrl;
    }

    if (flow === "signup") {
      const verificationUrl = new URL("/verify-email", request.url);
      verificationUrl.searchParams.set("error", "verification_failed");
      return verificationUrl;
    }

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
