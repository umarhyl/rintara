import { afterEach, describe, expect, test } from "bun:test";
import {
  assertMigrationAllowed,
  assertSeedAllowed,
} from "@/server/db/environment";

const originalEnvironment = process.env.RINTARA_ENV;
const originalSeedFlag = process.env.RINTARA_ALLOW_SEED;
const originalMigrationFlag = process.env.RINTARA_ALLOW_PRODUCTION_MIGRATION;

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

afterEach(() => {
  restoreEnvironmentVariable("RINTARA_ENV", originalEnvironment);
  restoreEnvironmentVariable("RINTARA_ALLOW_SEED", originalSeedFlag);
  restoreEnvironmentVariable(
    "RINTARA_ALLOW_PRODUCTION_MIGRATION",
    originalMigrationFlag,
  );
});

describe("database operation guards", () => {
  test("always refuses seed against production", () => {
    process.env.RINTARA_ENV = "production";
    process.env.RINTARA_ALLOW_SEED = "true";

    expect(() => assertSeedAllowed()).toThrow("production");
  });

  test("refuses seed when the environment is not explicitly identified", () => {
    delete process.env.RINTARA_ENV;
    process.env.RINTARA_ALLOW_SEED = "true";

    expect(() => assertSeedAllowed()).toThrow();
  });

  test("requires explicit seed opt-in", () => {
    process.env.RINTARA_ENV = "local";
    process.env.RINTARA_ALLOW_SEED = "false";

    expect(() => assertSeedAllowed()).toThrow("RINTARA_ALLOW_SEED=true");
  });

  test("allows explicit seed only in a safe environment", () => {
    process.env.RINTARA_ENV = "demo";
    process.env.RINTARA_ALLOW_SEED = "true";

    expect(() => assertSeedAllowed()).not.toThrow();
  });

  test("requires an explicit production migration opt-in", () => {
    process.env.RINTARA_ENV = "production";
    process.env.RINTARA_ALLOW_PRODUCTION_MIGRATION = "false";

    expect(() => assertMigrationAllowed()).toThrow(
      "RINTARA_ALLOW_PRODUCTION_MIGRATION=true",
    );
  });
});
