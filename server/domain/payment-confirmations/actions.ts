"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import {
  agreements,
  auditLogs,
  cashPaymentConfirmations,
  jobs,
  notifications,
  workSessions,
} from "@/server/db/schema";
import { assertCashPaymentConfirmationTransition } from "@/server/domain/lifecycle";
import { ApplicationError } from "@/server/errors/application-error";
import {
  CASH_PAYMENT_CONFIRMATION_WINDOW_MS,
  isCashPaymentMethod,
} from "./policy";

const agreementIdSchema = z.string().uuid();
const workerReceiptSchema = z
  .object({
    agreementId: z.string().uuid(),
    received: z.boolean(),
  })
  .strict();

export type CashPaymentConfirmationResult = {
  agreementId: string;
  status:
    | "awaiting_worker"
    | "confirmed_received"
    | "reported_not_received"
    | "auto_confirmed";
  employerMarkedPaidAt: string;
  workerRespondedAt: string | null;
  confirmedAt: string | null;
  autoConfirmAt: string;
};

function serializeConfirmation(row: {
  agreementId: string;
  status: CashPaymentConfirmationResult["status"];
  employerMarkedPaidAt: Date;
  workerRespondedAt: Date | null;
  confirmedAt: Date | null;
  autoConfirmAt: Date;
}): CashPaymentConfirmationResult {
  return {
    agreementId: row.agreementId,
    status: row.status,
    employerMarkedPaidAt: row.employerMarkedPaidAt.toISOString(),
    workerRespondedAt: row.workerRespondedAt?.toISOString() ?? null,
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    autoConfirmAt: row.autoConfirmAt.toISOString(),
  };
}

function revalidatePaymentConfirmation(agreementId: string) {
  revalidatePath(`/employer/work/${agreementId}`);
  revalidatePath(`/worker/work/${agreementId}`);
  revalidatePath("/employer/notifications");
  revalidatePath("/worker/notifications");
}

export async function markCashPaymentPaid(
  agreementIdInput: unknown,
): Promise<CashPaymentConfirmationResult> {
  const parsed = agreementIdSchema.safeParse(agreementIdInput);
  if (!parsed.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid agreement identifier.",
    );
  }

  const actor = await requireActiveUser();
  if (actor.role !== "employer") {
    throw new ApplicationError(
      "FORBIDDEN",
      "Only the related employer can update cash payment confirmation.",
    );
  }

  const now = new Date();
  const autoConfirmAt = new Date(
    now.getTime() + CASH_PAYMENT_CONFIRMATION_WINDOW_MS,
  );

  const confirmation = await db.transaction(async (tx) => {
    const [agreement] = await tx
      .select({
        id: agreements.id,
        workerId: agreements.workerId,
        employerId: agreements.employerId,
        agreementStatus: agreements.status,
        jobStatus: jobs.status,
        sessionStatus: workSessions.status,
        termsSnapshot: agreements.termsSnapshot,
      })
      .from(agreements)
      .innerJoin(jobs, eq(jobs.id, agreements.jobId))
      .innerJoin(workSessions, eq(workSessions.agreementId, agreements.id))
      .where(
        and(
          eq(agreements.id, parsed.data),
          eq(agreements.employerId, actor.userId),
        ),
      )
      .limit(1)
      .for("update");

    if (!agreement) {
      throw new ApplicationError(
        "NOT_FOUND",
        "The completed work was not found.",
      );
    }
    if (
      agreement.agreementStatus !== "completed" ||
      agreement.jobStatus !== "completed" ||
      agreement.sessionStatus !== "verified" ||
      !isCashPaymentMethod(agreement.termsSnapshot.paymentMethod)
    ) {
      throw new ApplicationError(
        "CASH_PAYMENT_CONFIRMATION_NOT_AVAILABLE",
        "Cash payment confirmation is available only for completed cash jobs.",
      );
    }

    const [existing] = await tx
      .select()
      .from(cashPaymentConfirmations)
      .where(eq(cashPaymentConfirmations.agreementId, agreement.id))
      .limit(1)
      .for("update");

    if (existing && existing.status !== "reported_not_received") {
      return existing;
    }

    let saved;
    if (existing) {
      assertCashPaymentConfirmationTransition(
        existing.status,
        "awaiting_worker",
      );
      [saved] = await tx
        .update(cashPaymentConfirmations)
        .set({
          status: "awaiting_worker",
          employerMarkedPaidAt: now,
          workerRespondedAt: null,
          confirmedAt: null,
          autoConfirmAt,
          updatedAt: now,
        })
        .where(eq(cashPaymentConfirmations.id, existing.id))
        .returning();
    } else {
      [saved] = await tx
        .insert(cashPaymentConfirmations)
        .values({
          agreementId: agreement.id,
          status: "awaiting_worker",
          employerMarkedPaidAt: now,
          autoConfirmAt,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
    }

    await tx.insert(notifications).values({
      recipientId: agreement.workerId,
      type: "cash_payment_marked_paid",
      title: "Pembayaran tunai ditandai selesai",
      body: "Pemberi kerja menandai pembayaran tunai sudah diberikan. Konfirmasi apakah kamu sudah menerimanya.",
      entityType: "agreement",
      entityId: agreement.id,
      createdAt: now,
    });
    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "mark_cash_payment_paid",
      entityType: "agreement",
      entityId: agreement.id,
      requestId: actor.requestId,
      metadata: { autoConfirmAt: autoConfirmAt.toISOString() },
      createdAt: now,
    });

    return saved!;
  });

  revalidatePaymentConfirmation(confirmation.agreementId);
  return serializeConfirmation(confirmation);
}

