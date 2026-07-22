import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import {
  assertMigrationAllowed,
  getDatabaseSslMode,
  getMigrationDatabaseUrl,
} from "./environment";

async function runMigrations() {
  assertMigrationAllowed();

  const client = postgres(getMigrationDatabaseUrl(), {
    max: 1,
    prepare: false,
    ssl: getDatabaseSslMode(),
  });

  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  } finally {
    await client.end({ timeout: 5 });
  }
}

await runMigrations();
