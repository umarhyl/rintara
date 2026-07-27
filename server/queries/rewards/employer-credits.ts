import "server-only";

import { and, count, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  jobBoosts,
  jobs,
  agreements,
  opportunityCredits,
  workProofs,
} from "@/server/db/schema";

type CreditsDatabase = PostgresJsDatabase<typeof schema>;

export type EmployerCreditView = {
  id: string;
  sourceJobId: string;
  sourceJobTitle: string;
  status: "earned" | "redeemed" | "expired" | "revoked";
  earnedAt: Date;
  expiresAt: Date | null;
  redeemedAt: Date | null;
  targetJobId: string | null;
};

export type BoostTargetJob = {
  id: string;
  title: string;
  hasActiveBoost: boolean;
};

export type EmployerCreditDashboardSummary = {
  activeCreditCount: number;
  activeBoostCount: number;
};

export async function getMyCreditDashboardSummary(
  context?: RequestContext,
  database: CreditsDatabase = db,
): Promise<EmployerCreditDashboardSummary> {
  const actor = assertRole(
    assertActiveUser(context ?? (await requireActiveUser())),
    "employer",
  );
  const now = new Date();

  const [activeCreditRows, activeBoostRows] = await Promise.all([
    database
      .select({ value: count() })
      .from(opportunityCredits)
      .where(
        and(
          eq(opportunityCredits.employerId, actor.userId),
          eq(opportunityCredits.status, "earned"),
          or(
            isNull(opportunityCredits.expiresAt),
            gt(opportunityCredits.expiresAt, now),
          ),
        ),
      ),
    database
      .select({ value: count() })
      .from(jobBoosts)
      .innerJoin(jobs, eq(jobBoosts.jobId, jobs.id))
      .where(
        and(
          eq(jobs.employerId, actor.userId),
          eq(jobBoosts.status, "active"),
          sql`${jobBoosts.startsAt} <= now()`,
          sql`${jobBoosts.endsAt} > now()`,
        ),
      ),
  ]);

  return {
    activeCreditCount: activeCreditRows[0]?.value ?? 0,
    activeBoostCount: activeBoostRows[0]?.value ?? 0,
  };
}

export async function getMyCreditSummary(
  context?: RequestContext,
  database: CreditsDatabase = db,
) {
  const actor = assertRole(
    assertActiveUser(context ?? (await requireActiveUser())),
    "employer",
  );
  const now = new Date();

  const [activeCountRow, lifetimeCountRow, activeBoostCountRow] = await Promise.all([
    database
      .select({ value: count() })
      .from(opportunityCredits)
      .where(
        and(
          eq(opportunityCredits.employerId, actor.userId),
          eq(opportunityCredits.status, "earned"),
          or(isNull(opportunityCredits.expiresAt), gt(opportunityCredits.expiresAt, now)),
        ),
      ),
    database
      .select({ value: count() })
      .from(opportunityCredits)
      .where(
        and(
          eq(opportunityCredits.employerId, actor.userId),
          or(
            eq(opportunityCredits.status, "earned"),
            eq(opportunityCredits.status, "redeemed"),
            eq(opportunityCredits.status, "expired"),
          ),
        ),
      ),
    database
      .select({ value: count() })
      .from(jobBoosts)
      .innerJoin(jobs, eq(jobBoosts.jobId, jobs.id))
      .where(
        and(
          eq(jobs.employerId, actor.userId),
          eq(jobBoosts.status, "active"),
          sql`${jobBoosts.startsAt} <= now()`,
          sql`${jobBoosts.endsAt} > now()`,
        ),
      ),
  ]);

  const creditRows = await database
    .select({
      id: opportunityCredits.id,
      sourceJobId: opportunityCredits.sourceJobId,
      sourceJobTitle: jobs.title,
      status: opportunityCredits.status,
      earnedAt: opportunityCredits.earnedAt,
      expiresAt: opportunityCredits.expiresAt,
      redeemedAt: opportunityCredits.redeemedAt,
      targetJobId: opportunityCredits.targetJobId,
    })
    .from(opportunityCredits)
    .innerJoin(jobs, eq(opportunityCredits.sourceJobId, jobs.id))
    .where(eq(opportunityCredits.employerId, actor.userId))
    .orderBy(desc(opportunityCredits.earnedAt), desc(opportunityCredits.id))
    .limit(50);

  const targetRows = await database
    .select({
      id: jobs.id,
      title: jobs.title,
      hasActiveBoost: sql<boolean>`exists (
        select 1 from ${jobBoosts}
        where ${jobBoosts.jobId} = ${jobs.id}
          and ${jobBoosts.status} = 'active'
          and ${jobBoosts.startsAt} <= now()
          and ${jobBoosts.endsAt} > now()
      )`,
    })
    .from(jobs)
    .where(
      and(
        eq(jobs.employerId, actor.userId),
        eq(jobs.status, "published"),
        eq(jobs.visibility, "visible"),
      ),
    )
    .orderBy(desc(jobs.publishedAt), desc(jobs.id))
    .limit(50);

  const [proofCountRow] = await database
    .select({ value: count() })
    .from(workProofs)
    .innerJoin(agreements, eq(workProofs.agreementId, agreements.id))
    .where(
      and(
        eq(workProofs.employerId, actor.userId),
        eq(agreements.isFirstOpportunity, true),
        eq(workProofs.verificationStatus, "verified"),
        isNull(workProofs.revokedAt),
      ),
    );

  return {
    activeCreditCount: activeCountRow[0]?.value ?? 0,
    lifetimeCreditCount: lifetimeCountRow[0]?.value ?? 0,
    activeBoostCount: activeBoostCountRow[0]?.value ?? 0,
    completedOpportunityCount: proofCountRow?.value ?? 0,
    hasOpportunityGiverBadge: (lifetimeCountRow[0]?.value ?? 0) > 0,
    credits: creditRows satisfies EmployerCreditView[],
    targetJobs: targetRows satisfies BoostTargetJob[],
  };
}
