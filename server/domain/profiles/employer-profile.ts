import "server-only";

import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { RequestContext } from "@/server/auth/types";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import * as schema from "@/server/db/schema";
import { areas, employerProfiles } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
import type { EmployerProfileInput } from "./schemas";

type EmployerProfileDatabase = PostgresJsDatabase<typeof schema>;

export async function updateEmployerProfileInDatabase(
  database: EmployerProfileDatabase,
  context: RequestContext,
  input: EmployerProfileInput,
) {
  const actor = assertRole(assertActiveUser(context), "employer");

  return database.transaction(async (tx) => {
    const [area] = await tx
      .select({ id: areas.id })
      .from(areas)
      .where(
        and(
          eq(areas.id, input.areaId),
          eq(areas.level, "city_regency"),
          eq(areas.isActive, true),
        ),
      )
      .limit(1)
      .for("share");

    if (!area) {
      throw new ApplicationError(
        "VALIDATION_FAILED",
        "Wilayah yang dipilih tidak tersedia. Muat ulang dan pilih area lain.",
      );
    }

    const [profile] = await tx
      .update(employerProfiles)
      .set({
        displayName: input.displayName,
        employerType: input.employerType,
        areaId: input.areaId,
        description: input.description,
        updatedAt: new Date(),
      })
      .where(eq(employerProfiles.userId, actor.userId))
      .returning({ userId: employerProfiles.userId });

    if (!profile) {
      throw new ApplicationError(
        "NOT_FOUND",
        "Profil pemberi kerja tidak ditemukan.",
      );
    }

    return { userId: profile.userId, ...input };
  });
}
