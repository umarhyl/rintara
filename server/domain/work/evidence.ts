import "server-only";

import { revalidatePath } from "next/cache";
import { and, eq, gte, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import {
  agreements,
  auditLogs,
  workCompletionEvidence,
  workSessions,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
import {
  deleteWorkEvidenceObject,
  prepareWorkEvidence,
  uploadWorkEvidenceObject,
} from "@/server/infrastructure/storage/work-evidence";

const agreementIdSchema = z.string().uuid();

function parseAgreementId(input: unknown) {
  const parsed = agreementIdSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApplicationError(
      "VALIDATION_FAILED",
      "Invalid agreement identifier.",
    );
  }
  return parsed.data;
}

function mapEvidencePreparationError(error: unknown): ApplicationError {
  const reason = error instanceof Error ? error.message : "";

  if (reason === "WORK_EVIDENCE_TOO_LARGE") {
    return new ApplicationError(
      "WORK_EVIDENCE_INVALID",
      "Foto harus berukuran maksimal 5 MB.",
    );
  }

  if (
    reason === "UNSUPPORTED_WORK_EVIDENCE" ||
    reason === "INVALID_WORK_EVIDENCE"
  ) {
    return new ApplicationError(
      "WORK_EVIDENCE_INVALID",
      "Gunakan foto JPG, PNG, atau WebP yang valid.",
    );
  }

  return new ApplicationError(
    "INTERNAL_ERROR",
    "Foto belum dapat disimpan. Silakan coba lagi.",
  );
}

function revalidateWorkEvidence(agreementId: string) {
  revalidatePath(`/worker/work/${agreementId}`);
  revalidatePath(`/employer/work/${agreementId}`);
}

export type UploadWorkCompletionEvidenceResult = {
  agreementId: string;
  uploadedAt: string;
  byteSize: number;
};

export async function uploadWorkCompletionEvidence(input: {
  agreementId: unknown;
  file: File;
  privacyAttested: boolean;
}): Promise<UploadWorkCompletionEvidenceResult> {
  const agreementId = parseAgreementId(input.agreementId);
  const actor = await requireActiveUser();

  if (actor.role !== "worker") {
    throw new ApplicationError(
      "FORBIDDEN",
      "Only the accepted worker can upload completion evidence.",
    );
  }
  if (input.privacyAttested !== true) {
    throw new ApplicationError(
      "WORK_EVIDENCE_INVALID",
      "Konfirmasi izin dan privasi foto sebelum mengunggah.",
    );
  }

  const [eligible] = await db
    .select({ sessionId: workSessions.id })
    .from(agreements)
    .innerJoin(workSessions, eq(workSessions.agreementId, agreements.id))
    .where(
      and(
        eq(agreements.id, agreementId),
        eq(agreements.workerId, actor.userId),
        eq(agreements.status, "active"),
        eq(workSessions.status, "checked_in"),
      ),
    )
    .limit(1);

  if (!eligible) {
    throw new ApplicationError(
      "INVALID_STATE_TRANSITION",
      "Foto hanya dapat diunggah setelah check-in dan sebelum check-out.",
    );
  }

  const recentUploads = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.actorId, actor.userId),
        eq(auditLogs.entityId, agreementId),
        inArray(auditLogs.action, [
          "upload_work_completion_evidence",
          "replace_work_completion_evidence",
        ]),
        gte(auditLogs.createdAt, new Date(Date.now() - 60_000)),
      ),
    )
    .limit(5);
  if (recentUploads.length >= 5) {
    throw new ApplicationError(
      "RATE_LIMITED",
      "Terlalu banyak penggantian foto. Tunggu sebentar lalu coba lagi.",
    );
  }

  let prepared;
  try {
    prepared = await prepareWorkEvidence(input.file);
  } catch (error) {
    throw mapEvidencePreparationError(error);
  }

  let newPath: string;
  try {
    newPath = await uploadWorkEvidenceObject(agreementId, prepared);
  } catch {
    throw new ApplicationError(
      "INTERNAL_ERROR",
      "Foto belum dapat disimpan. Silakan coba lagi.",
    );
  }

  let previousPath: string | null = null;
  let result: UploadWorkCompletionEvidenceResult;

  try {
    result = await db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          agreementId: agreements.id,
          sessionId: workSessions.id,
          agreementStatus: agreements.status,
          sessionStatus: workSessions.status,
        })
        .from(agreements)
        .innerJoin(workSessions, eq(workSessions.agreementId, agreements.id))
        .where(
          and(
            eq(agreements.id, agreementId),
            eq(agreements.workerId, actor.userId),
          ),
        )
        .limit(1)
        .for("update");

      if (!row) {
        throw new ApplicationError(
          "NOT_FOUND",
          "The requested work session was not found.",
        );
      }
      if (
        row.agreementStatus !== "active" ||
        row.sessionStatus !== "checked_in"
      ) {
        throw new ApplicationError(
          "INVALID_STATE_TRANSITION",
          "Foto hanya dapat diganti sebelum check-out.",
        );
      }

      const [existing] = await tx
        .select({ storagePath: workCompletionEvidence.storagePath })
        .from(workCompletionEvidence)
        .where(eq(workCompletionEvidence.workSessionId, row.sessionId))
        .limit(1);
      previousPath = existing?.storagePath ?? null;

      const now = new Date();
      await tx
        .insert(workCompletionEvidence)
        .values({
          workSessionId: row.sessionId,
          storagePath: newPath,
          mimeType: prepared.mimeType,
          byteSize: prepared.byteSize,
          sha256: prepared.sha256,
          uploadedBy: actor.userId,
          uploadedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: workCompletionEvidence.workSessionId,
          set: {
            storagePath: newPath,
            mimeType: prepared.mimeType,
            byteSize: prepared.byteSize,
            sha256: prepared.sha256,
            uploadedBy: actor.userId,
            uploadedAt: now,
            updatedAt: now,
          },
        });

      await tx.insert(auditLogs).values({
        actorId: actor.userId,
        action: existing
          ? "replace_work_completion_evidence"
          : "upload_work_completion_evidence",
        entityType: "agreement",
        entityId: row.agreementId,
        requestId: actor.requestId,
        metadata: {
          mimeType: prepared.mimeType,
          byteSize: prepared.byteSize,
          sha256: prepared.sha256,
          privacyAttested: true,
        },
        createdAt: now,
      });

      return {
        agreementId: row.agreementId,
        uploadedAt: now.toISOString(),
        byteSize: prepared.byteSize,
      };
    });
  } catch (error) {
    await deleteWorkEvidenceObject(newPath).catch(() => undefined);
    throw error;
  }

  if (previousPath && previousPath !== newPath) {
    await deleteWorkEvidenceObject(previousPath).catch(() => undefined);
  }

  revalidateWorkEvidence(result.agreementId);
  return result;
}

export type AuthorizedWorkEvidence = {
  storagePath: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
};

export async function getAuthorizedWorkEvidence(
  agreementIdInput: unknown,
): Promise<AuthorizedWorkEvidence> {
  const agreementId = parseAgreementId(agreementIdInput);
  const actor = await requireActiveUser();

  const relationship =
    actor.role === "admin"
      ? eq(agreements.id, agreementId)
      : and(
          eq(agreements.id, agreementId),
          or(
            eq(agreements.workerId, actor.userId),
            eq(agreements.employerId, actor.userId),
          ),
        );

  const [row] = await db
    .select({
      storagePath: workCompletionEvidence.storagePath,
      mimeType: workCompletionEvidence.mimeType,
      byteSize: workCompletionEvidence.byteSize,
      sha256: workCompletionEvidence.sha256,
    })
    .from(agreements)
    .innerJoin(workSessions, eq(workSessions.agreementId, agreements.id))
    .innerJoin(
      workCompletionEvidence,
      eq(workCompletionEvidence.workSessionId, workSessions.id),
    )
    .where(relationship)
    .limit(1);

  if (!row) {
    throw new ApplicationError(
      "NOT_FOUND",
      "The requested work evidence was not found.",
    );
  }

  return row;
}
