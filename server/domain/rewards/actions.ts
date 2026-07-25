"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, gt, lte } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import {
  auditLogs,
  idempotencyKeys,
  jobBoosts,
  jobs,
  notifications,
  opportunityCredits,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

const redeemSchema = z
  .object({
    creditId: z.string().uuid(),
    jobId: z.string().uuid(),
    idempotencyKey: z.string().trim().min(8).max(255),
  })
  .strict();

export type RedeemOpportunityCreditResult = {
  creditId: string;
  jobId: string;
  boostId: string;
  startsAt: string;
  endsAt: string;
};

function hashRequest(input: z.infer<typeof redeemSchema>) {
  return createHash("sha256")
    .update(JSON.stringify({
      creditId: input.creditId,
      jobId: input.jobId,
    }))
    .digest("hex");
}

function parseStoredResult(payload: Record<string, unknown> | null) {
  if (
    payload &&
    typeof payload.creditId === "string" &&
    typeof payload.jobId === "string" &&
    typeof payload.boostId === "string" &&
    typeof payload.startsAt === "string" &&
    typeof payload.endsAt === "string"
  ) {
    return payload as RedeemOpportunityCreditResult;
  }
  return null;
}

export async function redeemOpportunityCredit(
  input: unknown,
): Promise<RedeemOpportunityCreditResult> {
  const parsed = redeemSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApplicationError("VALIDATION_FAILED", "Invalid credit redemption input.");
  }

  const actor = await requireActiveUser();
  if (actor.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only employers can redeem credits.");
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const requestHash = hashRequest(parsed.data);

  const result = await db.transaction(async (tx) => {
    const [existingKey] = await tx
      .select()
      .from(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.actorId, actor.userId),
          eq(idempotencyKeys.operation, "redeem_opportunity_credit"),
          eq(idempotencyKeys.key, parsed.data.idempotencyKey),
        ),
      )
      .limit(1)
      .for("update");

    if (existingKey) {
      if (existingKey.requestHash !== requestHash) {
        throw new ApplicationError(
          "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_INPUT",
          "This idempotency key was used with different input.",
        );
      }
      const stored = parseStoredResult(existingKey.responsePayload);
      if (stored) return stored;
    } else {
      await tx.insert(idempotencyKeys).values({
        actorId: actor.userId,
        operation: "redeem_opportunity_credit",
        key: parsed.data.idempotencyKey,
        requestHash,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    const [credit] = await tx
      .select()
      .from(opportunityCredits)
      .where(
        and(
          eq(opportunityCredits.id, parsed.data.creditId),
          eq(opportunityCredits.employerId, actor.userId),
        ),
      )
      .limit(1)
      .for("update");

    if (
      !credit ||
      credit.status !== "earned" ||
      credit.redeemedAt ||
      credit.revokedAt ||
      (credit.expiresAt && credit.expiresAt <= now)
    ) {
      throw new ApplicationError("CREDIT_NOT_AVAILABLE", "Credit is not available.");
    }

    const [job] = await tx
      .select({
        id: jobs.id,
        employerId: jobs.employerId,
        status: jobs.status,
        visibility: jobs.visibility,
      })
      .from(jobs)
      .where(eq(jobs.id, parsed.data.jobId))
      .limit(1)
      .for("update");

    if (!job || job.employerId !== actor.userId) {
      throw new ApplicationError("JOB_NOT_OWNED", "Job is not owned by this employer.");
    }
    if (job.status !== "published" || job.visibility !== "visible") {
      throw new ApplicationError("JOB_NOT_PUBLISHED", "Job must be visible and published.");
    }

    const [activeBoost] = await tx
      .select({ id: jobBoosts.id })
      .from(jobBoosts)
      .where(
        and(
          eq(jobBoosts.jobId, job.id),
          eq(jobBoosts.status, "active"),
          lte(jobBoosts.startsAt, now),
          gt(jobBoosts.endsAt, now),
        ),
      )
      .limit(1);

    if (activeBoost) {
      throw new ApplicationError("BOOST_ALREADY_ACTIVE", "Job already has an active boost.");
    }

    await tx
      .update(opportunityCredits)
      .set({
        status: "redeemed",
        redeemedAt: now,
        targetJobId: job.id,
      })
      .where(eq(opportunityCredits.id, credit.id));

    const [boost] = await tx
      .insert(jobBoosts)
      .values({
        creditId: credit.id,
        jobId: job.id,
        startsAt: now,
        endsAt,
        status: "active",
      })
      .returning({ id: jobBoosts.id });

    const response: RedeemOpportunityCreditResult = {
      creditId: credit.id,
      jobId: job.id,
      boostId: boost.id,
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
    };

    await tx
      .update(idempotencyKeys)
      .set({
        responsePayload: response,
        completedAt: now,
      })
      .where(
        and(
          eq(idempotencyKeys.actorId, actor.userId),
          eq(idempotencyKeys.operation, "redeem_opportunity_credit"),
          eq(idempotencyKeys.key, parsed.data.idempotencyKey),
        ),
      );

    await tx.insert(notifications).values({
      recipientId: actor.userId,
      type: "credit_redeemed",
      title: "Boost 24 jam aktif",
      body: "Satu Kredit Kesempatan berhasil digunakan untuk meningkatkan visibilitas pekerjaan.",
      entityType: "job",
      entityId: job.id,
      createdAt: now,
    });

    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "redeem_opportunity_credit",
      entityType: "credit",
      entityId: credit.id,
      requestId: actor.requestId,
      metadata: { jobId: job.id, boostId: boost.id },
      createdAt: now,
    });

    return response;
  });

  revalidatePath("/employer/opportunity-credits");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${result.jobId}`);
  revalidatePath(`/employer/jobs/${result.jobId}`);

  return result;
}
