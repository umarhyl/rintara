import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/worker/:path*",
    "/employer/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/account/continue",
    "/auth/status",
  ],
};
