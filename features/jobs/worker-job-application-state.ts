export type WorkerJobApplicationState =
  | { state: "eligible"; isResubmission?: boolean }
  | {
      state: "existing";
      applicationStatus: "submitted" | "accepted" | "rejected" | "withdrawn";
      agreementId?: string;
    }
  | { state: "ineligible" }
  | { state: "unavailable" };

const applicationStatuses = new Set([
  "submitted",
  "accepted",
  "rejected",
  "withdrawn",
]);

export function parseWorkerJobApplicationState(
  value: unknown,
): WorkerJobApplicationState | null {
  if (typeof value !== "object" || value === null || !("state" in value)) {
    return null;
  }

  if (value.state === "eligible") {
    return {
      state: "eligible",
      ...("isResubmission" in value && value.isResubmission === true
        ? { isResubmission: true }
        : {}),
    };
  }

  if (value.state === "ineligible" || value.state === "unavailable") {
    return { state: value.state };
  }

  if (
    value.state !== "existing" ||
    !("applicationStatus" in value) ||
    typeof value.applicationStatus !== "string" ||
    !applicationStatuses.has(value.applicationStatus)
  ) {
    return null;
  }

  const agreementId =
    "agreementId" in value && typeof value.agreementId === "string"
      ? value.agreementId
      : undefined;

  return {
    state: "existing",
    applicationStatus: value.applicationStatus as
      | "submitted"
      | "accepted"
      | "rejected"
      | "withdrawn",
    ...(agreementId ? { agreementId } : {}),
  };
}
