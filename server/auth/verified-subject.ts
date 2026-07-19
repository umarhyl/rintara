import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireSubjectClaim } from "./identity-claims";

/** Verifies the cookie-backed provider session without loading the database. */
export const getVerifiedAuthSubject = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return requireSubjectClaim(data?.claims, Boolean(error));
});
