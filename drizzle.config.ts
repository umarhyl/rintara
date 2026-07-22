import { defineConfig } from "drizzle-kit";

const schemaOnlyFallback =
  "postgresql://127.0.0.1:5432/rintara_schema_only";

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    // `db:generate` does not connect. Actual migrations use the guarded
    // server/db/migrate.ts script and never rely on this fallback URL.
    url:
      process.env.DIRECT_DATABASE_URL ??
      process.env.DATABASE_URL ??
      schemaOnlyFallback,
  },
  strict: true,
  verbose: true,
});
