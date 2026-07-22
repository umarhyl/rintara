import { z } from "zod";

const rintaraEnvironmentSchema = z.enum([
  "local",
  "test",
  "demo",
  "review",
  "production",
]);

const postgresUrlSchema = z
  .string()
  .min(1)
  .refine(
    (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
    "Expected a PostgreSQL connection URL",
  );

export function getRintaraEnvironment() {
  return rintaraEnvironmentSchema.parse(process.env.RINTARA_ENV);
}

export function getRuntimePoolSize() {
  return z.coerce.number().int().min(1).max(10).parse(
    process.env.DATABASE_POOL_MAX ?? "1",
  );
}

export function getDatabaseSslMode(): "require" | false {
  return process.env.DATABASE_SSL === "disable" ? false : "require";
}

export function getRuntimeDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    return "postgres://dummy:dummy@localhost:5432/dummy";
  }
  return postgresUrlSchema.parse(process.env.DATABASE_URL);
}

export function getMigrationDatabaseUrl() {
  return postgresUrlSchema.parse(process.env.DIRECT_DATABASE_URL);
}

export function getIntegrationDatabaseUrl() {
  const environment = getRintaraEnvironment();
  const integrationDatabaseUrl = postgresUrlSchema.parse(
    process.env.TEST_DATABASE_URL,
  );

  if (environment !== "test") {
    throw new Error(
      "Integration database refused. Set RINTARA_ENV=test explicitly.",
    );
  }

  const integrationTarget = getDatabaseTarget(integrationDatabaseUrl);

  for (const configuredUrl of [
    process.env.DATABASE_URL,
    process.env.DIRECT_DATABASE_URL,
  ]) {
    if (
      configuredUrl &&
      getDatabaseTarget(postgresUrlSchema.parse(configuredUrl)) ===
        integrationTarget
    ) {
      throw new Error(
        "Integration database refused. TEST_DATABASE_URL must be isolated from DATABASE_URL and DIRECT_DATABASE_URL.",
      );
    }
  }

  const url = new URL(integrationDatabaseUrl);
  const isLoopback = normalizeDatabaseHost(url.hostname) === "loopback";

  if (!isLoopback || url.pathname !== "/rintara_test") {
    throw new Error(
      "Integration database refused. TEST_DATABASE_URL must use a loopback host and the rintara_test database.",
    );
  }

  return integrationDatabaseUrl;
}

function getDatabaseTarget(connectionUrl: string) {
  const url = new URL(connectionUrl);

  return `${normalizeDatabaseHost(url.hostname)}:${url.port || "5432"}${url.pathname}`;
}

function normalizeDatabaseHost(hostname: string) {
  const host = hostname.toLowerCase();

  return ["localhost", "127.0.0.1", "[::1]"].includes(host)
    ? "loopback"
    : host;
}

export function getSeedDatabaseUrl() {
  return postgresUrlSchema.parse(
    process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  );
}

export function assertMigrationAllowed() {
  const environment = getRintaraEnvironment();

  if (
    environment === "production" &&
    process.env.RINTARA_ALLOW_PRODUCTION_MIGRATION !== "true"
  ) {
    throw new Error(
      "Production migration refused. Set RINTARA_ALLOW_PRODUCTION_MIGRATION=true only in the controlled migration job.",
    );
  }
}

export function assertSeedAllowed() {
  const environment = getRintaraEnvironment();

  if (environment === "production") {
    throw new Error("Seed refused: production is never an allowed seed target.");
  }

  const allowedEnvironments: string[] = ["local", "test", "demo"];

  if (!allowedEnvironments.includes(environment)) {
    throw new Error(`Seed refused in ${environment}. Use local, test, or demo.`);
  }

  if (process.env.RINTARA_ALLOW_SEED !== "true") {
    throw new Error("Seed refused. Set RINTARA_ALLOW_SEED=true explicitly.");
  }
}
