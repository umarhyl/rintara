"use server";

import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { db } from "@/server/db/client";
import {
  agreements,
  auditLogs,
  jobs,
  notifications,
  opportunityCredits,
  reports,
  users,
  workCompletionEvidence,
  workProofs,
  workSessions,
} from "@/server/db/schema";
import {
  assertJobTransition,
  assertMiniAgreementTransition,
  assertWorkSessionTransition,
} from "@/server/domain/lifecycle";
import { ApplicationError } from "@/server/errors/application-error";

const agreementIdSchema = z.string().uuid();
const checkInSchema = z
  .object({
    agreementId: z.string().uuid(),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();
const checkOutSchema = z
  .object({
    agreementId: z.string().uuid(),
    completionNote: z.string().trim().max(1000).optional(),
  })
  .strict();

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export type GenerateCheckInCodeResult = {
  agreementId: string;
  code: string;
  expiresAt: string;
};

export type CheckInResult = {
  agreementId: string;
  status: "checked_in";
  checkedInAt: string;
};

export type CheckOutResult = {
  agreementId: string;
  status: "checked_out";
  checkedOutAt: string;
};

export type VerifyCompletionResult = {
  jobId: string;
  agreementId: string;
  workProofId: string;
  credit: {
    issued: boolean;
    creditId?: string;
    skippedReason?: "NOT_FIRST_OPPORTUNITY" | "ACTIVE_CREDIT_CAP_REACHED";
  };
};

function parseAgreementId(input: unknown) {
  const parsed = agreementIdSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApplicationError("VALIDATION_FAILED", "Invalid agreement identifier.");
  }

  return parsed.data;
}

function makeCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function getCheckInCodePepper() {
  const pepper = process.env.CHECK_IN_CODE_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error(
      "CHECK_IN_CODE_PEPPER must be configured with at least 32 characters.",
    );
  }

  return pepper;
}

function hashCode(code: string) {
  const salt = randomBytes(16).toString("base64url");
  const digest = scryptSync(`${getCheckInCodePepper()}:${code}`, salt, 32).toString(
    "base64url",
  );
  return `scrypt:${salt}:${digest}`;
}

function verifyCode(code: string, storedHash: string | null) {
  if (!storedHash) return false;

  const [algorithm, salt, digest] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !digest) return false;

  const actual = Buffer.from(
    scryptSync(`${getCheckInCodePepper()}:${code}`, salt, 32).toString(
      "base64url",
    ),
  );
  const expected = Buffer.from(digest);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function revalidateWork(agreementId: string) {
  revalidatePath(`/worker/work/${agreementId}`);
  revalidatePath(`/employer/work/${agreementId}`);
  revalidatePath(`/worker/agreements/${agreementId}`);
  revalidatePath(`/employer/agreements/${agreementId}`);
  revalidatePath("/worker/passport");
}

async function readCreditOutcome(
  database: Pick<typeof db, "select">,
  sourceJobId: string,
  isFirstOpportunity: boolean,
): Promise<VerifyCompletionResult["credit"]> {
  const [credit] = await database
    .select({ id: opportunityCredits.id })
    .from(opportunityCredits)
    .where(eq(opportunityCredits.sourceJobId, sourceJobId))
    .limit(1);

  if (credit) {
    return { issued: true, creditId: credit.id };
  }

  return {
    issued: false,
    skippedReason: isFirstOpportunity
      ? "ACTIVE_CREDIT_CAP_REACHED"
      : "NOT_FIRST_OPPORTUNITY",
  };
}

