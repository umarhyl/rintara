"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import { notifications } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

const notificationIdSchema = z.string().uuid();

function revalidateNotificationPages(role: "worker" | "employer" | "admin") {
  if (role === "worker") {
    revalidatePath("/worker/notifications");
    revalidatePath("/worker/dashboard");
  } else if (role === "employer") {
    revalidatePath("/employer/notifications");
    revalidatePath("/employer/dashboard");
  }
}

export async function markNotificationRead(notificationIdInput: unknown) {
  const parsed = notificationIdSchema.safeParse(notificationIdInput);
  if (!parsed.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid notification identifier.",
    );
  }

  const actor = await requireActiveUser();
  const now = new Date();
  const [updated] = await db
    .update(notifications)
    .set({ readAt: now })
    .where(
      and(
        eq(notifications.id, parsed.data),
        eq(notifications.recipientId, actor.userId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id, readAt: notifications.readAt });

  if (!updated) {
    const [owned] = await db
      .select({ id: notifications.id, readAt: notifications.readAt })
      .from(notifications)
      .where(
        and(
          eq(notifications.id, parsed.data),
          eq(notifications.recipientId, actor.userId),
        ),
      )
      .limit(1);

    if (!owned) {
      throw new ApplicationError(
        "NOT_FOUND",
        "The notification was not found.",
      );
    }

    return { notificationId: owned.id, readAt: owned.readAt!.toISOString() };
  }

  revalidateNotificationPages(actor.role);
  return {
    notificationId: updated.id,
    readAt: updated.readAt!.toISOString(),
  };
}

export async function markAllNotificationsRead() {
  const actor = await requireActiveUser();
  const now = new Date();
  const updated = await db
    .update(notifications)
    .set({ readAt: now })
    .where(
      and(
        eq(notifications.recipientId, actor.userId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id });

  revalidateNotificationPages(actor.role);
  return { updatedCount: updated.length, readAt: now.toISOString() };
}
