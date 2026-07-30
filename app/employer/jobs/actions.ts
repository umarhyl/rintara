"use server";

import {
  createJobDraft,
  publishJob,
  updateJobDraft,
} from "@/server/domain/jobs/actions";
import {
  toJobActionFailure,
  type JobActionFailure,
} from "@/server/domain/jobs/action-result";

export type CreateJobDraftActionResult =
  | { ok: true; jobId: string; status: "draft" }
  | JobActionFailure;

export type UpdateJobDraftActionResult =
  | { ok: true }
  | JobActionFailure;

export type PublishJobActionResult =
  | { ok: true }
  | JobActionFailure;

export async function submitCreateJobDraft(
  input: unknown,
): Promise<CreateJobDraftActionResult> {
  try {
    const result = await createJobDraft(input);
    return { ok: true, ...result };
  } catch (error) {
    return toJobActionFailure(
      error,
      "Draf belum dapat disimpan. Silakan coba lagi.",
    );
  }
}

export async function submitUpdateJobDraft(
  jobId: string,
  input: unknown,
): Promise<UpdateJobDraftActionResult> {
  try {
    await updateJobDraft(jobId, input);
    return { ok: true };
  } catch (error) {
    return toJobActionFailure(
      error,
      "Draf belum dapat disimpan. Silakan coba lagi.",
    );
  }
}

export async function submitPublishJob(
  jobId: string,
): Promise<PublishJobActionResult> {
  try {
    await publishJob(jobId);
    return { ok: true };
  } catch (error) {
    return toJobActionFailure(
      error,
      "Pekerjaan belum dapat diterbitkan. Silakan coba lagi.",
    );
  }
}
