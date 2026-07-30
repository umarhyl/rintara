import { describe, expect, test } from "bun:test";

describe("employer application management UI", () => {
  test("shows authoritative application and selection windows", async () => {
    const applicantPage = await Bun.file(
      "app/employer/jobs/[id]/applicants/page.tsx",
    ).text();
    const applicantQuery = await Bun.file(
      "server/queries/applications/job-applicants.ts",
    ).text();

    expect(applicantQuery).toContain("submittedApplicationCount");
    expect(applicantQuery).toContain("getJobSelectionCutoff(startsAt)");
    expect(applicantQuery).toContain('eq(applications.status, "submitted")');
    expect(applicantPage).toContain("Total dari seluruh halaman");
    expect(applicantPage).toContain("job.applicationDeadline > now");
    expect(applicantPage).toContain("job.selectionCutoff > now");
    expect(applicantPage).toContain("selectionDisabledReason");
    expect(applicantPage).toContain("Lamaran baru sudah ditutup");
    expect(applicantPage).toContain("Pemilihan pekerja sudah ditutup");
  });

  test("refreshes stale employer state after consequential actions", async () => {
    const acceptButton = await Bun.file(
      "components/rintara/accept-application-button.tsx",
    ).text();
    const cancelButton = await Bun.file(
      "components/rintara/cancel-job-button.tsx",
    ).text();

    expect(acceptButton).toContain("CONCURRENT_ACCEPTANCE_CONFLICT");
    expect(acceptButton).toContain("APPLICATION_NOT_SUBMITTED");
    expect(acceptButton).toContain("JOB_NOT_AVAILABLE");
    expect(acceptButton).toContain("router.refresh()");
    expect(cancelButton).toContain("router.refresh()");
  });

  test("derives the read-only worker selection cutoff in the job form", async () => {
    const jobForm = await Bun.file(
      "features/employer/components/job-form.tsx",
    ).text();

    expect(jobForm).toContain("selectionCutoffFor");
    expect(jobForm).toContain("24 * 60 * 60 * 1000");
    expect(jobForm).toContain("Batas pemilihan pekerja");
    expect(jobForm).toContain(
      "Batas lamaran harus lebih awal dari waktu ini.",
    );
    expect(jobForm).toContain('aria-live="polite"');
    expect(jobForm).toContain("<Dialog");
    expect(jobForm).toContain("Terbitkan pekerjaan ini?");
    expect(jobForm).toContain("tidak dapat diedit");
    expect(jobForm).toContain("submitCreateJobDraft");
    expect(jobForm).toContain("submitUpdateJobDraft");
    expect(jobForm).toContain("submitPublishJob");
    expect(jobForm).toContain("failure.fieldErrors");
    expect(jobForm).toContain("reportValidity()");
    expect(jobForm).toContain("toLocalDateTimeInput");
    expect(jobForm).toContain("!formData.isFirstOpportunity");
    expect(jobForm).not.toContain("(error as Error).message");
    expect(jobForm).not.toContain("@/server/domain/jobs/actions");
  });

  test("keeps employer and publish Wage Guideline ordering aligned", async () => {
    const referenceQuery = await Bun.file(
      "server/queries/jobs/reference-data.ts",
    ).text();
    const publishAction = await Bun.file(
      "server/domain/jobs/actions.ts",
    ).text();

    for (const source of [referenceQuery, publishAction]) {
      expect(source).toContain("desc(wageGuidelines.effectiveFrom)");
      expect(source).toContain("desc(wageGuidelines.createdAt)");
      expect(source).toContain("asc(wageGuidelines.id)");
    }
  });
});
