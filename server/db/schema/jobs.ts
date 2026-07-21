import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  applicationStatusEnum,
  jobStatusEnum,
  jobVisibilityEnum,
  riskLevelEnum,
  wageStatusEnum,
  wageUnitEnum,
} from "./enums";
import {
  areas,
  categories,
  employerProfiles,
  users,
  workerProfiles,
} from "./identity";

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => employerProfiles.userId, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: varchar("description", { length: 4000 }).notNull(),
    taskScope: varchar("task_scope", { length: 4000 }).notNull(),
    publicLocationLabel: varchar("public_location_label", {
      length: 200,
    }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    wageAmount: bigint("wage_amount", { mode: "bigint" }).notNull(),
    wageUnit: wageUnitEnum("wage_unit").notNull(),
    wageStatus: wageStatusEnum("wage_status").notNull().default("unavailable"),
    paymentMethod: varchar("payment_method", { length: 160 }).notNull(),
    paymentTiming: varchar("payment_timing", { length: 160 }).notNull(),
    toolsProvided: varchar("tools_provided", { length: 2000 }),
    toolsRequired: varchar("tools_required", { length: 2000 }),
    riskLevel: riskLevelEnum("risk_level").notNull(),
    isFirstOpportunity: boolean("is_first_opportunity").notNull().default(false),
    applicationDeadline: timestamp("application_deadline", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    status: jobStatusEnum("status").notNull().default("draft"),
    visibility: jobVisibilityEnum("visibility").notNull().default("visible"),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
    hiddenAt: timestamp("hidden_at", { withTimezone: true, mode: "date" }),
    hiddenBy: uuid("hidden_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    hiddenReason: varchar("hidden_reason", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("jobs_public_discovery_idx").on(
      table.status,
      table.visibility,
      table.applicationDeadline,
      table.isFirstOpportunity,
      table.areaId,
      table.categoryId,
      table.publishedAt.desc(),
    ),
    index("jobs_employer_status_idx").on(
      table.employerId,
      table.status,
      table.createdAt.desc(),
    ),
    check("jobs_estimated_minutes_positive_check", sql`${table.estimatedMinutes} > 0`),
    check("jobs_wage_amount_positive_check", sql`${table.wageAmount} > 0`),
    check(
      "jobs_deadline_before_start_check",
      sql`${table.applicationDeadline} < ${table.startsAt}`,
    ),
    check(
      "jobs_first_opportunity_eligibility_check",
      sql`NOT ${table.isFirstOpportunity} OR ${table.status} IN ('draft', 'cancelled') OR (${table.riskLevel} = 'low' AND ${table.wageStatus} = 'compliant')`,
    ),
    check(
      "jobs_published_at_state_check",
      sql`${table.status} IN ('draft', 'cancelled') OR ${table.publishedAt} IS NOT NULL`,
    ),
    check(
      "jobs_completed_at_state_check",
      sql`(${table.status} = 'completed' AND ${table.completedAt} IS NOT NULL) OR (${table.status} <> 'completed' AND ${table.completedAt} IS NULL)`,
    ),
    check(
      "jobs_cancelled_at_state_check",
      sql`(${table.status} = 'cancelled' AND ${table.cancelledAt} IS NOT NULL) OR (${table.status} <> 'cancelled' AND ${table.cancelledAt} IS NULL)`,
    ),
    check(
      "jobs_hidden_metadata_check",
      sql`(${table.visibility} = 'visible' AND ${table.hiddenAt} IS NULL AND ${table.hiddenBy} IS NULL AND ${table.hiddenReason} IS NULL) OR (${table.visibility} = 'hidden' AND ${table.hiddenAt} IS NOT NULL AND ${table.hiddenBy} IS NOT NULL AND ${table.hiddenReason} IS NOT NULL)`,
    ),
  ],
);

export const jobPrivateDetails = pgTable("job_private_details", {
  jobId: uuid("job_id")
    .primaryKey()
    .references(() => jobs.id, { onDelete: "restrict" }),
  fullAddress: varchar("full_address", { length: 1000 }).notNull(),
  arrivalInstructions: varchar("arrival_instructions", { length: 1000 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workerProfiles.userId, { onDelete: "restrict" }),
    note: varchar("note", { length: 1000 }).notNull(),
    firstOpportunityEligibleAtSubmission: boolean(
      "first_opportunity_eligible_at_submission",
    ).notNull(),
    status: applicationStatusEnum("status").notNull().default("submitted"),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    uniqueIndex("applications_job_worker_unique").on(table.jobId, table.workerId),
    uniqueIndex("applications_one_accepted_per_job")
      .on(table.jobId)
      .where(sql`${table.status} = 'accepted'`),
    index("applications_job_status_submitted_idx").on(
      table.jobId,
      table.status,
      table.submittedAt,
    ),
    index("applications_worker_status_submitted_idx").on(
      table.workerId,
      table.status,
      table.submittedAt.desc(),
    ),
    check(
      "applications_status_timestamps_check",
      sql`
        (${table.status} = 'submitted' AND ${table.decidedAt} IS NULL AND ${table.withdrawnAt} IS NULL)
        OR (${table.status} IN ('accepted', 'rejected') AND ${table.decidedAt} IS NOT NULL AND ${table.withdrawnAt} IS NULL)
        OR (${table.status} = 'withdrawn' AND ${table.decidedAt} IS NULL AND ${table.withdrawnAt} IS NOT NULL)
      `,
    ),
  ],
);
