import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
import { assertActiveUser, buildRequestContext } from "./policies";
import type { RequestContext } from "./types";

export async function getVerifiedAuthSubject(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;

  if (error || typeof subject !== "string" || subject.length === 0) {
    throw new ApplicationError(
      "UNAUTHENTICATED",
      "A valid sign-in session is required.",
    );
  }

  return subject;
}

export async function requireUser(
  requestId: string = randomUUID(),
): Promise<RequestContext> {
  const authSubject = await getVerifiedAuthSubject();
  const [user] = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.authSubject, authSubject))
    .limit(1);

  if (!user) {
    throw new ApplicationError(
      "ONBOARDING_REQUIRED",
      "Complete account onboarding before continuing.",
    );
  }

  return buildRequestContext(requestId, user);
}

export async function requireActiveUser(
  requestId?: string,
): Promise<RequestContext> {
  return assertActiveUser(await requireUser(requestId));
}
