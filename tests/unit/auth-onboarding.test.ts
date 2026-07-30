import { describe, expect, test } from "bun:test";
import { requireSubjectClaim } from "@/server/auth/identity-claims";
import {
  isExistingAccountSignUpError,
  mapAuthProviderError,
} from "@/server/auth/provider-errors";
import { hasCompleteRoleProfile } from "@/server/auth/profile-completeness";
import { safeApplicationPath } from "@/server/auth/redirects";
import {
  onboardingSchema,
  passwordRecoveryRequestSchema,
  passwordUpdateSchema,
} from "@/server/auth/schemas";
import { ApplicationError } from "@/server/errors/application-error";
import { MAX_WORKER_CATEGORY_INTERESTS } from "@/lib/onboarding";

const areaId = "00000000-0000-4000-8000-000000000001";
const categoryId = "00000000-0000-4000-8000-000000000002";

describe("authentication identity", () => {
  test("rejects an invalid session claim", () => {
    expect(() => requireSubjectClaim({}, false)).toThrow(ApplicationError);
    expect(() => requireSubjectClaim({ sub: "subject" }, true)).toThrow(
      ApplicationError,
    );
  });

  test("accepts only a non-empty verified subject", () => {
    expect(requireSubjectClaim({ sub: "auth-user-id" }, false)).toBe(
      "auth-user-id",
    );
  });

  test("requires the profile matching the trusted role", () => {
    expect(
      hasCompleteRoleProfile({
        role: "worker",
        workerProfileId: "worker-profile",
        employerProfileId: null,
      }),
    ).toBe(true);
    expect(
      hasCompleteRoleProfile({
        role: "worker",
        workerProfileId: null,
        employerProfileId: "employer-profile",
      }),
    ).toBe(false);
    expect(
      hasCompleteRoleProfile({
        role: "employer",
        workerProfileId: null,
        employerProfileId: "employer-profile",
      }),
    ).toBe(true);
    expect(
      hasCompleteRoleProfile({
        role: "admin",
        workerProfileId: null,
        employerProfileId: null,
      }),
    ).toBe(true);
  });
});

describe("onboarding input", () => {
  test("rejects admin as a self-service role", () => {
    expect(
      onboardingSchema.safeParse({
        role: "admin",
        displayName: "Admin",
        areaId,
      }).success,
    ).toBe(false);
  });

  test("ignores caller-supplied identity and account status", () => {
    const result = onboardingSchema.parse({
      role: "worker",
      displayName: "  Ayu Pratama  ",
      areaId,
      userId: "caller-controlled",
      status: "suspended",
      trustedRole: "admin",
    });

    expect(result).toEqual({
      role: "worker",
      displayName: "Ayu Pratama",
      areaId,
      bio: null,
      availabilityNote: null,
    });
  });

  test("accepts bounded, unique category interests as self-declared input", () => {
    const result = onboardingSchema.parse({
      role: "worker",
      displayName: "Ayu Pratama",
      areaId,
      categoryInterestIds: [categoryId],
    });

    expect(result).toMatchObject({ categoryInterestIds: [categoryId] });
  });

  test("rejects duplicate or excessive category interests", () => {
    expect(
      onboardingSchema.safeParse({
        role: "worker",
        displayName: "Ayu Pratama",
        areaId,
        categoryInterestIds: [categoryId, categoryId],
      }).success,
    ).toBe(false);

    expect(
      onboardingSchema.safeParse({
        role: "worker",
        displayName: "Ayu Pratama",
        areaId,
        categoryInterestIds: Array.from(
          { length: MAX_WORKER_CATEGORY_INTERESTS + 1 },
          (_, index) => `00000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
        ),
      }).success,
    ).toBe(false);
  });
});

describe("authentication provider errors", () => {
  test("recognizes only duplicate-email sign-up errors for safe recovery", () => {
    expect(
      isExistingAccountSignUpError({ code: "user_already_exists" }),
    ).toBe(true);
    expect(isExistingAccountSignUpError({ code: "email_exists" })).toBe(true);
    expect(isExistingAccountSignUpError({ code: "weak_password" })).toBe(
      false,
    );
  });

  test("maps provider details to a safe sign-in error", () => {
    const error = mapAuthProviderError(
      { code: "invalid_credentials", status: 400 },
      "sign-in",
    );

    expect(error.code).toBe("UNAUTHENTICATED");
    expect(error.message).not.toContain("invalid_credentials");
  });

  test("maps an expired password recovery session to a safe error", () => {
    const error = mapAuthProviderError(
      { code: "session_not_found", status: 401 },
      "password-update",
    );

    expect(error.code).toBe("UNAUTHENTICATED");
    expect(error.message).not.toContain("session_not_found");
  });
});

describe("password recovery input", () => {
  test("normalizes a valid recovery email", () => {
    expect(
      passwordRecoveryRequestSchema.parse({
        email: "  USER@Example.COM ",
      }),
    ).toEqual({ email: "user@example.com" });
  });

  test("requires a bounded password and matching confirmation", () => {
    expect(
      passwordUpdateSchema.safeParse({
        password: "kata-sandi-baru",
        passwordConfirmation: "kata-sandi-baru",
      }).success,
    ).toBe(true);
    expect(
      passwordUpdateSchema.safeParse({
        password: "kata-sandi-baru",
        passwordConfirmation: "tidak-sama",
      }).success,
    ).toBe(false);
    expect(
      passwordUpdateSchema.safeParse({
        password: "pendek",
        passwordConfirmation: "pendek",
      }).success,
    ).toBe(false);
  });
});

describe("authentication callback redirect", () => {
  test("accepts local paths and rejects external redirect forms", () => {
    expect(safeApplicationPath("/worker/jobs")).toBe("/worker/jobs");
    expect(safeApplicationPath("https://attacker.example")).toBe(
      "/account/continue",
    );
    expect(safeApplicationPath("//attacker.example")).toBe(
      "/account/continue",
    );
    expect(safeApplicationPath("/\\attacker.example")).toBe(
      "/account/continue",
    );
  });
});
