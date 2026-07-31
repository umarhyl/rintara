import { z } from "zod";

import { ApplicationError } from "@/server/errors/application-error";

export const JOB_STATUSES = [
  "draft",
  "published",
  "filled",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
] as const;

export const APPLICATION_STATUSES = [
  "submitted",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export const MINI_AGREEMENT_STATUSES = [
  "pending_confirmation",
  "active",
  "completed",
  "cancelled",
] as const;

export const WORK_SESSION_STATUSES = [
  "scheduled",
  "checked_in",
  "checked_out",
  "verified",
] as const;

export const OPPORTUNITY_CREDIT_STATUSES = [
  "earned",
  "redeemed",
  "expired",
  "revoked",
] as const;

export const REPORT_STATUSES = [
  "open",
  "reviewing",
  "resolved",
  "rejected",
] as const;

export const jobStatusSchema = z.enum(JOB_STATUSES);
export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export const miniAgreementStatusSchema = z.enum(MINI_AGREEMENT_STATUSES);
export const workSessionStatusSchema = z.enum(WORK_SESSION_STATUSES);
export const opportunityCreditStatusSchema = z.enum(
  OPPORTUNITY_CREDIT_STATUSES,
);
export const reportStatusSchema = z.enum(REPORT_STATUSES);

export type JobStatus = z.infer<typeof jobStatusSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type MiniAgreementStatus = z.infer<typeof miniAgreementStatusSchema>;
export type WorkSessionStatus = z.infer<typeof workSessionStatusSchema>;
export type OpportunityCreditStatus = z.infer<
  typeof opportunityCreditStatusSchema
>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;

const jobTransitions = {
  draft: ["published", "cancelled"],
  published: ["filled", "expired", "cancelled"],
  filled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  expired: [],
  cancelled: [],
} satisfies Record<JobStatus, readonly JobStatus[]>;

const applicationTransitions = {
  submitted: ["accepted", "rejected", "withdrawn"],
  accepted: [],
  rejected: [],
  withdrawn: ["submitted"],
} satisfies Record<ApplicationStatus, readonly ApplicationStatus[]>;

const miniAgreementTransitions = {
  pending_confirmation: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
} satisfies Record<MiniAgreementStatus, readonly MiniAgreementStatus[]>;

const workSessionTransitions = {
  scheduled: ["checked_in"],
  checked_in: ["checked_out"],
  checked_out: ["verified"],
  verified: [],
} satisfies Record<WorkSessionStatus, readonly WorkSessionStatus[]>;

const opportunityCreditTransitions = {
  earned: ["redeemed", "expired", "revoked"],
  redeemed: ["revoked"],
  expired: [],
  revoked: [],
} satisfies Record<OpportunityCreditStatus, readonly OpportunityCreditStatus[]>;

const reportTransitions = {
  open: ["reviewing"],
  reviewing: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
} satisfies Record<ReportStatus, readonly ReportStatus[]>;

function assertTransition<Status extends string>(
  entity: string,
  schema: z.ZodType<Status>,
  allowed: Readonly<Record<Status, readonly Status[]>>,
  from: unknown,
  to: unknown,
): { from: Status; to: Status } {
  const parsedFrom = schema.safeParse(from);
  const parsedTo = schema.safeParse(to);

  if (!parsedFrom.success || !parsedTo.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      `Invalid ${entity} transition input.`,
    );
  }

  if (!allowed[parsedFrom.data].includes(parsedTo.data)) {
    throw new ApplicationError(
      "INVALID_STATE_TRANSITION",
      `Cannot transition ${entity} from ${parsedFrom.data} to ${parsedTo.data}.`,
    );
  }

  return { from: parsedFrom.data, to: parsedTo.data };
}

export function assertJobTransition(from: unknown, to: unknown) {
  return assertTransition("job", jobStatusSchema, jobTransitions, from, to);
}

export function assertApplicationTransition(from: unknown, to: unknown) {
  return assertTransition(
    "application",
    applicationStatusSchema,
    applicationTransitions,
    from,
    to,
  );
}

export function assertMiniAgreementTransition(from: unknown, to: unknown) {
  return assertTransition(
    "Mini Agreement",
    miniAgreementStatusSchema,
    miniAgreementTransitions,
    from,
    to,
  );
}

export function assertWorkSessionTransition(from: unknown, to: unknown) {
  return assertTransition(
    "work session",
    workSessionStatusSchema,
    workSessionTransitions,
    from,
    to,
  );
}

export function assertOpportunityCreditTransition(from: unknown, to: unknown) {
  return assertTransition(
    "Opportunity Credit",
    opportunityCreditStatusSchema,
    opportunityCreditTransitions,
    from,
    to,
  );
}

export function assertReportTransition(from: unknown, to: unknown) {
  return assertTransition(
    "report",
    reportStatusSchema,
    reportTransitions,
    from,
    to,
  );
}
