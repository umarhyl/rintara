import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { employerProfiles, users, workerProfiles } from "@/server/db/schema";
import { requireActiveUser } from "@/server/auth/identity";
import type { RequestContext } from "@/server/auth/types";

export type DashboardContext = RequestContext & {
  displayName: string;
};

export const getCurrentUserDashboardContext = cache(async (): Promise<DashboardContext> => {
  const context = await requireActiveUser();

  if (context.role === "admin") {
    return {
      ...context,
      displayName: "Admin Rintara",
    };
  }

  const [account] = await db
    .select({
      workerName: workerProfiles.displayName,
      employerName: employerProfiles.displayName,
    })
    .from(users)
    .leftJoin(workerProfiles, eq(workerProfiles.userId, users.id))
    .leftJoin(employerProfiles, eq(employerProfiles.userId, users.id))
    .where(eq(users.id, context.userId))
    .limit(1);

  return {
    ...context,
    displayName:
      context.role === "worker"
        ? account!.workerName!
        : account!.employerName!,
  };
});
