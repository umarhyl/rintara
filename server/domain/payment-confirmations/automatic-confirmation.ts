import "server-only";

import { and, eq, lte } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  agreements,
  auditLogs,
  cashPaymentConfirmations,
  notifications,
} from "@/server/db/schema";
import { assertCashPaymentConfirmationTransition } from "@/server/domain/lifecycle";

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;

export type AutoConfirmCashPaymentsResult = {
  confirmedPaymentCount: number;
};

export async function autoConfirmCashPayments({
  now = new Date(),
  requestId,
  limit = DEFAULT_BATCH_SIZE,
}: {
  now?: Date;
  requestId: string;
  limit?: number;
}): Promise<AutoConfirmCashPaymentsResult> {
  const batchSize = Math.max(1, Math.min(Math.trunc(limit), MAX_BATCH_SIZE));

  return db.transaction(async (tx) => {
    const pending = await tx
      .select({
        id: cashPaymentConfirmations.id,
        agreementId: cashPaymentConfirmations.agreementId,
        workerId: agreements.workerId,
        employerId: agreements.employerId,
        status: cashPaymentConfirmations.status,
      })
      .from(cashPaymentConfirmations)
      .innerJoin(
        agreements,
        eq(agreements.id, cashPaymentConfirmations.agreementId),
      )
      .where(
        and(
          eq(cashPaymentConfirmations.status, "awaiting_worker"),
          lte(cashPaymentConfirmations.autoConfirmAt, now),
        ),
      )
      .orderBy(
        cashPaymentConfirmations.autoConfirmAt,
        cashPaymentConfirmations.id,
      )
      .limit(batchSize)
      .for("update", { skipLocked: true });

    let confirmedPaymentCount = 0;
    for (const row of pending) {
      assertCashPaymentConfirmationTransition(row.status, "auto_confirmed");
      const [updated] = await tx
        .update(cashPaymentConfirmations)
        .set({
          status: "auto_confirmed",
          confirmedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(cashPaymentConfirmations.id, row.id),
            eq(cashPaymentConfirmations.status, "awaiting_worker"),
          ),
        )
        .returning({ id: cashPaymentConfirmations.id });
      if (!updated) continue;

      confirmedPaymentCount += 1;
      await tx.insert(notifications).values([
        {
          recipientId: row.workerId,
          type: "cash_payment_auto_confirmed",
          title: "Pembayaran tunai dikonfirmasi otomatis",
          body: "Tidak ada respons dalam 48 jam, sehingga penerimaan pembayaran dicatat otomatis. Jika belum menerima, laporkan dari halaman pekerjaan.",
          entityType: "agreement",
          entityId: row.agreementId,
          createdAt: now,
        },
        {
          recipientId: row.employerId,
          type: "cash_payment_auto_confirmed",
          title: "Pembayaran tunai dikonfirmasi otomatis",
          body: "Pekerja tidak merespons dalam 48 jam, sehingga penerimaan pembayaran dicatat otomatis.",
          entityType: "agreement",
          entityId: row.agreementId,
          createdAt: now,
        },
      ]);
      await tx.insert(auditLogs).values({
        actorId: null,
        action: "auto_confirm_cash_payment",
        entityType: "agreement",
        entityId: row.agreementId,
        requestId,
        metadata: {
          previousStatus: "awaiting_worker",
          newStatus: "auto_confirmed",
        },
        createdAt: now,
      });
    }

    return { confirmedPaymentCount };
  });
}
