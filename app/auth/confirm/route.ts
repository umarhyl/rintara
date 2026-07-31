import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeApplicationPath } from "@/server/auth/redirects";
import { REGISTRATION_ONBOARDING_COOKIE } from "@/server/auth/environment";

const supportedEmailOtpTypes = new Set<EmailOtpType>([
  "email",
  "recovery",
  "invite",
  "email_change",
]);

function failureUrl(request: NextRequest, type: EmailOtpType | null) {
  const recovery = type === "recovery";
  const url = new URL(recovery ? "/forgot-password" : "/verify-email", request.url);
  url.searchParams.set(
    "error",
    recovery ? "recovery_failed" : "verification_failed",
  );
  return url;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const rawType = request.nextUrl.searchParams.get("type");
  const type =
    rawType && supportedEmailOtpTypes.has(rawType as EmailOtpType)
      ? (rawType as EmailOtpType)
      : null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(failureUrl(request, type));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(failureUrl(request, type));
  }

  if (type === "recovery") {
    return NextResponse.redirect(new URL("/reset-password", request.url));
  }

  const metadataHint = data.user?.user_metadata?.rintara_onboarding_path;
  const cookieHint = request.cookies.get(
    REGISTRATION_ONBOARDING_COOKIE,
  )?.value;
  const destination = safeApplicationPath(
    typeof metadataHint === "string" ? metadataHint : (cookieHint ?? null),
    "/register",
  );
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(REGISTRATION_ONBOARDING_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}
