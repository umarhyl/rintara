import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  getDatabaseSslMode,
  getRuntimeDatabaseUrl,
  getRuntimePoolSize,
} from "./environment";
import * as schema from "./schema";

const globalForDatabase = globalThis as typeof globalThis & {
  rintaraPostgresClient?: ReturnType<typeof postgres>;
};

const postgresClient =
  globalForDatabase.rintaraPostgresClient ??
  postgres(getRuntimeDatabaseUrl(), {
    max: getRuntimePoolSize(),
    prepare: false,
    ssl: getDatabaseSslMode(),
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.rintaraPostgresClient = postgresClient;
}

export const db = drizzle(postgresClient, { schema });

export async function closeDatabaseConnection() {
  await postgresClient.end({ timeout: 5 });
}
