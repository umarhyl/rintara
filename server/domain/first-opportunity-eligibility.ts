import "server-only";

import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/server/db/schema";
import { workProofs } from "@/server/db/schema";

type EligibilityDatabase = Pick<
  PostgresJsDatabase<typeof schema>,
  "select"
>;

export async function isFirstOpportunityEligible(
  database: EligibilityDatabase,
  workerId: string,
  categoryId: string,
): Promise<boolean> {
  const [verifiedProof] = await database
    .select({ id: workProofs.id })
    .from(workProofs)
    .where(
      and(
        eq(workProofs.workerId, workerId),
        eq(workProofs.categoryId, categoryId),
        eq(workProofs.verificationStatus, "verified"),
      ),
    )
    .limit(1);

  return verifiedProof === undefined;
}
