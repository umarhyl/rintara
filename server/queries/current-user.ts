import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { employerProfiles, users, workerProfiles } from "@/server/db/schema";
import { requireActiveUser } from "@/server/auth/identity";

export type DashboardContext = {
  userId: string;
  role: "worker" | "employer" | "admin";
  displayName: string;
};

export const getCurrentUserDashboardContext = cache(async (): Promise<DashboardContext> => {
  const context = await requireActiveUser();
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
    userId: context.userId,
    role: context.role,
    displayName:
      context.role === "worker"
        ? account!.workerName!
        : context.role === "employer"
          ? account!.employerName!
          : "Admin Rintara",
  };
});
