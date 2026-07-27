import { describe, expect, test } from "bun:test";

describe("maintenance scheduling configuration", () => {
  test("registers the bounded expiry endpoint as a daily Vercel cron", async () => {
    const configuration = JSON.parse(
      await Bun.file("vercel.json").text(),
    ) as {
      crons?: Array<{ path?: string; schedule?: string }>;
    };

    expect(configuration.crons).toContainEqual({
      path: "/api/maintenance/expire-jobs",
      schedule: "0 17 * * *",
    });
  });

  test("accepts the Vercel cron secret without removing manual scheduler support", async () => {
    const source = await Bun.file(
      "app/api/maintenance/expire-jobs/route.ts",
    ).text();

    expect(source).toContain("process.env.CRON_SECRET");
    expect(source).toContain("process.env.RINTARA_MAINTENANCE_SECRET");
    expect(source).toContain("timingSafeEqual");
    expect(source).toContain("configuredSecretBytes.length >= 32");
  });
});
