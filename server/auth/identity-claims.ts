import { ApplicationError } from "@/server/errors/application-error";

export function requireSubjectClaim(
  claims: Record<string, unknown> | null | undefined,
  hasProviderError: boolean,
): string {
  const subject = claims?.sub;

  if (hasProviderError || typeof subject !== "string" || subject.length === 0) {
    throw new ApplicationError(
      "UNAUTHENTICATED",
      "A valid sign-in session is required.",
    );
  }

  return subject;
}

