import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "worker",
  "employer",
  "admin",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "suspended",
  "deleted",
]);

export const employerTypeEnum = pgEnum("employer_type", [
  "individual",
  "business",
  "community",
]);

export const areaLevelEnum = pgEnum("area_level", [
  "province",
  "city_regency",
  "district",
]);

export const riskLevelEnum = pgEnum("risk_level", ["low", "restricted"]);

export const wageUnitEnum = pgEnum("wage_unit", ["hour", "day", "job"]);

export const wageStatusEnum = pgEnum("wage_status", [
  "compliant",
  "below",
  "unavailable",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "draft",
  "published",
  "filled",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
]);

export const jobVisibilityEnum = pgEnum("job_visibility", [
  "visible",
  "hidden",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "submitted",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const agreementStatusEnum = pgEnum("agreement_status", [
  "pending_confirmation",
  "active",
  "completed",
  "cancelled",
]);

export const workSessionStatusEnum = pgEnum("work_session_status", [
  "scheduled",
  "checked_in",
  "checked_out",
  "verified",
]);

export const proofStatusEnum = pgEnum("proof_status", [
  "verified",
  "revoked",
]);

export const creditStatusEnum = pgEnum("credit_status", [
  "earned",
  "redeemed",
  "expired",
  "revoked",
]);

export const boostStatusEnum = pgEnum("boost_status", [
  "active",
  "ended",
  "revoked",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "reviewing",
  "resolved",
  "rejected",
]);

export const reportReasonEnum = pgEnum("report_reason", [
  "suspicious_job",
  "terms_mismatch",
  "absence",
  "unsafe_behavior",
  "spam",
  "other",
]);
