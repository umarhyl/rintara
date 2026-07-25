import { describe, expect, test } from "bun:test";
import { updateEmployerProfile } from "@/server/domain/profiles/actions";
import { employerProfileSchema } from "@/server/domain/profiles/schemas";

const areaId = "00000000-0000-4000-8000-000000000001";

describe("employer profile input", () => {
  test("returns stable field errors before database access", async () => {
    const result = await updateEmployerProfile({
      displayName: " ",
      employerType: "unknown",
      areaId: "invalid",
      description: "",
    });

    expect(result).toMatchObject({
      ok: false,
      code: "VALIDATION_FAILED",
      fieldErrors: {
        displayName: ["Nama usaha terlalu pendek."],
        employerType: ["Pilih jenis pemberi kerja yang valid."],
        areaId: ["Pilih area kegiatan yang valid."],
      },
    });
  });

  test("normalizes profile fields and rejects server-owned values", () => {
    expect(
      employerProfileSchema.parse({
        displayName: "  Usaha Sintetis  ",
        employerType: "business",
        areaId,
        description: "  Kegiatan komunitas lokal.  ",
      }),
    ).toEqual({
      displayName: "Usaha Sintetis",
      employerType: "business",
      areaId,
      description: "Kegiatan komunitas lokal.",
    });

    expect(
      employerProfileSchema.safeParse({
        displayName: "Usaha Sintetis",
        employerType: "business",
        areaId,
        description: null,
        userId: "00000000-0000-4000-8000-000000000099",
        activeCreditsCount: 99,
      }).success,
    ).toBe(false);
  });

  test("requires an active replacement when the saved area is unavailable", async () => {
    const form = await Bun.file(
      "features/employer/components/employer-profile-form.tsx",
    ).text();

    expect(form).toContain("areaIsActive");
    expect(form).toContain('"Pilih area baru"');
    expect(form).toContain("profile.areaName");
  });
});