export async function confirmCashPaymentReceipt(
  input: unknown,
): Promise<CashPaymentConfirmationResult> {
  const parsed = workerReceiptSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid cash payment confirmation input.",
    );
  }

  const actor = await requireActiveUser();
  if (actor.role !== "worker") {
    throw new ApplicationError(
      "FORBIDDEN",
      "Only the related worker can confirm cash payment receipt.",
    );
  }

  const now = new Date();
  const confirmation = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: cashPaymentConfirmations.id,
        agreementId: cashPaymentConfirmations.agreementId,
        employerId: agreements.employerId,
        status: cashPaymentConfirmations.status,
        employerMarkedPaidAt: cashPaymentConfirmations.employerMarkedPaidAt,
        workerRespondedAt: cashPaymentConfirmations.workerRespondedAt,
        confirmedAt: cashPaymentConfirmations.confirmedAt,
        autoConfirmAt: cashPaymentConfirmations.autoConfirmAt,
      })
      .from(cashPaymentConfirmations)
      .innerJoin(
        agreements,
        eq(agreements.id, cashPaymentConfirmations.agreementId),
      )
      .where(
        and(
          eq(cashPaymentConfirmations.agreementId, parsed.data.agreementId),
          eq(agreements.workerId, actor.userId),
        ),
      )
      .limit(1)
      .for("update");

    if (!row) {
      throw new ApplicationError(
        "NOT_FOUND",
        "The cash payment confirmation was not found.",
      );
    }

    const nextStatus = parsed.data.received
      ? "confirmed_received"
      : "reported_not_received";
    if (
      (row.status === "confirmed_received" && parsed.data.received) ||
      (row.status === "reported_not_received" && !parsed.data.received)
    ) {
      return row;
    }
    if (row.status === "confirmed_received") {
      throw new ApplicationError(
        "CASH_PAYMENT_CONFIRMATION_NOT_PENDING",
        "Cash payment receipt was already confirmed.",
      );
    }

    assertCashPaymentConfirmationTransition(row.status, nextStatus);
    const [saved] = await tx
      .update(cashPaymentConfirmations)
      .set({
        status: nextStatus,
        workerRespondedAt: now,
        confirmedAt: parsed.data.received ? now : null,
        updatedAt: now,
      })
      .where(eq(cashPaymentConfirmations.id, row.id))
      .returning();

    await tx.insert(notifications).values({
      recipientId: row.employerId,
      type: parsed.data.received
        ? "cash_payment_received"
        : "cash_payment_not_received",
      title: parsed.data.received
        ? "Pembayaran tunai diterima"
        : "Pembayaran tunai belum diterima",
      body: parsed.data.received
        ? "Pekerja mengonfirmasi sudah menerima pembayaran tunai."
        : "Pekerja melaporkan pembayaran tunai belum diterima. Periksa kembali langsung dengan pekerja.",
      entityType: "agreement",
      entityId: row.agreementId,
      createdAt: now,
    });
    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: parsed.data.received
        ? "confirm_cash_payment_received"
        : "report_cash_payment_not_received",
      entityType: "agreement",
      entityId: row.agreementId,
      requestId: actor.requestId,
      metadata: { previousStatus: row.status, newStatus: nextStatus },
      createdAt: now,
    });

    return saved;
  });

  revalidatePaymentConfirmation(confirmation.agreementId);
  return serializeConfirmation(confirmation);
}
