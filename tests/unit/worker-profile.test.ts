import { describe, expect, test } from "bun:test";
import { MAX_WORKER_CATEGORY_INTERESTS } from "@/lib/onboarding";
import { workerProfileSchema } from "@/server/domain/profiles/schemas";

const areaId = "00000000-0000-4000-8000-000000000001";
const categoryId = "00000000-0000-4000-8000-000000000002";

describe("worker profile input", () => {
  test("normalizes bounded profile fields", () => {
    expect(
      workerProfileSchema.parse({
        displayName: "  Ayu Pratama  ",
        areaId,
        bio: "  Siap belajar.  ",
        availabilityNote: "   ",
        categoryInterestIds: [categoryId],
      }),
    ).toEqual({
      displayName: "Ayu Pratama",
      areaId,
      bio: "Siap belajar.",
      availabilityNote: null,
      categoryInterestIds: [categoryId],
    });
  });

  test("rejects malformed, duplicate, and excessive category interests", () => {
    const input = {
      displayName: "Ayu Pratama",
      areaId,
      bio: null,
      availabilityNote: null,
    };

    expect(
      workerProfileSchema.safeParse({
        ...input,
        categoryInterestIds: ["invalid"],
      }).success,
    ).toBe(false);
    expect(
      workerProfileSchema.safeParse({
        ...input,
        categoryInterestIds: [categoryId, categoryId],
      }).success,
    ).toBe(false);
    expect(
      workerProfileSchema.safeParse({
        ...input,
        categoryInterestIds: Array.from(
          { length: MAX_WORKER_CATEGORY_INTERESTS + 1 },
          (_, index) =>
            `00000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
        ),
      }).success,
    ).toBe(false);
  });

  test("rejects caller-controlled identity and derived profile fields", () => {
    expect(
      workerProfileSchema.safeParse({
        displayName: "Ayu Pratama",
        areaId,
        bio: null,
        availabilityNote: null,
        categoryInterestIds: [],
        workerId: "00000000-0000-4000-8000-000000000003",
        experienceLevel: "verified",
        verificationStatus: "verified",
      }).success,
    ).toBe(false);
  });
});
