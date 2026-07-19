import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { reportReasonEnum, reportStatusEnum } from "./enums";
import { users } from "./identity";
import { jobs } from "./jobs";
import { agreements } from "./work";

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: reportReasonEnum("reason").notNull(),
    description: varchar("description", { length: 2000 }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "restrict" }),
    agreementId: uuid("agreement_id").references(() => agreements.id, {
      onDelete: "restrict",
    }),
    reportedUserId: uuid("reported_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    status: reportStatusEnum("status").notNull().default("open"),
    moderatorId: uuid("moderator_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    moderatorNote: varchar("moderator_note", { length: 2000 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    index("reports_status_created_idx").on(table.status, table.createdAt),
    index("reports_job_status_idx").on(table.jobId, table.status),
    index("reports_agreement_status_idx").on(table.agreementId, table.status),
    check(
      "reports_has_target_check",
      sql`${table.jobId} IS NOT NULL OR ${table.agreementId} IS NOT NULL OR ${table.reportedUserId} IS NOT NULL`,
    ),
    check(
      "reports_resolution_metadata_check",
      sql`
        (${table.status} = 'open' AND ${table.moderatorId} IS NULL AND ${table.moderatorNote} IS NULL AND ${table.resolvedAt} IS NULL)
        OR (${table.status} = 'reviewing' AND ${table.moderatorId} IS NOT NULL AND ${table.resolvedAt} IS NULL)
        OR (${table.status} IN ('resolved', 'rejected') AND ${table.resolvedAt} IS NOT NULL AND ${table.moderatorId} IS NOT NULL AND ${table.moderatorNote} IS NOT NULL)
      `,
    ),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    type: varchar("type", { length: 80 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    body: varchar("body", { length: 500 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }),
    entityId: uuid("entity_id"),
    readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_recipient_unread_created_idx").on(
      table.recipientId,
      table.readAt,
      table.createdAt.desc(),
    ),
    check(
      "notifications_entity_pair_check",
      sql`(${table.entityType} IS NULL AND ${table.entityId} IS NULL) OR (${table.entityType} IS NOT NULL AND ${table.entityId} IS NOT NULL)`,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    requestId: varchar("request_id", { length: 128 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_entity_created_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt.desc(),
    ),
    index("audit_logs_actor_created_idx").on(table.actorId, table.createdAt.desc()),
  ],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    operation: varchar("operation", { length: 100 }).notNull(),
    key: varchar("key", { length: 255 }).notNull(),
    requestHash: varchar("request_hash", { length: 128 }).notNull(),
    responsePayload: jsonb("response_payload").$type<Record<string, unknown>>(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("idempotency_keys_actor_operation_key_unique").on(
      table.actorId,
      table.operation,
      table.key,
    ),
    index("idempotency_keys_expiry_idx").on(table.expiresAt),
    check(
      "idempotency_keys_completion_payload_check",
      sql`(${table.completedAt} IS NULL AND ${table.responsePayload} IS NULL) OR (${table.completedAt} IS NOT NULL AND ${table.responsePayload} IS NOT NULL)`,
    ),
  ],
);
