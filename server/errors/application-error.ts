export type ApplicationErrorCode =
  | "UNAUTHENTICATED"
  | "ONBOARDING_REQUIRED"
  | "ACCOUNT_INACTIVE"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "INTERNAL_ERROR";

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;

  constructor(code: ApplicationErrorCode, message: string) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
  }
}
