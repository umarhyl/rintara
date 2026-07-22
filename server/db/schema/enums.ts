import { pgEnum } from "drizzle-orm/pg-core";
import {
  APPLICATION_STATUSES,
  JOB_STATUSES,
  MINI_AGREEMENT_STATUSES,
  OPPORTUNITY_CREDIT_STATUSES,
  REPORT_STATUSES,
  WORK_SESSION_STATUSES,
} from "@/server/domain/lifecycle";

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

export const jobStatusEnum = pgEnum("job_status", JOB_STATUSES);

export const jobVisibilityEnum = pgEnum("job_visibility", [
  "visible",
  "hidden",
]);

export const applicationStatusEnum = pgEnum(
  "application_status",
  APPLICATION_STATUSES,
);

export const agreementStatusEnum = pgEnum(
  "agreement_status",
  MINI_AGREEMENT_STATUSES,
);

export const workSessionStatusEnum = pgEnum(
  "work_session_status",
  WORK_SESSION_STATUSES,
);

export const proofStatusEnum = pgEnum("proof_status", [
  "verified",
  "revoked",
]);

export const creditStatusEnum = pgEnum(
  "credit_status",
  OPPORTUNITY_CREDIT_STATUSES,
);

export const boostStatusEnum = pgEnum("boost_status", [
  "active",
  "ended",
  "revoked",
]);

export const reportStatusEnum = pgEnum("report_status", REPORT_STATUSES);

export const reportReasonEnum = pgEnum("report_reason", [
  "suspicious_job",
  "terms_mismatch",
  "absence",
  "unsafe_behavior",
  "spam",
  "other",
]);
