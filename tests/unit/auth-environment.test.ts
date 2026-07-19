import { afterEach, describe, expect, test } from "bun:test";
import { getAuthenticationCallbackUrl } from "@/server/auth/environment";

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
});
