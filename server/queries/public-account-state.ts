import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { employerProfiles, users, workerProfiles } from "@/server/db/schema";
import { hasCompleteRoleProfile } from "@/server/auth/profile-completeness";
import { getVerifiedAuthSubject } from "@/server/auth/verified-subject";

export type PublicAccountPresentationState =
  | {
      state: "onboarding";
      role: "worker" | "employer" | null;
      displayName: string | null;
    }
  | {
      state: "ready";
      role: "worker" | "employer" | "admin";
      displayName: string | null;
    }
  | {
      state: "inactive";
      role: "worker" | "employer" | "admin";
      displayName: string | null;
    };

export async function getPublicAccountPresentationState(): Promise<PublicAccountPresentationState> {
  const authSubject = await getVerifiedAuthSubject();
  const [account] = await db
    .select({
      role: users.role,
      status: users.status,
      workerProfileId: workerProfiles.userId,
      employerProfileId: employerProfiles.userId,
      workerDisplayName: workerProfiles.displayName,
      employerDisplayName: employerProfiles.displayName,
    })
    .from(users)
    .leftJoin(workerProfiles, eq(workerProfiles.userId, users.id))
    .leftJoin(employerProfiles, eq(employerProfiles.userId, users.id))
    .where(eq(users.authSubject, authSubject))
    .limit(1);

  if (!account) {
    return { state: "onboarding", role: null, displayName: null };
  }

  const displayName =
    account.role === "worker"
      ? account.workerDisplayName
      : account.role === "employer"
        ? account.employerDisplayName
        : "Admin Rintara";

  if (account.status !== "active") {
    return { state: "inactive", role: account.role, displayName };
  }

  if (account.role === "admin") {
    return { state: "ready", role: "admin", displayName };
  }

  if (!hasCompleteRoleProfile(account)) {
    return { state: "onboarding", role: account.role, displayName };
  }

  return { state: "ready", role: account.role, displayName };
}
