import "server-only";

import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { agreements, employerProfiles, workerProfiles } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

type AgreementDatabase = PostgresJsDatabase<typeof schema>;

const agreementIdSchema = z.string().uuid();

export type AgreementView = {
  id: string;
  applicationId: string;
  snapshot: {
    version: number;
    jobId: string;
    workerId: string;
    employerId: string;
    title: string;
    categoryId: string;
    categoryName: string;
    taskScope: string;
    generalArea: string;
    fullAddress: string;
    arrivalInstructions: string | null;
    startsAt: string;
    estimatedMinutes: number;
    wageAmount: string;
    wageUnit: "hour" | "day" | "job";
    paymentMethod: string;
    paymentTiming: string;
    toolsProvided: string | null;
    toolsRequired: string | null;
    cancellationWording: string;
    isFirstOpportunity: boolean;
    wageStatus: "compliant" | "below" | "unavailable";
  };
  parties: {
    workerDisplayName: string;
    employerDisplayName: string;
  };
  confirmations: {
    workerConfirmedAt: string | null;
    employerConfirmedAt: string | null;
  };
  status: "pending_confirmation" | "active" | "completed" | "cancelled";
  cancellation: {
    cancelledAt: string;
    reason: string;
  } | null;
  allowedActions: {
    confirm: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

function parseAgreementId(input: unknown): string {
  const parsed = agreementIdSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "The agreement identifier is invalid.",
      { agreementId: ["Use a valid agreement identifier."] },
    );
  }

  return parsed.data;
}

export async function getAgreement(
  agreementIdInput: unknown,
  context?: RequestContext,
  database: AgreementDatabase = db,
): Promise<AgreementView> {
  const agreementId = parseAgreementId(agreementIdInput);
  const actor = assertActiveUser(context ?? (await requireActiveUser()));
  const partyCondition =
    actor.role === "worker"
      ? eq(agreements.workerId, actor.userId)
      : actor.role === "employer"
        ? eq(agreements.employerId, actor.userId)
        : undefined;

  const [agreement] = await database
    .select({
      id: agreements.id,
      applicationId: agreements.applicationId,
      jobId: agreements.jobId,
      workerId: agreements.workerId,
      employerId: agreements.employerId,
      termsSnapshot: agreements.termsSnapshot,
      snapshotVersion: agreements.snapshotVersion,
      isFirstOpportunity: agreements.isFirstOpportunity,
      wageStatus: agreements.wageStatus,
      workerConfirmedAt: agreements.workerConfirmedAt,
      employerConfirmedAt: agreements.employerConfirmedAt,
      status: agreements.status,
      cancelledAt: agreements.cancelledAt,
      cancellationReason: agreements.cancellationReason,
      createdAt: agreements.createdAt,
      updatedAt: agreements.updatedAt,
    })
    .from(agreements)
    .where(and(eq(agreements.id, agreementId), partyCondition))
    .limit(1);

  if (!agreement) {
    throw new ApplicationError(
      "NOT_FOUND",
      "The requested agreement was not found.",
    );
  }

  const [[workerProfile], [employerProfile]] = await Promise.all([
    database
      .select({ displayName: workerProfiles.displayName })
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, agreement.workerId))
      .limit(1),
    database
      .select({ displayName: employerProfiles.displayName })
      .from(employerProfiles)
      .where(eq(employerProfiles.userId, agreement.employerId))
      .limit(1),
  ]);

  const terms = agreement.termsSnapshot;
  const ownConfirmation =
    actor.role === "worker"
      ? agreement.workerConfirmedAt
      : actor.role === "employer"
        ? agreement.employerConfirmedAt
        : null;

  return {
    id: agreement.id,
    applicationId: agreement.applicationId,
    snapshot: {
      version: agreement.snapshotVersion,
      jobId: agreement.jobId,
      workerId: agreement.workerId,
      employerId: agreement.employerId,
      title: terms.title,
      categoryId: terms.categoryId,
      categoryName: terms.categoryName,
      taskScope: terms.taskScope,
      generalArea: terms.generalArea,
      fullAddress: terms.fullAddress,
      arrivalInstructions: terms.arrivalInstructions,
      startsAt: terms.startsAt,
      estimatedMinutes: terms.estimatedMinutes,
      wageAmount: terms.wageAmount,
      wageUnit: terms.wageUnit,
      paymentMethod: terms.paymentMethod,
      paymentTiming: terms.paymentTiming,
      toolsProvided: terms.toolsProvided,
      toolsRequired: terms.toolsRequired,
      cancellationWording: terms.cancellationWording,
      isFirstOpportunity: agreement.isFirstOpportunity,
      wageStatus: agreement.wageStatus,
    },
    parties: {
      workerDisplayName: workerProfile?.displayName ?? "Pekerja",
      employerDisplayName: employerProfile?.displayName ?? "Pemberi kerja",
    },
    confirmations: {
      workerConfirmedAt: agreement.workerConfirmedAt?.toISOString() ?? null,
      employerConfirmedAt:
        agreement.employerConfirmedAt?.toISOString() ?? null,
    },
    status: agreement.status,
    cancellation:
      agreement.cancelledAt && agreement.cancellationReason
        ? {
            cancelledAt: agreement.cancelledAt.toISOString(),
            reason: agreement.cancellationReason,
          }
        : null,
    allowedActions: {
      confirm:
        agreement.status === "pending_confirmation" &&
        actor.role !== "admin" &&
        ownConfirmation === null,
    },
    createdAt: agreement.createdAt.toISOString(),
    updatedAt: agreement.updatedAt.toISOString(),
  };
}
