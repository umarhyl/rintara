export type ApplicationErrorCode =
  | "UNAUTHENTICATED"
  | "ONBOARDING_REQUIRED"
  | "ACCOUNT_INACTIVE"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "INVALID_STATE_TRANSITION"
  | "INTERNAL_ERROR"
  | "JOB_NOT_FOUND"
  | "JOB_NOT_DRAFT"
  | "JOB_NOT_AVAILABLE"
  | "APPLICATION_ALREADY_EXISTS"
  | "APPLICATION_NOT_FOUND"
  | "APPLICATION_NOT_SUBMITTED"
  | "APPLICATION_NOT_WITHDRAWABLE"
  | "CONCURRENT_ACCEPTANCE_CONFLICT"
  | "FIRST_OPPORTUNITY_INELIGIBLE"
  | "CATEGORY_NOT_ALLOWED"
  | "WAGE_BELOW_GUIDELINE";

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;
  readonly details?: unknown;

  constructor(code: ApplicationErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
    this.details = details;
  }
}
