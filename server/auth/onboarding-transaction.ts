import { and, eq, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/server/db/schema";
import {
  areas,
  categories,
  employerProfiles,
  users,
  workerInterests,
  workerProfiles,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";
import type { OnboardingInput } from "./schemas";

export type OnboardingResult = {
  userId: string;
  role: OnboardingInput["role"];
  displayName: string;
};

type OnboardingDatabase = PostgresJsDatabase<typeof schema>;

export async function synchronizeIdentityInDatabase(
  database: OnboardingDatabase,
  authSubject: string,
  input: OnboardingInput,
): Promise<OnboardingResult> {
  return database.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${authSubject}, 0))`,
    );

    const [existingUser] = await tx
      .select({ id: users.id, role: users.role, status: users.status })
      .from(users)
      .where(eq(users.authSubject, authSubject))
      .limit(1);

    if (existingUser && existingUser.status !== "active") {
      throw new ApplicationError(
        "ACCOUNT_INACTIVE",
        "This account cannot perform protected operations.",
      );
    }

    if (existingUser && existingUser.role !== input.role) {
      throw new ApplicationError(
        "FORBIDDEN",
        "Peran akun yang sudah dipilih tidak dapat diubah.",
      );
    }

    const userId =
      existingUser?.id ??
      (
        await tx
          .insert(users)
          .values({ authSubject, role: input.role })
          .returning({ id: users.id })
      )[0]!.id;

    async function requireActiveArea() {
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
    }

    if (input.role === "worker") {
      const [existingProfile] = await tx
        .select({ displayName: workerProfiles.displayName })
        .from(workerProfiles)
        .where(eq(workerProfiles.userId, userId))
        .limit(1);

      if (existingProfile) {
        return { userId, role: input.role, ...existingProfile };
      }

      await requireActiveArea();
      const categoryInterestIds = input.categoryInterestIds ?? [];

      if (categoryInterestIds.length > 0) {
        const activeCategories = await tx
          .select({ id: categories.id })
          .from(categories)
          .where(
            and(
              inArray(categories.id, categoryInterestIds),
              eq(categories.isActive, true),
            ),
          )
          .for("share");

        if (activeCategories.length !== categoryInterestIds.length) {
          throw new ApplicationError(
            "VALIDATION_FAILED",
            "Satu atau beberapa kategori minat tidak tersedia.",
          );
        }
      }

      const [profile] = await tx
        .insert(workerProfiles)
        .values({
          userId,
          displayName: input.displayName,
          areaId: input.areaId,
          bio: input.bio,
          availabilityNote: input.availabilityNote,
        })
        .returning({ displayName: workerProfiles.displayName });

      if (categoryInterestIds.length > 0) {
        await tx.insert(workerInterests).values(
          categoryInterestIds.map((categoryId) => ({
            workerId: userId,
            categoryId,
          })),
        );
      }

      return { userId, role: input.role, ...profile! };
    }

    const [existingProfile] = await tx
      .select({ displayName: employerProfiles.displayName })
      .from(employerProfiles)
      .where(eq(employerProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      return { userId, role: input.role, ...existingProfile };
    }

    await requireActiveArea();
    const [profile] = await tx
      .insert(employerProfiles)
      .values({
        userId,
        displayName: input.displayName,
        employerType: input.employerType,
        areaId: input.areaId,
        description: input.description,
      })
      .returning({ displayName: employerProfiles.displayName });

    return { userId, role: input.role, ...profile! };
  });
}
