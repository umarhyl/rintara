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
