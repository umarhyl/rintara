import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { areas, categories } from "@/server/db/schema";

export const e2eArea = {
  id: "e2000000-0000-4000-8000-000000000001",
  code: "e2e-bandung",
  name: "Kota E2E Bandung",
} as const;

export const e2eCategory = {
  id: "e2000000-0000-4000-8000-000000000002",
  slug: "e2e-event-support",
  name: "Dukungan Acara E2E",
} as const;

export default async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const databaseUrl = process.env.TEST_DATABASE_URL;

  if (!supabaseUrl || !publishableKey || !databaseUrl) {
    throw new Error(
      "E2E requires Supabase public configuration and TEST_DATABASE_URL.",
    );
  }

  const authSettingsResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: publishableKey },
  });
  const authSettings = (await authSettingsResponse.json()) as {
    disable_signup?: boolean;
    mailer_autoconfirm?: boolean;
    external?: { email?: boolean };
  };

  if (
    !authSettingsResponse.ok ||
    authSettings.disable_signup ||
    !authSettings.external?.email ||
    !authSettings.mailer_autoconfirm
  ) {
    throw new Error(
      "E2E requires enabled email signup with Supabase email auto-confirm.",
    );
  }

  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    ssl: process.env.TEST_DATABASE_SSL === "disable" ? false : "require",
  });
  const database = drizzle(client);

  try {
    await migrate(database, { migrationsFolder: "./drizzle" });
    await database
      .insert(areas)
      .values({
        id: e2eArea.id,
        level: "city_regency",
        code: e2eArea.code,
        name: e2eArea.name,
        isActive: true,
      })
      .onConflictDoNothing();
    await database
      .insert(categories)
      .values({
        id: e2eCategory.id,
        slug: e2eCategory.slug,
        name: e2eCategory.name,
        riskLevel: "low",
        firstOpportunityAllowed: true,
        isActive: true,
      })
      .onConflictDoNothing();
  } finally {
    await client.end({ timeout: 5 });
  }
}
