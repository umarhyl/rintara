import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db/client";
import { employerProfiles, users, workerProfiles } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
import { assertActiveUser, buildRequestContext } from "./policies";
import { requireSubjectClaim } from "./identity-claims";
import { hasCompleteRoleProfile } from "./profile-completeness";
import type { RequestContext } from "./types";

export async function getVerifiedAuthSubject(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return requireSubjectClaim(data?.claims, Boolean(error));
}

export async function requireUser(
  requestId: string = randomUUID(),
): Promise<RequestContext> {
  const authSubject = await getVerifiedAuthSubject();
  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      status: users.status,
      workerProfileId: workerProfiles.userId,
      employerProfileId: employerProfiles.userId,
    })
    .from(users)
    .leftJoin(workerProfiles, eq(workerProfiles.userId, users.id))
    .leftJoin(employerProfiles, eq(employerProfiles.userId, users.id))
    .where(eq(users.authSubject, authSubject))
    .limit(1);

  if (!user || !hasCompleteRoleProfile(user)) {
    throw new ApplicationError(
      "ONBOARDING_REQUIRED",
      "Complete account onboarding before continuing.",
    );
  }

  return buildRequestContext(requestId, {
    id: user.id,
    role: user.role,
    status: user.status,
  });
}

export async function requireActiveUser(
  requestId?: string,
): Promise<RequestContext> {
  return assertActiveUser(await requireUser(requestId));
}
