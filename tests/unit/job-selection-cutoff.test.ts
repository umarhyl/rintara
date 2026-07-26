import { expect, test } from "bun:test";
import { getJobSelectionCutoff } from "@/server/domain/jobs/selection-cutoff";
import { jobDraftSchema } from "@/server/domain/jobs/validation";

const startsAt = new Date("2030-01-03T08:00:00.000Z");
const validDraft = {
  title: "Pekerjaan uji cutoff",
  categoryId: "10000000-0000-4000-8000-000000000001",
  areaId: "10000000-0000-4000-8000-000000000002",
  description: "Deskripsi sintetis untuk menguji batas waktu lamaran.",
  taskScope: "Melaksanakan pekerjaan sesuai instruksi.",
  publicLocationLabel: "Kota Pengujian",
  fullAddress: "Jalan Sintetis Nomor 1",
  startsAt,
  estimatedMinutes: 60,
  applicationDeadline: new Date("2030-01-02T07:59:59.999Z"),
  wageAmount: 100_000,
  wageUnit: "job" as const,
  paymentMethod: "Tunai",
  paymentTiming: "Setelah selesai",
  isFirstOpportunity: false,
  riskLevel: "low" as const,
};

test("requires the application deadline to be strictly before the selection cutoff", () => {
  const cutoff = getJobSelectionCutoff(startsAt);

  expect(cutoff.toISOString()).toBe("2030-01-02T08:00:00.000Z");
  expect(jobDraftSchema.safeParse(validDraft).success).toBe(true);
  expect(
    jobDraftSchema.safeParse({
      ...validDraft,
      applicationDeadline: cutoff,
    }).success,
  ).toBe(false);
});
