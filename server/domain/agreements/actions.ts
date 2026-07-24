"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import {
  agreements,
  auditLogs,
  notifications,
  workSessions,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
import { assertMiniAgreementTransition } from "@/server/domain/lifecycle";

const agreementIdSchema = z.string().uuid();

export type ConfirmAgreementResult = {
  agreementId: string;
  status: "pending_confirmation" | "active" | "completed" | "cancelled";
  workerConfirmedAt: string | null;
  employerConfirmedAt: string | null;
};

function toResult(agreement: {
  id: string;
  status: ConfirmAgreementResult["status"];
  workerConfirmedAt: Date | null;
  employerConfirmedAt: Date | null;
}): ConfirmAgreementResult {
  return {
    agreementId: agreement.id,
    status: agreement.status,
    workerConfirmedAt: agreement.workerConfirmedAt?.toISOString() ?? null,
    employerConfirmedAt: agreement.employerConfirmedAt?.toISOString() ?? null,
  };
}

export async function confirmAgreement(
  agreementIdInput: unknown,
): Promise<ConfirmAgreementResult> {
  const parsedId = agreementIdSchema.safeParse(agreementIdInput);
  if (!parsedId.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "The agreement identifier is invalid.",
      { agreementId: ["Use a valid agreement identifier."] },
    );
  }

  const actor = await requireActiveUser();
  if (actor.role !== "worker" && actor.role !== "employer") {
    throw new ApplicationError(
      "FORBIDDEN",
      "Only agreement parties can confirm an agreement.",
    );
  }

  const outcome = await db.transaction(async (tx) => {
    const partyCondition =
      actor.role === "worker"
        ? eq(agreements.workerId, actor.userId)
        : eq(agreements.employerId, actor.userId);
    const [agreement] = await tx
      .select({
        id: agreements.id,
        workerId: agreements.workerId,
        employerId: agreements.employerId,
        status: agreements.status,
        workerConfirmedAt: agreements.workerConfirmedAt,
        employerConfirmedAt: agreements.employerConfirmedAt,
      })
      .from(agreements)
      .where(and(eq(agreements.id, parsedId.data), partyCondition))
      .limit(1)
      .for("update");

    if (!agreement) {
      throw new ApplicationError(
        "NOT_FOUND",
        "The requested agreement was not found.",
      );
    }

    const alreadyConfirmed =
      actor.role === "worker"
        ? agreement.workerConfirmedAt !== null
        : agreement.employerConfirmedAt !== null;
    if (alreadyConfirmed) {
      return { changed: false, result: toResult(agreement) };
    }

    if (agreement.status !== "pending_confirmation") {
      throw new ApplicationError(
        "INVALID_STATE_TRANSITION",
        "This agreement can no longer be confirmed.",
      );
    }

    const now = new Date();
    const activates =
      actor.role === "worker"
        ? agreement.employerConfirmedAt !== null
        : agreement.workerConfirmedAt !== null;

    if (activates) {
      assertMiniAgreementTransition(agreement.status, "active");
    }

    const [updatedAgreement] = await tx
      .update(agreements)
      .set({
        ...(actor.role === "worker"
          ? { workerConfirmedAt: now }
          : { employerConfirmedAt: now }),
        status: activates ? "active" : "pending_confirmation",
        updatedAt: now,
      })
      .where(eq(agreements.id, agreement.id))
      .returning({
        id: agreements.id,
        status: agreements.status,
        workerConfirmedAt: agreements.workerConfirmedAt,
        employerConfirmedAt: agreements.employerConfirmedAt,
      });

    if (activates) {
      await tx.insert(workSessions).values({
        agreementId: agreement.id,
        status: "scheduled",
        createdAt: now,
        updatedAt: now,
      });
    }

    await tx.insert(notifications).values(
      activates
        ? [agreement.workerId, agreement.employerId].map((recipientId) => ({
            recipientId,
            type: "agreement_activated",
            title: "Mini Agreement aktif",
            body: "Kedua pihak telah mengonfirmasi. Pekerjaan siap dilanjutkan sesuai jadwal.",
            entityType: "agreement",
            entityId: agreement.id,
            createdAt: now,
          }))
        : [
            {
              recipientId:
                actor.role === "worker"
                  ? agreement.employerId
                  : agreement.workerId,
              type: "agreement_confirmation_requested",
              title: "Konfirmasi Mini Agreement",
              body: "Pihak lain telah mengonfirmasi Mini Agreement. Konfirmasimu masih diperlukan.",
              entityType: "agreement",
              entityId: agreement.id,
              createdAt: now,
            },
          ],
    );

    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "confirm_agreement",
      entityType: "agreement",
      entityId: agreement.id,
      requestId: actor.requestId,
      metadata: { party: actor.role, activated: activates },
      createdAt: now,
    });

    return { changed: true, result: toResult(updatedAgreement) };
  });

  if (outcome.changed) {
    revalidatePath(`/worker/agreements/${outcome.result.agreementId}`);
    revalidatePath(`/employer/agreements/${outcome.result.agreementId}`);
  }

  return outcome.result;
}
