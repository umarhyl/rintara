import "server-only";

import { cache } from "react";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { employerProfiles, opportunityCredits, workProofs, areas } from "@/server/db/schema";
import { requireActiveUser } from "@/server/auth/identity";
import { ApplicationError } from "@/server/errors/application-error";

export type EmployerProfileData = {
  userId: string;
  displayName: string;
  employerType: "individual" | "business" | "community";
  areaId: string;
  areaName: string;
  description: string | null;
  completedJobsCount: number;
  activeCreditsCount: number;
  isOpportunityGiver: boolean;
};

export const getEmployerProfile = cache(async (): Promise<EmployerProfileData> => {
  const context = await requireActiveUser();
  if (context.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only employers can access this profile.");
  }

  const [profile] = await db
    .select({
      userId: employerProfiles.userId,
      displayName: employerProfiles.displayName,
      employerType: employerProfiles.employerType,
      areaId: employerProfiles.areaId,
      areaName: areas.name,
      description: employerProfiles.description,
    })
    .from(employerProfiles)
    .innerJoin(areas, eq(employerProfiles.areaId, areas.id))
    .where(eq(employerProfiles.userId, context.userId))
    .limit(1);

  if (!profile) {
    throw new ApplicationError("NOT_FOUND", "Profil pemberi kerja tidak ditemukan.");
  }

  const [proofsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workProofs)
    .where(
      and(
        eq(workProofs.employerId, context.userId),
        eq(workProofs.verificationStatus, "verified")
      )
    );

  const creditsResult = await db
    .select({
      status: opportunityCredits.status,
      expiresAt: opportunityCredits.expiresAt,
    })
    .from(opportunityCredits)
    .where(eq(opportunityCredits.employerId, context.userId));

  const hasEarnedCredit = creditsResult.some(c => c.status !== "revoked");
  
  const now = new Date();
  const activeCreditsCount = creditsResult.filter(
    c => c.status === "earned" && (c.expiresAt === null || new Date(c.expiresAt) > now)
  ).length;

  return {
    ...profile,
    completedJobsCount: proofsResult?.count ?? 0,
    activeCreditsCount,
    isOpportunityGiver: hasEarnedCredit,
  };
});
