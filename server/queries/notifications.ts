import "server-only";

import { Buffer } from "node:buffer";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { notifications } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
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

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function decodeCursor(value: string | undefined) {
  if (!value) return null;

  try {
    if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) {
      throw new Error("invalid");
    }
    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) throw new Error("invalid");
    const parsed: unknown = JSON.parse(decoded.toString("utf8"));
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 2 ||
      typeof parsed[0] !== "string" ||
      typeof parsed[1] !== "string" ||
      !UUID_PATTERN.test(parsed[1])
    ) {
      throw new Error("invalid");
    }
    const createdAt = new Date(parsed[0]);
    if (
      Number.isNaN(createdAt.getTime()) ||
      createdAt.toISOString() !== parsed[0]
    ) {
      throw new Error("invalid");
    }
    return { createdAt, id: parsed[1] };
  } catch {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid notification pagination cursor.",
    );
  }
}

function encodeCursor(row: { id: string; createdAt: Date }) {
  return Buffer.from(
    JSON.stringify([row.createdAt.toISOString(), row.id]),
  ).toString("base64url");
}

export async function listMyNotifications(
  input: { cursor?: string; limit?: number } = {},
  context?: RequestContext,
  database: NotificationsDatabase = db,
) {
  const actor = assertActiveUser(context ?? (await requireActiveUser()));
  const limit =
    Number.isInteger(input.limit) && input.limit && input.limit > 0
      ? Math.min(input.limit, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const cursor = decodeCursor(input.cursor);
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
    .where(
      and(
        eq(notifications.recipientId, actor.userId),
        cursor
          ? or(
              lt(notifications.createdAt, cursor.createdAt),
              and(
                eq(notifications.createdAt, cursor.createdAt),
                lt(notifications.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit + 1);

  const [{ unreadCount }] = await database
    .select({
      unreadCount: sql<number>`count(*)::int`,
    })
    .from(notifications)
    .where(
      sql`${notifications.recipientId} = ${actor.userId} and ${notifications.readAt} is null`,
    );

  const items = rows.slice(0, limit);
  return {
    items: items.map((row): NotificationListItem => {
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
    nextCursor:
      rows.length > limit ? encodeCursor(items.at(-1)!) : null,
  };
}
