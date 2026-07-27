import { afterEach, describe, expect, test } from "bun:test";
import {
  getAuthenticationCallbackUrl,
  getPasswordRecoveryCallbackUrl,
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
});
