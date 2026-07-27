import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { notifications } from "@/server/db/schema";
import { getNotificationDestination } from "@/server/queries/notification-destination";

type NotificationsDatabase = PostgresJsDatabase<typeof schema>;

export type NotificationListItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export async function listMyNotifications(
  context?: RequestContext,
  database: NotificationsDatabase = db,
) {
  const actor = assertActiveUser(context ?? (await requireActiveUser()));
  const rows = await database
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      type: notifications.type,
      entityType: notifications.entityType,
      entityId: notifications.entityId,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.recipientId, actor.userId))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(20);

  const [{ unreadCount }] = await database
    .select({
      unreadCount: sql<number>`count(*)::int`,
    })
    .from(notifications)
    .where(
      sql`${notifications.recipientId} = ${actor.userId} and ${notifications.readAt} is null`,
    );

  return {
    items: rows.map((row): NotificationListItem => {
      return {
        id: row.id,
        title: row.title,
        body: row.body,
        type: row.type,
        href: getNotificationDestination(actor.role, row),
        readAt: row.readAt,
        createdAt: row.createdAt,
      };
    }),
    unreadCount,
  };
}
