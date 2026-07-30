import { describe, expect, test } from "bun:test";
import { toJobActionFailure } from "@/server/domain/jobs/action-result";
import { ApplicationError } from "@/server/errors/application-error";

describe("job action result transport", () => {
  test("returns safe validation details as a serializable result", () => {
    const result = toJobActionFailure(
      new ApplicationError(
        "VALIDATION_FAILED",
        "Internal validation message.",
        {
          title: ["Judul pekerjaan minimal 5 karakter."],
          employerId: ["Internal ownership detail."],
          wageAmount: [null, "Nominal upah minimal Rp10.000."],
        },
      ),
      "Pekerjaan belum dapat disimpan.",
    );

    expect(result).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Periksa kembali ketentuan pekerjaan yang ditandai.",
      fieldErrors: {
        title: ["Judul pekerjaan minimal 5 karakter."],
        wageAmount: ["Nominal upah minimal Rp10.000."],
      },
    });
  });

  test("does not expose unexpected server errors", () => {
    const result = toJobActionFailure(
      new Error("database connection contains internal details"),
      "Pekerjaan belum dapat disimpan. Silakan coba lagi.",
    );

    expect(result).toEqual({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Pekerjaan belum dapat disimpan. Silakan coba lagi.",
    });
    expect(result.message).not.toContain("database");
  });
});
