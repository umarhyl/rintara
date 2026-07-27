import "server-only";

import { Buffer } from "node:buffer";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import { reports } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

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
      "Invalid report pagination cursor.",
    );
  }
}

function encodeCursor(row: { id: string; createdAt: Date }) {
  return Buffer.from(
    JSON.stringify([row.createdAt.toISOString(), row.id]),
  ).toString("base64url");
}

export async function listMyReports(input: {
  cursor?: string;
  limit?: number;
} = {}) {
  const actor = await requireActiveUser();
  const limit =
    Number.isInteger(input.limit) && input.limit && input.limit > 0
      ? Math.min(input.limit, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const cursor = decodeCursor(input.cursor);

  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      description: reports.description,
      jobId: reports.jobId,
      agreementId: reports.agreementId,
      reportedUserId: reports.reportedUserId,
      status: reports.status,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt,
      resolvedAt: reports.resolvedAt,
    })
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, actor.userId),
        cursor
          ? or(
              lt(reports.createdAt, cursor.createdAt),
              and(
                eq(reports.createdAt, cursor.createdAt),
                lt(reports.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(reports.createdAt), desc(reports.id))
    .limit(limit + 1);

  const items = rows.slice(0, limit);
  return {
    items,
    nextCursor:
      rows.length > limit ? encodeCursor(items.at(-1)!) : null,
  };
}
