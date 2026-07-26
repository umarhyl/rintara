import { describe, expect, test } from "bun:test";
import {
  formatRupiahInput,
  normalizeRupiahDigits,
} from "../../lib/format-rupiah";

describe("public job filter recovery", () => {
  test("blocks an inverted wage range without discarding input", async () => {
    const filters = await Bun.file(
      "components/rintara/job-filters.tsx",
    ).text();

    expect(filters).toContain("normalizeRupiahDigits(value)");
    expect(filters).toContain(
      "Number(minimumWage) > Number(maximumWage)",
    );
    expect(filters).toContain(
      "Upah maksimum harus sama dengan atau lebih besar dari upah minimum.",
    );
    expect(
      filters.match(
        /disabled=\{isPending \|\| hasInvalidWageRange\}/g,
      )?.length,
    ).toBe(2);
    expect(filters).toContain('role="alert"');
  });

  test("formats wage fields as Rupiah while keeping clean query digits", async () => {
    const filters = await Bun.file(
      "components/rintara/job-filters.tsx",
    ).text();
    const jobsPage = await Bun.file("app/jobs/page.tsx").text();

    expect(normalizeRupiahDigits("Rp 1.250.000")).toBe("1250000");
    expect(normalizeRupiahDigits("000500000")).toBe("500000");
    expect(normalizeRupiahDigits("9999999999999")).toBe("999999999999");
    expect(formatRupiahInput("500000")).toBe("Rp 500.000");
    expect(formatRupiahInput("1250000")).toBe("Rp 1.250.000");
    expect(formatRupiahInput("")).toBe("");
    expect(filters).toContain(
      "const minimumWageDisplay = formatRupiahInput(minimumWage)",
    );
    expect(filters).toContain(
      "const maximumWageDisplay = formatRupiahInput(maximumWage)",
    );
    expect(filters).toContain("value={minimumWageDisplay}");
    expect(filters).toContain("value={maximumWageDisplay}");
    expect(filters).toContain('query.set("minWage", nextValues.minimumWage.trim())');
    expect(filters).toContain('query.set("maxWage", nextValues.maximumWage.trim())');
    expect(jobsPage).toContain(
      "minimumWage: normalizeRupiahDigits(",
    );
    expect(jobsPage).toContain(
      "lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]",
    );
  });

  test("lets an invalid filter URL return to the unfiltered list", async () => {
    const errorPage = await Bun.file("app/jobs/error.tsx").text();

    expect(errorPage).toContain('<Link href="/jobs">');
    expect(errorPage).toContain("Hapus filter");
    expect(errorPage).toContain("Coba lagi");
  });

  test("keeps the job list on the dedicated discovery route", async () => {
    const home = await Bun.file("app/page.tsx").text();
    const jobsPage = await Bun.file("app/jobs/page.tsx").text();
    const jobCard = await Bun.file(
      "components/rintara/job-card.tsx",
    ).text();
    const publicJobsQuery = await Bun.file(
      "server/queries/jobs/public-jobs.ts",
    ).text();

    expect(home).not.toContain("<JobCard");
    expect(home).not.toContain("listPublishedJobs");
    expect(jobsPage).toContain("<JobCard");
    expect(jobsPage).toContain("listPublishedJobs");
    expect(jobCard).toContain("{job.wage}");
    expect(jobCard).toContain("md:text-right");
    expect(jobCard).not.toContain("Upah tetap");
    expect(jobCard).not.toContain("bg-[#eef4ef]");
    expect(jobCard).not.toContain("ArrowRight");
    expect(home).not.toContain('aria-label="Ringkasan pekerjaan terbaru"');
    expect(home).not.toContain("previewJob");
    expect(
      publicJobsQuery.match(/\.limit\(50\)/g)?.length,
    ).toBeGreaterThanOrEqual(2);
  });

  test("routes signed-in employers through the role-aware workspace", async () => {
    const action = await Bun.file(
      "components/rintara/employer-publish-action.tsx",
    ).text();

    expect(action).toContain("usePublicAuthState");
    expect(action).toContain('signedIn ? "/account/continue" : "/register"');
    expect(action).toContain(
      'signedIn ? "Buka ruang kerja" : "Pasang pekerjaan"',
    );
  });
});
