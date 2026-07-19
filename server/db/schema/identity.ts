import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  bigint,
} from "drizzle-orm/pg-core";
import {
  accountStatusEnum,
  areaLevelEnum,
  employerTypeEnum,
  riskLevelEnum,
  userRoleEnum,
  wageUnitEnum,
} from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authSubject: varchar("auth_subject", { length: 128 }).notNull(),
    role: userRoleEnum("role").notNull(),
    status: accountStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    uniqueIndex("users_auth_subject_unique").on(table.authSubject),
    check(
      "users_deleted_at_matches_status_check",
      sql`(${table.status} = 'deleted' AND ${table.deletedAt} IS NOT NULL) OR (${table.status} <> 'deleted' AND ${table.deletedAt} IS NULL)`,
    ),
  ],
);

export const areas = pgTable(
  "areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id"),
    level: areaLevelEnum("level").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("areas_code_unique").on(table.code),
    index("areas_parent_level_idx").on(table.parentId, table.level),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "areas_parent_id_fkey",
    }).onDelete("restrict"),
    check("areas_not_own_parent_check", sql`${table.parentId} IS DISTINCT FROM ${table.id}`),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    riskLevel: riskLevelEnum("risk_level").notNull(),
    firstOpportunityAllowed: boolean("first_opportunity_allowed")
      .notNull()
      .default(false),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("categories_slug_unique").on(table.slug),
    check(
      "categories_first_opportunity_requires_low_risk_check",
      sql`NOT ${table.firstOpportunityAllowed} OR ${table.riskLevel} = 'low'`,
    ),
  ],
);

export const workerProfiles = pgTable(
  "worker_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "restrict" }),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),
    bio: varchar("bio", { length: 1000 }),
    availabilityNote: varchar("availability_note", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("worker_profiles_area_idx").on(table.areaId)],
);

export const employerProfiles = pgTable(
  "employer_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "restrict" }),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    employerType: employerTypeEnum("employer_type").notNull(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),
    description: varchar("description", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("employer_profiles_area_idx").on(table.areaId)],
);

export const workerInterests = pgTable(
  "worker_interests",
  {
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workerProfiles.userId, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({
      columns: [table.workerId, table.categoryId],
      name: "worker_interests_pk",
    }),
    index("worker_interests_category_idx").on(table.categoryId),
  ],
);

export const wageGuidelines = pgTable(
  "wage_guidelines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    unit: wageUnitEnum("unit").notNull(),
    minimumAmount: bigint("minimum_amount", { mode: "bigint" }).notNull(),
    recommendedAmount: bigint("recommended_amount", {
      mode: "bigint",
    }).notNull(),
    sourceLabel: varchar("source_label", { length: 255 }).notNull(),
    sourceUrl: varchar("source_url", { length: 2048 }),
    isSimulated: boolean("is_simulated").notNull().default(false),
    effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
    effectiveTo: date("effective_to", { mode: "string" }),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("wage_guidelines_lookup_idx").on(
      table.areaId,
      table.categoryId,
      table.unit,
      table.isActive,
      table.effectiveFrom,
      table.effectiveTo,
    ),
    check(
      "wage_guidelines_minimum_positive_check",
      sql`${table.minimumAmount} > 0`,
    ),
    check(
      "wage_guidelines_recommended_range_check",
      sql`${table.recommendedAmount} >= ${table.minimumAmount}`,
    ),
    check(
      "wage_guidelines_effective_range_check",
      sql`${table.effectiveTo} IS NULL OR ${table.effectiveTo} > ${table.effectiveFrom}`,
    ),
  ],
);