export async function generateCheckInCode(
  agreementIdInput: unknown,
): Promise<GenerateCheckInCodeResult> {
  const agreementId = parseAgreementId(agreementIdInput);
  const actor = await requireActiveUser();
  if (actor.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only employers can generate check-in codes.");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);
  const code = makeCode();
  const codeHash = hashCode(code);

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        agreementId: agreements.id,
        employerId: agreements.employerId,
        workerId: agreements.workerId,
        agreementStatus: agreements.status,
        sessionId: workSessions.id,
        sessionStatus: workSessions.status,
      })
      .from(agreements)
      .innerJoin(workSessions, eq(workSessions.agreementId, agreements.id))
      .where(and(eq(agreements.id, agreementId), eq(agreements.employerId, actor.userId)))
      .limit(1)
      .for("update");

    if (!row) {
      throw new ApplicationError("NOT_FOUND", "The requested work session was not found.");
    }
    if (row.agreementStatus !== "active") {
      throw new ApplicationError("AGREEMENT_NOT_ACTIVE", "Agreement is not active.");
    }
    if (row.sessionStatus !== "scheduled") {
      throw new ApplicationError("INVALID_STATE_TRANSITION", "Check-in code is unavailable for this session state.");
    }

    await tx
      .update(workSessions)
      .set({
        checkInCodeHash: codeHash,
        checkInCodeExpiresAt: expiresAt,
        checkInFailedAttempts: 0,
        checkInCodeUsedAt: null,
        updatedAt: now,
      })
      .where(eq(workSessions.id, row.sessionId));

    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "generate_check_in_code",
      entityType: "agreement",
      entityId: row.agreementId,
      requestId: actor.requestId,
      metadata: { expiresAt: expiresAt.toISOString() },
      createdAt: now,
    });

    return { agreementId: row.agreementId, expiresAt };
  });

  revalidateWork(result.agreementId);

  return {
    agreementId: result.agreementId,
    code,
    expiresAt: result.expiresAt.toISOString(),
  };
}

export async function checkIn(input: unknown): Promise<CheckInResult> {
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApplicationError("VALIDATION_FAILED", "Invalid check-in input.");
  }

  const actor = await requireActiveUser();
  if (actor.role !== "worker") {
    throw new ApplicationError("FORBIDDEN", "Only workers can check in.");
  }

  const now = new Date();

  const outcome = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        agreementId: agreements.id,
        jobId: agreements.jobId,
        employerId: agreements.employerId,
        workerId: agreements.workerId,
        agreementStatus: agreements.status,
        jobStatus: jobs.status,
        sessionId: workSessions.id,
        sessionStatus: workSessions.status,
        checkInCodeHash: workSessions.checkInCodeHash,
        checkInCodeExpiresAt: workSessions.checkInCodeExpiresAt,
        checkInFailedAttempts: workSessions.checkInFailedAttempts,
        checkInCodeUsedAt: workSessions.checkInCodeUsedAt,
      })
      .from(agreements)
      .innerJoin(jobs, eq(agreements.jobId, jobs.id))
      .innerJoin(workSessions, eq(workSessions.agreementId, agreements.id))
      .where(
        and(
          eq(agreements.id, parsed.data.agreementId),
          eq(agreements.workerId, actor.userId),
        ),
      )
      .limit(1)
      .for("update");

    if (!row) {
      throw new ApplicationError("NOT_FOUND", "The requested work session was not found.");
    }
    if (row.agreementStatus !== "active") {
      throw new ApplicationError("AGREEMENT_NOT_ACTIVE", "Agreement is not active.");
    }
    if (row.sessionStatus !== "scheduled") {
      throw new ApplicationError("INVALID_STATE_TRANSITION", "Work session is not ready for check-in.");
    }
    if (row.checkInCodeUsedAt) {
      throw new ApplicationError("CODE_INVALID", "The check-in code cannot be used.");
    }
    if (row.checkInFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      throw new ApplicationError("CODE_LOCKED", "Too many failed check-in attempts.");
    }
    if (!row.checkInCodeExpiresAt || row.checkInCodeExpiresAt <= now) {
      throw new ApplicationError("CODE_EXPIRED", "The check-in code is expired.");
    }

    if (!verifyCode(parsed.data.code, row.checkInCodeHash)) {
      await tx
        .update(workSessions)
        .set({
          checkInFailedAttempts: row.checkInFailedAttempts + 1,
          updatedAt: now,
        })
        .where(eq(workSessions.id, row.sessionId));
      if (row.checkInFailedAttempts + 1 >= MAX_FAILED_ATTEMPTS) {
        return {
          ok: false as const,
          errorCode: "CODE_LOCKED" as const,
        };
      }

      return {
        ok: false as const,
        errorCode: "CODE_INVALID" as const,
      };
    }

    assertWorkSessionTransition(row.sessionStatus, "checked_in");
    assertJobTransition(row.jobStatus, "in_progress");

    const [session] = await tx
      .update(workSessions)
      .set({
        status: "checked_in",
        checkedInAt: now,
        checkInCodeUsedAt: now,
        updatedAt: now,
      })
      .where(eq(workSessions.id, row.sessionId))
      .returning({
        agreementId: workSessions.agreementId,
        checkedInAt: workSessions.checkedInAt,
      });

    await tx
      .update(jobs)
      .set({ status: "in_progress", updatedAt: now })
      .where(eq(jobs.id, row.jobId));

    await tx.insert(notifications).values({
      recipientId: row.employerId,
      type: "worker_checked_in",
      title: "Pekerja sudah check-in",
      body: "Pekerja telah menggunakan kode check-in untuk memulai sesi kerja.",
      entityType: "agreement",
      entityId: row.agreementId,
      createdAt: now,
    });

    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "check_in",
      entityType: "agreement",
      entityId: row.agreementId,
      requestId: actor.requestId,
      metadata: {},
      createdAt: now,
    });

    return { ok: true as const, session };
  });

  if (!outcome.ok) {
    throw new ApplicationError(
      outcome.errorCode,
      outcome.errorCode === "CODE_LOCKED"
        ? "Too many failed check-in attempts."
        : "The check-in code is invalid.",
    );
  }

  revalidateWork(outcome.session.agreementId);
  return {
    agreementId: outcome.session.agreementId,
    status: "checked_in",
    checkedInAt: outcome.session.checkedInAt!.toISOString(),
  };
}

