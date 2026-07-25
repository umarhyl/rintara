import "server-only";

import { and, eq, inArray, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  agreements,
  employerProfiles,
  jobs,
  reports,
  workProofs,
  workSessions,
  workerProfiles,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

type WorkSessionDatabase = PostgresJsDatabase<typeof schema>;

export type WorkView = {
  agreementId: string;
  jobId: string;
  title: string;
  workerDisplayName: string;
  employerDisplayName: string;
  snapshot: {
    taskScope: string;
    generalArea: string;
    fullAddress: string;
    startsAt: string;
    estimatedMinutes: number;
    wageAmount: string;
    wageUnit: "hour" | "day" | "job";
    paymentMethod: string;
    paymentTiming: string;
  };
  agreementStatus: "pending_confirmation" | "active" | "completed" | "cancelled";
  jobStatus:
    | "draft"
    | "published"
    | "filled"
    | "in_progress"
    | "completed"
    | "expired"
    | "cancelled";
  session: {
    id: string;
    status: "scheduled" | "checked_in" | "checked_out" | "verified";
    checkInCodeExpiresAt: string | null;
    checkInCodeUsedAt: string | null;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    completionNote: string | null;
    verifiedAt: string | null;
  };
  workProofId: string | null;
  hasActiveReport: boolean;
  allowedActions: {
    generateCheckInCode: boolean;
    checkIn: boolean;
    checkOut: boolean;
    verifyCompletion: boolean;
  };
};

export async function getWorkView(
  agreementId: string,
  context?: RequestContext,
  database: WorkSessionDatabase = db,
): Promise<WorkView> {
  const actor = assertActiveUser(context ?? (await requireActiveUser()));
  if (actor.role !== "worker" && actor.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only agreement parties can view work.");
  }

  const partyCondition =
    actor.role === "worker"
      ? eq(agreements.workerId, actor.userId)
      : eq(agreements.employerId, actor.userId);

  const [row] = await database
    .select({
      agreementId: agreements.id,
      jobId: agreements.jobId,
      workerId: agreements.workerId,
      employerId: agreements.employerId,
      termsSnapshot: agreements.termsSnapshot,
      agreementStatus: agreements.status,
      jobStatus: jobs.status,
      workerDisplayName: workerProfiles.displayName,
      employerDisplayName: employerProfiles.displayName,
      sessionId: workSessions.id,
      sessionStatus: workSessions.status,
      checkInCodeExpiresAt: workSessions.checkInCodeExpiresAt,
      checkInCodeUsedAt: workSessions.checkInCodeUsedAt,
      checkedInAt: workSessions.checkedInAt,
      checkedOutAt: workSessions.checkedOutAt,
      completionNote: workSessions.completionNote,
      verifiedAt: workSessions.verifiedAt,
      workProofId: workProofs.id,
    })
    .from(agreements)
    .innerJoin(jobs, eq(agreements.jobId, jobs.id))
    .innerJoin(workerProfiles, eq(agreements.workerId, workerProfiles.userId))
    .innerJoin(employerProfiles, eq(agreements.employerId, employerProfiles.userId))
    .innerJoin(workSessions, eq(workSessions.agreementId, agreements.id))
    .leftJoin(workProofs, eq(workProofs.agreementId, agreements.id))
    .where(and(eq(agreements.id, agreementId), partyCondition))
    .limit(1);

  if (!row) {
    throw new ApplicationError("NOT_FOUND", "The requested work session was not found.");
  }

  const [activeReport] = await database
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        inArray(reports.status, ["open", "reviewing"]),
        or(eq(reports.agreementId, row.agreementId), eq(reports.jobId, row.jobId)),
      ),
    )
    .limit(1);

  const isEmployer = actor.role === "employer";
  const isWorker = actor.role === "worker";
  const isActive = row.agreementStatus === "active";

  return {
    agreementId: row.agreementId,
    jobId: row.jobId,
    title: row.termsSnapshot.title,
    workerDisplayName: row.workerDisplayName,
    employerDisplayName: row.employerDisplayName,
    snapshot: {
      taskScope: row.termsSnapshot.taskScope,
      generalArea: row.termsSnapshot.generalArea,
      fullAddress: row.termsSnapshot.fullAddress,
      startsAt: row.termsSnapshot.startsAt,
      estimatedMinutes: row.termsSnapshot.estimatedMinutes,
      wageAmount: row.termsSnapshot.wageAmount,
      wageUnit: row.termsSnapshot.wageUnit,
      paymentMethod: row.termsSnapshot.paymentMethod,
      paymentTiming: row.termsSnapshot.paymentTiming,
    },
    agreementStatus: row.agreementStatus,
    jobStatus: row.jobStatus,
    session: {
      id: row.sessionId,
      status: row.sessionStatus,
      checkInCodeExpiresAt: row.checkInCodeExpiresAt?.toISOString() ?? null,
      checkInCodeUsedAt: row.checkInCodeUsedAt?.toISOString() ?? null,
      checkedInAt: row.checkedInAt?.toISOString() ?? null,
      checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
      completionNote: row.completionNote,
      verifiedAt: row.verifiedAt?.toISOString() ?? null,
    },
    workProofId: row.workProofId,
    hasActiveReport: Boolean(activeReport),
    allowedActions: {
      generateCheckInCode:
        isEmployer && isActive && row.sessionStatus === "scheduled",
      checkIn: isWorker && isActive && row.sessionStatus === "scheduled",
      checkOut: isWorker && isActive && row.sessionStatus === "checked_in",
      verifyCompletion:
        isEmployer &&
        isActive &&
        row.jobStatus === "in_progress" &&
        row.sessionStatus === "checked_out" &&
        !activeReport,
    },
  };
}
