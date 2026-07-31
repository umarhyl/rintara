import "server-only";

import { Buffer } from "node:buffer";
import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { categories, workProofs } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

type WorkerPassportDatabase = PostgresJsDatabase<typeof schema>;

export type WorkerPassportInput = {
  cursor?: string;
  limit?: number;
};

export type WorkerPassportEntry = {
  id: string;
  categoryId: string;
  categoryName: string;
  jobTitle: string;
  areaLabel: string;
  startedAt: Date;
  completedAt: Date;
  verificationStatus: "verified";
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeLimit(limit: number | undefined) {
  return Number.isInteger(limit) && limit && limit > 0
    ? Math.min(limit, MAX_LIMIT)
    : DEFAULT_LIMIT;
}

function invalidCursor(): never {
  throw new ApplicationError(
    "VALIDATION_FAILED",
    "Invalid Passport pagination cursor.",
    { cursor: ["The pagination cursor is malformed."] },
  );
}

function decodeCursor(value: string | undefined) {
  if (!value) return null;

  try {
    if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) invalidCursor();

    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) invalidCursor();

    const parsed: unknown = JSON.parse(decoded.toString("utf8"));
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 2 ||
      typeof parsed[0] !== "string" ||
      typeof parsed[1] !== "string" ||
      !UUID_PATTERN.test(parsed[1])
    ) {
      invalidCursor();
    }

    const completedAt = new Date(parsed[0]);
    if (
      Number.isNaN(completedAt.getTime()) ||
      completedAt.toISOString() !== parsed[0]
    ) {
      invalidCursor();
    }

    return { completedAt, id: parsed[1] };
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    invalidCursor();
  }
}

function encodeCursor(entry: WorkerPassportEntry) {
  return Buffer.from(
    JSON.stringify([entry.completedAt.toISOString(), entry.id]),
  ).toString("base64url");
}

export async function getMyPassport(
  input: WorkerPassportInput = {},
  context?: RequestContext,
  database: WorkerPassportDatabase = db,
) {
  const actor = assertRole(
    assertActiveUser(context ?? (await requireActiveUser())),
    "worker",
  );
  const limit = normalizeLimit(input.limit);
  const cursor = decodeCursor(input.cursor);
  const proofConditions = [
    eq(workProofs.workerId, actor.userId),
    eq(workProofs.verificationStatus, "verified"),
    isNull(workProofs.revokedAt),
  ];

  const [summaryRows, proofRows] = await Promise.all([
    database
      .select({
        completedJobs: sql<number>`count(*)::int`,
        verifiedCategoryCount:
          sql<number>`count(distinct ${workProofs.categoryId})::int`,
      })
      .from(workProofs)
      .where(and(...proofConditions)),
    database
      .select({
        id: workProofs.id,
        categoryId: workProofs.categoryId,
        categoryName: categories.name,
        jobTitle: workProofs.jobTitleSnapshot,
        areaLabel: workProofs.areaLabelSnapshot,
        startedAt: workProofs.startedAt,
        completedAt: workProofs.completedAt,
        verificationStatus: workProofs.verificationStatus,
      })
      .from(workProofs)
      .innerJoin(categories, eq(workProofs.categoryId, categories.id))
      .where(
        and(
          ...proofConditions,
          cursor
            ? or(
                lt(workProofs.completedAt, cursor.completedAt),
                and(
                  eq(workProofs.completedAt, cursor.completedAt),
                  lt(workProofs.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(workProofs.completedAt), desc(workProofs.id))
      .limit(limit + 1),
  ]);

  const entries = proofRows.slice(0, limit).map((entry) => ({
    ...entry,
    verificationStatus: "verified" as const,
  }));

  return {
    summary: summaryRows[0] ?? {
      completedJobs: 0,
      verifiedCategoryCount: 0,
    },
    entries,
    nextCursor:
      proofRows.length > limit ? encodeCursor(entries.at(-1)!) : null,
  };
}