export async function checkOut(input: unknown): Promise<CheckOutResult> {
  const parsed = checkOutSchema.safeParse(input);
  if (!parsed.success) {
    throw new ApplicationError("VALIDATION_FAILED", "Invalid check-out input.");
  }

  const actor = await requireActiveUser();
  if (actor.role !== "worker") {
    throw new ApplicationError("FORBIDDEN", "Only workers can check out.");
  }

  const now = new Date();
  const completionNote = parsed.data.completionNote?.trim() || null;

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        agreementId: agreements.id,
        employerId: agreements.employerId,
        agreementStatus: agreements.status,
        sessionId: workSessions.id,
        sessionStatus: workSessions.status,
      })
      .from(agreements)
      .innerJoin(workSessions, eq(workSessions.agreementId, agreements.id))
      .where(
        and(
          eq(agreements.id, parsed.data.agreementId),
          eq(agreements.workerId, actor.userId),
        ),
      )
      .limit(1)
      .for("update");

    if (!row) {
      throw new ApplicationError("NOT_FOUND", "The requested work session was not found.");
    }
    if (row.agreementStatus !== "active") {
      throw new ApplicationError("AGREEMENT_NOT_ACTIVE", "Agreement is not active.");
    }
    if (row.sessionStatus !== "checked_in") {
      throw new ApplicationError("INVALID_STATE_TRANSITION", "Work session is not ready for check-out.");
    }

    const [evidence] = await tx
      .select({ id: workCompletionEvidence.id })
      .from(workCompletionEvidence)
      .where(eq(workCompletionEvidence.workSessionId, row.sessionId))
      .limit(1);
    if (!evidence) {
      throw new ApplicationError(
        "WORK_EVIDENCE_REQUIRED",
        "Upload satu foto hasil pekerjaan sebelum check-out.",
      );
    }

    assertWorkSessionTransition(row.sessionStatus, "checked_out");

    const [session] = await tx
      .update(workSessions)
      .set({
        status: "checked_out",
        checkedOutAt: now,
        completionNote,
        updatedAt: now,
      })
      .where(eq(workSessions.id, row.sessionId))
      .returning({
        agreementId: workSessions.agreementId,
        checkedOutAt: workSessions.checkedOutAt,
      });

    await tx.insert(notifications).values({
      recipientId: row.employerId,
      type: "worker_checked_out",
      title: "Pekerja sudah check-out",
      body: "Pekerja menunggu verifikasi penyelesaian dari pemberi kerja.",
      entityType: "agreement",
      entityId: row.agreementId,
      createdAt: now,
    });

    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "check_out",
      entityType: "agreement",
      entityId: row.agreementId,
      requestId: actor.requestId,
      metadata: {},
      createdAt: now,
    });

    return session;
  });

  revalidateWork(result.agreementId);

  return {
    agreementId: result.agreementId,
    status: "checked_out",
    checkedOutAt: result.checkedOutAt!.toISOString(),
  };
}

