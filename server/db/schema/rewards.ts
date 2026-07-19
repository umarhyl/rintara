import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { boostStatusEnum, creditStatusEnum } from "./enums";
import { users } from "./identity";
import { jobs } from "./jobs";

export const opportunityCredits = pgTable(
  "opportunity_credits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    sourceJobId: uuid("source_job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    status: creditStatusEnum("status").notNull().default("earned"),
    earnedAt: timestamp("earned_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true, mode: "date" }),
    targetJobId: uuid("target_job_id").references(() => jobs.id, {
      onDelete: "restrict",
    }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    revokedBy: uuid("revoked_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    revocationReason: varchar("revocation_reason", { length: 1000 }),
  },
  (table) => [
    uniqueIndex("opportunity_credits_source_job_unique").on(table.sourceJobId),
    index("opportunity_credits_employer_status_expiry_idx").on(
      table.employerId,
      table.status,
      table.expiresAt,
    ),
    check(
      "opportunity_credits_expiry_after_earned_check",
      sql`${table.expiresAt} IS NULL OR ${table.expiresAt} > ${table.earnedAt}`,
    ),
    check(
      "opportunity_credits_redemption_metadata_check",
      sql`
        (${table.status} IN ('earned', 'expired') AND ${table.redeemedAt} IS NULL AND ${table.targetJobId} IS NULL)
        OR (${table.status} = 'redeemed' AND ${table.redeemedAt} IS NOT NULL AND ${table.targetJobId} IS NOT NULL)
        OR (${table.status} = 'revoked' AND ((${table.redeemedAt} IS NULL AND ${table.targetJobId} IS NULL) OR (${table.redeemedAt} IS NOT NULL AND ${table.targetJobId} IS NOT NULL)))
      `,
    ),
    check(
      "opportunity_credits_revocation_metadata_check",
      sql`(${table.status} = 'revoked' AND ${table.revokedAt} IS NOT NULL AND ${table.revokedBy} IS NOT NULL AND ${table.revocationReason} IS NOT NULL) OR (${table.status} <> 'revoked' AND ${table.revokedAt} IS NULL AND ${table.revokedBy} IS NULL AND ${table.revocationReason} IS NULL)`,
    ),
  ],
);

export const jobBoosts = pgTable(
  "job_boosts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creditId: uuid("credit_id")
      .notNull()
      .references(() => opportunityCredits.id, { onDelete: "restrict" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),
    status: boostStatusEnum("status").notNull().default("active"),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("job_boosts_credit_unique").on(table.creditId),
    index("job_boosts_job_status_window_idx").on(
      table.jobId,
      table.status,
      table.startsAt,
      table.endsAt,
    ),
    check(
      "job_boosts_exact_duration_check",
      sql`${table.endsAt} = ${table.startsAt} + INTERVAL '24 hours'`,
    ),
    check(
      "job_boosts_revocation_metadata_check",
      sql`(${table.status} = 'revoked' AND ${table.revokedAt} IS NOT NULL) OR (${table.status} <> 'revoked' AND ${table.revokedAt} IS NULL)`,
    ),
  ],
);
