import { afterEach, describe, expect, test } from "bun:test";
import {
  assertMigrationAllowed,
  assertSeedAllowed,
  getIntegrationDatabaseUrl,
  getRuntimeDatabaseUrl,
} from "@/server/db/environment";

const originalEnvironment = process.env.RINTARA_ENV;
const originalSeedFlag = process.env.RINTARA_ALLOW_SEED;
const originalMigrationFlag = process.env.RINTARA_ALLOW_PRODUCTION_MIGRATION;
const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;
const originalRuntimeDatabaseUrl = process.env.DATABASE_URL;
const originalMigrationDatabaseUrl = process.env.DIRECT_DATABASE_URL;

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
  restoreEnvironmentVariable("TEST_DATABASE_URL", originalTestDatabaseUrl);
  restoreEnvironmentVariable("DATABASE_URL", originalRuntimeDatabaseUrl);
  restoreEnvironmentVariable(
    "DIRECT_DATABASE_URL",
    originalMigrationDatabaseUrl,
  );
});

describe("database operation guards", () => {
  test("refuses a missing runtime database in production", () => {
    process.env.RINTARA_ENV = "production";
    delete process.env.DATABASE_URL;

    expect(() => getRuntimeDatabaseUrl()).toThrow(
      "DATABASE_URL is required",
    );
  });

  test("keeps the build-time placeholder outside production", () => {
    process.env.RINTARA_ENV = "review";
    delete process.env.DATABASE_URL;

    expect(getRuntimeDatabaseUrl()).toContain("/dummy");
  });

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

  test("refuses an integration database outside the test environment", () => {
    process.env.RINTARA_ENV = "local";
    process.env.TEST_DATABASE_URL =
      "postgresql://postgres:test@127.0.0.1:5432/rintara_test";

    expect(() => getIntegrationDatabaseUrl()).toThrow("RINTARA_ENV=test");
  });

  test("refuses the runtime database as an integration target", () => {
    process.env.RINTARA_ENV = "test";
    process.env.TEST_DATABASE_URL =
      "postgresql://tester:test@127.0.0.1:5432/rintara_test";
    process.env.DATABASE_URL =
      "postgres://runtime:secret@LOCALHOST/rintara_test?sslmode=require";
    delete process.env.DIRECT_DATABASE_URL;

    expect(() => getIntegrationDatabaseUrl()).toThrow("must be isolated");
  });

  test("refuses the migration database as an integration target", () => {
    process.env.RINTARA_ENV = "test";
    process.env.TEST_DATABASE_URL =
      "postgresql://tester:test@localhost:5432/rintara_test";
    delete process.env.DATABASE_URL;
    process.env.DIRECT_DATABASE_URL =
      "postgresql://migration:secret@localhost/rintara_test";

    expect(() => getIntegrationDatabaseUrl()).toThrow("must be isolated");
  });

  test("refuses a remote integration database", () => {
    process.env.RINTARA_ENV = "test";
    process.env.TEST_DATABASE_URL =
      "postgresql://tester:test@database.example/rintara_test";
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_DATABASE_URL;

    expect(() => getIntegrationDatabaseUrl()).toThrow("loopback host");
  });

  test("refuses a local database without the test name", () => {
    process.env.RINTARA_ENV = "test";
    process.env.TEST_DATABASE_URL =
      "postgresql://tester:test@127.0.0.1:5432/rintara";
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_DATABASE_URL;

    expect(() => getIntegrationDatabaseUrl()).toThrow("rintara_test database");
  });

  test("refuses a percent-encoded database name", () => {
    process.env.RINTARA_ENV = "test";
    process.env.TEST_DATABASE_URL =
      "postgresql://tester:test@127.0.0.1:5432/rintara_%74est";
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_DATABASE_URL;

    expect(() => getIntegrationDatabaseUrl()).toThrow("rintara_test database");
  });

  test("allows an isolated integration database in the test environment", () => {
    const testDatabaseUrl =
      "postgresql://postgres:test@127.0.0.1:5432/rintara_test";
    process.env.RINTARA_ENV = "test";
    process.env.TEST_DATABASE_URL = testDatabaseUrl;
    process.env.DATABASE_URL =
      "postgresql://postgres:local@127.0.0.1:5432/rintara";
    process.env.DIRECT_DATABASE_URL =
      "postgresql://postgres:local@127.0.0.1:5432/rintara";

    expect(getIntegrationDatabaseUrl()).toBe(testDatabaseUrl);
  });
});