export async function verifyCompletion(
  agreementIdInput: unknown,
): Promise<VerifyCompletionResult> {
  const agreementId = parseAgreementId(agreementIdInput);
  const actor = await requireActiveUser();
  if (actor.role !== "employer") {
    throw new ApplicationError("FORBIDDEN", "Only employers can verify completion.");
  }

  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        agreementId: agreements.id,
        jobId: agreements.jobId,
        workerId: agreements.workerId,
        employerId: agreements.employerId,
        agreementStatus: agreements.status,
        jobStatus: jobs.status,
        termsSnapshot: agreements.termsSnapshot,
        isFirstOpportunity: agreements.isFirstOpportunity,
        sessionId: workSessions.id,
        sessionStatus: workSessions.status,
        checkedInAt: workSessions.checkedInAt,
        checkedOutAt: workSessions.checkedOutAt,
      })
      .from(agreements)
      .innerJoin(jobs, eq(agreements.jobId, jobs.id))
      .innerJoin(workSessions, eq(workSessions.agreementId, agreements.id))
      .where(and(eq(agreements.id, agreementId), eq(agreements.employerId, actor.userId)))
      .limit(1)
      .for("update");

    if (!row) {
      throw new ApplicationError("NOT_FOUND", "The requested work session was not found.");
    }

    const [existingProof] = await tx
      .select({ id: workProofs.id })
      .from(workProofs)
      .where(eq(workProofs.agreementId, row.agreementId))
      .limit(1);

    if (
      existingProof &&
      row.agreementStatus === "completed" &&
      row.jobStatus === "completed" &&
      row.sessionStatus === "verified"
    ) {
      return {
        jobId: row.jobId,
        agreementId: row.agreementId,
        workProofId: existingProof.id,
        credit: await readCreditOutcome(tx, row.jobId, row.isFirstOpportunity),
      };
    }

    const [activeReport] = await tx
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          inArray(reports.status, ["open", "reviewing"]),
          or(eq(reports.agreementId, row.agreementId), eq(reports.jobId, row.jobId)),
        ),
      )
      .limit(1);
    if (activeReport) {
      throw new ApplicationError(
        "ACTIVE_REPORT_BLOCKS_COMPLETION",
        "An active report blocks completion.",
      );
    }

    if (
      row.agreementStatus !== "active" ||
      row.jobStatus !== "in_progress" ||
      row.sessionStatus !== "checked_out" ||
      !row.checkedInAt ||
      !row.checkedOutAt
    ) {
      throw new ApplicationError(
        "WORK_NOT_CHECKED_OUT",
        "Work must be checked out before completion can be verified.",
      );
    }

    assertWorkSessionTransition(row.sessionStatus, "verified");
    assertMiniAgreementTransition(row.agreementStatus, "completed");
    assertJobTransition(row.jobStatus, "completed");

    await tx
      .update(workSessions)
      .set({ status: "verified", verifiedAt: now, verifiedBy: actor.userId, updatedAt: now })
      .where(eq(workSessions.id, row.sessionId));
    await tx
      .update(agreements)
      .set({ status: "completed", updatedAt: now })
      .where(eq(agreements.id, row.agreementId));
    await tx
      .update(jobs)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(eq(jobs.id, row.jobId));

    const [proof] = await tx
      .insert(workProofs)
      .values({
        agreementId: row.agreementId,
        workerId: row.workerId,
        employerId: row.employerId,
        categoryId: row.termsSnapshot.categoryId,
        jobTitleSnapshot: row.termsSnapshot.title,
        areaLabelSnapshot: row.termsSnapshot.generalArea,
        wageAmountSnapshot: BigInt(row.termsSnapshot.wageAmount),
        wageUnitSnapshot: row.termsSnapshot.wageUnit,
        startedAt: row.checkedInAt,
        completedAt: row.checkedOutAt,
        issuedAt: now,
      })
      .returning({ id: workProofs.id });

    let credit: VerifyCompletionResult["credit"] = {
      issued: false,
      skippedReason: "NOT_FIRST_OPPORTUNITY",
    };

    if (row.isFirstOpportunity) {
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, row.employerId))
        .limit(1)
        .for("update");

      const [{ activeCreditCount }] = await tx
        .select({
          activeCreditCount: sql<number>`count(*)::int`,
        })
        .from(opportunityCredits)
        .where(
          and(
            eq(opportunityCredits.employerId, row.employerId),
            eq(opportunityCredits.status, "earned"),
            or(
              isNull(opportunityCredits.expiresAt),
              gt(opportunityCredits.expiresAt, now),
            ),
          ),
        );

      if (activeCreditCount >= 3) {
        credit = {
          issued: false,
          skippedReason: "ACTIVE_CREDIT_CAP_REACHED",
        };
      } else {
        const [issuedCredit] = await tx
          .insert(opportunityCredits)
          .values({
            employerId: row.employerId,
            sourceJobId: row.jobId,
            status: "earned",
            earnedAt: now,
          })
          .returning({ id: opportunityCredits.id });

        credit = { issued: true, creditId: issuedCredit.id };
      }
    }

    await tx.insert(notifications).values([
      {
        recipientId: row.workerId,
        type: "work_proof_issued",
        title: "Bukti Kerja diterbitkan",
        body: "Penyelesaian pekerjaan sudah diverifikasi dan masuk ke Paspor Rintara.",
        entityType: "agreement",
        entityId: row.agreementId,
        createdAt: now,
      },
      {
        recipientId: row.employerId,
        type: "completion_verified",
        title: "Pekerjaan selesai",
        body: "Pekerjaan, sesi, dan Mini Agreement sudah selesai.",
        entityType: "agreement",
        entityId: row.agreementId,
        createdAt: now,
      },
      ...(row.isFirstOpportunity
        ? [
            {
              recipientId: row.employerId,
              type: credit.issued
                ? "opportunity_credit_earned"
                : "opportunity_credit_skipped",
              title: credit.issued
                ? "Kredit Kesempatan diterbitkan"
                : "Batas Kredit Kesempatan tercapai",
              body: credit.issued
                ? "Satu Kredit Kesempatan baru tersedia untuk boost pekerjaan."
                : "Penyelesaian tetap berhasil, tetapi kredit baru tidak diterbitkan karena sudah ada tiga kredit aktif.",
              entityType: "job",
              entityId: row.jobId,
              createdAt: now,
            },
          ]
        : []),
    ]);

    await tx.insert(auditLogs).values({
      actorId: actor.userId,
      action: "verify_completion",
      entityType: "agreement",
      entityId: row.agreementId,
      requestId: actor.requestId,
      metadata: {
        workProofId: proof.id,
        creditIssued: credit.issued,
        creditId: credit.creditId,
        creditSkippedReason: credit.skippedReason,
      },
      createdAt: now,
    });

    return {
      jobId: row.jobId,
      agreementId: row.agreementId,
      workProofId: proof.id,
      credit,
    };
  }).catch(async (error) => {
    if (isUniqueViolation(error, "work_proofs_agreement_unique")) {
      const [existingProof] = await db
        .select({
          agreementId: workProofs.agreementId,
          workProofId: workProofs.id,
        })
        .from(workProofs)
        .where(eq(workProofs.agreementId, agreementId))
        .limit(1);

      if (existingProof) {
        const [agreement] = await db
          .select({
            jobId: agreements.jobId,
            isFirstOpportunity: agreements.isFirstOpportunity,
          })
          .from(agreements)
          .where(eq(agreements.id, agreementId))
          .limit(1);

        if (!agreement) throw error;

        return {
          jobId: agreement.jobId,
          agreementId: existingProof.agreementId,
          workProofId: existingProof.workProofId,
          credit: await readCreditOutcome(
            db,
            agreement.jobId,
            agreement.isFirstOpportunity,
          ),
        };
      }
    }
    throw error;
  });

  revalidateWork(result.agreementId);
  revalidatePath("/worker/dashboard");
  revalidatePath("/employer/dashboard");

  return {
    ...result,
  };
}

function isUniqueViolation(error: unknown, constraintName: string) {
  const databaseError = getDatabaseError(error);

  return (
    databaseError?.code === "23505" &&
    databaseError.constraintName === constraintName
  );
}

function getDatabaseError(error: unknown):
  | {
      code?: unknown;
      constraintName?: unknown;
    }
  | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as {
    code?: unknown;
    constraint_name?: unknown;
    constraint?: unknown;
    cause?: unknown;
  };

  if (typeof candidate.code === "string") {
    return {
      code: candidate.code,
      constraintName: candidate.constraint_name ?? candidate.constraint,
    };
  }

  return getDatabaseError(candidate.cause);
}
