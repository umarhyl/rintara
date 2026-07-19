import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { agreements, jobs } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
import { assertActiveUser, assertAdmin, assertRole } from "./policies";
import type { RequestContext } from "./types";

export async function requireJobOwner(
  context: RequestContext,
  jobId: string,
): Promise<RequestContext> {
  assertRole(assertActiveUser(context), "employer");

  const [ownedJob] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.employerId, context.userId)))
    .limit(1);

  if (!ownedJob) {
    throw new ApplicationError("NOT_FOUND", "The requested job was not found.");
  }

  return context;
}

export async function requireAgreementParty(
  context: RequestContext,
  agreementId: string,
): Promise<RequestContext> {
  assertActiveUser(context);

  const partyCondition =
    context.role === "worker"
      ? eq(agreements.workerId, context.userId)
      : context.role === "employer"
        ? eq(agreements.employerId, context.userId)
        : undefined;

  if (!partyCondition) {
    throw new ApplicationError(
      "FORBIDDEN",
      "This operation requires an agreement party.",
    );
  }

  const [agreement] = await db
    .select({ id: agreements.id })
    .from(agreements)
    .where(and(eq(agreements.id, agreementId), partyCondition))
    .limit(1);

  if (!agreement) {
    throw new ApplicationError(
      "NOT_FOUND",
      "The requested agreement was not found.",
    );
  }

  return context;
}

export function requireAdmin(context: RequestContext): RequestContext {
  return assertAdmin(context);
}
