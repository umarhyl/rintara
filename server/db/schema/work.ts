import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  agreementStatusEnum,
  proofStatusEnum,
  wageStatusEnum,
  wageUnitEnum,
  workSessionStatusEnum,
} from "./enums";
import { categories, users } from "./identity";
import { applications, jobs } from "./jobs";

export type AgreementTermsSnapshot = {
  title: string;
  categoryId: string;
  categoryName: string;
  taskScope: string;
  generalArea: string;
  fullAddress: string;
  arrivalInstructions: string | null;
  startsAt: string;
  estimatedMinutes: number;
  wageAmount: string;
  wageUnit: "hour" | "day" | "job";
  paymentMethod: string;
  paymentTiming: string;
  toolsProvided: string | null;
  toolsRequired: string | null;
  cancellationWording: string;
};

export const agreements = pgTable(
  "agreements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "restrict" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    termsSnapshot: jsonb("terms_snapshot").$type<AgreementTermsSnapshot>().notNull(),
    snapshotVersion: smallint("snapshot_version").notNull().default(1),
    isFirstOpportunity: boolean("is_first_opportunity").notNull(),
    wageStatus: wageStatusEnum("wage_status").notNull(),
    workerConfirmedAt: timestamp("worker_confirmed_at", {
      withTimezone: true,
      mode: "date",
    }),
    employerConfirmedAt: timestamp("employer_confirmed_at", {
      withTimezone: true,
      mode: "date",
    }),
    status: agreementStatusEnum("status")
      .notNull()
      .default("pending_confirmation"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
    cancellationReason: varchar("cancellation_reason", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("agreements_application_unique").on(table.applicationId),
    uniqueIndex("agreements_job_unique").on(table.jobId),
    index("agreements_worker_status_idx").on(table.workerId, table.status),
    index("agreements_employer_status_idx").on(table.employerId, table.status),
    check("agreements_snapshot_version_positive_check", sql`${table.snapshotVersion} > 0`),
    check("agreements_distinct_parties_check", sql`${table.workerId} <> ${table.employerId}`),
    check(
      "agreements_confirmation_state_check",
      sql`
        (${table.status} = 'pending_confirmation' AND (${table.workerConfirmedAt} IS NULL OR ${table.employerConfirmedAt} IS NULL))
        OR (${table.status} IN ('active', 'completed') AND ${table.workerConfirmedAt} IS NOT NULL AND ${table.employerConfirmedAt} IS NOT NULL)
        OR (${table.status} = 'cancelled')
      `,
    ),
    check(
      "agreements_cancellation_metadata_check",
      sql`(${table.status} = 'cancelled' AND ${table.cancelledAt} IS NOT NULL AND ${table.cancellationReason} IS NOT NULL) OR (${table.status} <> 'cancelled' AND ${table.cancelledAt} IS NULL AND ${table.cancellationReason} IS NULL)`,
    ),
  ],
);

export const workSessions = pgTable(
  "work_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agreementId: uuid("agreement_id")
      .notNull()
      .references(() => agreements.id, { onDelete: "restrict" }),
    status: workSessionStatusEnum("status").notNull().default("scheduled"),
    checkInCodeHash: varchar("check_in_code_hash", { length: 255 }),
    checkInCodeExpiresAt: timestamp("check_in_code_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    checkInFailedAttempts: smallint("check_in_failed_attempts").notNull().default(0),
    checkInCodeUsedAt: timestamp("check_in_code_used_at", {
      withTimezone: true,
      mode: "date",
    }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true, mode: "date" }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true, mode: "date" }),
    completionNote: varchar("completion_note", { length: 1000 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }),
    verifiedBy: uuid("verified_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("work_sessions_agreement_unique").on(table.agreementId),
    check(
      "work_sessions_failed_attempts_range_check",
      sql`${table.checkInFailedAttempts} BETWEEN 0 AND 5`,
    ),
    check(
      "work_sessions_code_metadata_check",
      sql`(${table.checkInCodeHash} IS NULL AND ${table.checkInCodeExpiresAt} IS NULL) OR (${table.checkInCodeHash} IS NOT NULL AND ${table.checkInCodeExpiresAt} IS NOT NULL)`,
    ),
    check(
      "work_sessions_lifecycle_timestamps_check",
      sql`
        (${table.status} = 'scheduled' AND ${table.checkedInAt} IS NULL AND ${table.checkedOutAt} IS NULL AND ${table.verifiedAt} IS NULL)
        OR (${table.status} = 'checked_in' AND ${table.checkedInAt} IS NOT NULL AND ${table.checkedOutAt} IS NULL AND ${table.verifiedAt} IS NULL)
        OR (${table.status} = 'checked_out' AND ${table.checkedInAt} IS NOT NULL AND ${table.checkedOutAt} IS NOT NULL AND ${table.verifiedAt} IS NULL)
        OR (${table.status} = 'verified' AND ${table.checkedInAt} IS NOT NULL AND ${table.checkedOutAt} IS NOT NULL AND ${table.verifiedAt} IS NOT NULL AND ${table.verifiedBy} IS NOT NULL)
      `,
    ),
  ],
);

export const workProofs = pgTable(
  "work_proofs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agreementId: uuid("agreement_id")
      .notNull()
      .references(() => agreements.id, { onDelete: "restrict" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    jobTitleSnapshot: varchar("job_title_snapshot", { length: 160 }).notNull(),
    areaLabelSnapshot: varchar("area_label_snapshot", { length: 200 }).notNull(),
    wageAmountSnapshot: bigint("wage_amount_snapshot", { mode: "bigint" }).notNull(),
    wageUnitSnapshot: wageUnitEnum("wage_unit_snapshot").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    verificationStatus: proofStatusEnum("verification_status")
      .notNull()
      .default("verified"),
    issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    revokedBy: uuid("revoked_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    revocationReason: varchar("revocation_reason", { length: 1000 }),
  },
  (table) => [
    uniqueIndex("work_proofs_agreement_unique").on(table.agreementId),
    index("work_proofs_worker_category_status_idx").on(
      table.workerId,
      table.categoryId,
      table.verificationStatus,
    ),
    check(
      "work_proofs_wage_positive_check",
      sql`${table.wageAmountSnapshot} > 0`,
    ),
    check(
      "work_proofs_time_range_check",
      sql`${table.completedAt} >= ${table.startedAt}`,
    ),
    check(
      "work_proofs_revocation_metadata_check",
      sql`(${table.verificationStatus} = 'verified' AND ${table.revokedAt} IS NULL AND ${table.revokedBy} IS NULL AND ${table.revocationReason} IS NULL) OR (${table.verificationStatus} = 'revoked' AND ${table.revokedAt} IS NOT NULL AND ${table.revokedBy} IS NOT NULL AND ${table.revocationReason} IS NOT NULL)`,
    ),
  ],
);
