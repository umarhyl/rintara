import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { RequestContext } from "@/server/auth/types";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import * as schema from "@/server/db/schema";
import {
  areas,
  categories,
  workerInterests,
  workerProfiles,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
import type { WorkerProfileInput } from "./schemas";

type WorkerProfileDatabase = PostgresJsDatabase<typeof schema>;

export async function updateWorkerProfileInDatabase(
  database: WorkerProfileDatabase,
  context: RequestContext,
  input: WorkerProfileInput,
) {
  const actor = assertRole(assertActiveUser(context), "worker");

  return database.transaction(async (tx) => {
    const [profile] = await tx
      .select({ userId: workerProfiles.userId })
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, actor.userId))
      .limit(1)
      .for("update");

    if (!profile) {
      throw new ApplicationError("NOT_FOUND", "Profil pekerja tidak ditemukan.");
    }

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
        "Wilayah yang dipilih tidak tersedia.",
      );
    }

    if (input.categoryInterestIds.length > 0) {
      const activeCategories = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            inArray(categories.id, input.categoryInterestIds),
            eq(categories.isActive, true),
          ),
        )
        .for("share");

      if (activeCategories.length !== input.categoryInterestIds.length) {
        throw new ApplicationError(
          "VALIDATION_FAILED",
          "Satu atau beberapa kategori minat tidak tersedia.",
        );
      }
    }

    await tx
      .update(workerProfiles)
      .set({
        displayName: input.displayName,
        areaId: input.areaId,
        bio: input.bio,
        availabilityNote: input.availabilityNote,
        updatedAt: new Date(),
      })
      .where(eq(workerProfiles.userId, actor.userId));

    await tx
      .delete(workerInterests)
      .where(eq(workerInterests.workerId, actor.userId));

    if (input.categoryInterestIds.length > 0) {
      await tx.insert(workerInterests).values(
        input.categoryInterestIds.map((categoryId) => ({
          workerId: actor.userId,
          categoryId,
        })),
      );
    }

    return { userId: actor.userId, ...input };
  });
}
