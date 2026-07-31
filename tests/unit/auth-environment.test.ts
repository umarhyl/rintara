import { afterEach, describe, expect, test } from "bun:test";
import {
  getAuthenticationCallbackUrl,
  getEmailVerificationCallbackUrl,
  getPasswordRecoveryCallbackUrl,
  getRegistrationOnboardingPath,
} from "@/server/auth/environment";

const originalApplicationUrl = process.env.RINTARA_APP_URL;

afterEach(() => {
  if (originalApplicationUrl === undefined) {
    delete process.env.RINTARA_APP_URL;
  } else {
    process.env.RINTARA_APP_URL = originalApplicationUrl;
  }
});

describe("authentication callback configuration", () => {
  test("uses the local application URL by default", () => {
    delete process.env.RINTARA_APP_URL;
    expect(getAuthenticationCallbackUrl()).toBe(
      "http://localhost:3000/auth/callback",
    );
  });

  test("uses the configured canonical application origin", () => {
    process.env.RINTARA_APP_URL = "https://review.rintara.example/base";
    expect(getAuthenticationCallbackUrl()).toBe(
      "https://review.rintara.example/auth/callback",
    );
  });

  test("uses the same allowlisted callback for password recovery", () => {
    process.env.RINTARA_APP_URL = "https://rintara.example";
    expect(getPasswordRecoveryCallbackUrl()).toBe(
      "https://rintara.example/auth/callback?next=%2Freset-password",
    );
  });

  test("keeps the selected role and safe destination through email verification", () => {
    process.env.RINTARA_APP_URL = "https://rintara.example";
    expect(
      getEmailVerificationCallbackUrl("/jobs/job-1", "worker"),
    ).toBe(
      "https://rintara.example/auth/callback?next=%2Fonboarding%2Fworker%3Fnext%3D%252Fjobs%252Fjob-1&flow=signup",
    );
  });

  test("keeps a safe onboarding hint for token-hash email templates", () => {
    expect(getRegistrationOnboardingPath("/jobs/job-1", "worker")).toBe(
      "/onboarding/worker?next=%2Fjobs%2Fjob-1",
    );
    expect(
      getRegistrationOnboardingPath("https://attacker.example", "employer"),
    ).toBe("/onboarding/employer?next=%2Faccount%2Fcontinue");
  });

  test("rejects unsafe email-verification destinations and roles", () => {
    process.env.RINTARA_APP_URL = "https://rintara.example";
    expect(
      getEmailVerificationCallbackUrl(
        "https://attacker.example",
        "admin" as "worker",
      ),
    ).toBe(
      "https://rintara.example/auth/callback?next=%2Fonboarding%2Frole%3Fnext%3D%252Faccount%252Fcontinue&flow=signup",
    );
  });
});
