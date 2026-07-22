import "server-only";

import { asc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  areas,
  categories,
  workerInterests,
  workerProfiles,
} from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

type WorkerProfileDatabase = PostgresJsDatabase<typeof schema>;

export type WorkerProfileData = {
  userId: string;
  displayName: string;
  areaId: string;
  areaName: string;
  bio: string | null;
  availabilityNote: string | null;
  categoryInterests: {
    id: string;
    name: string;
    isActive: boolean;
  }[];
};

export async function queryWorkerProfile(
  database: WorkerProfileDatabase,
  context: RequestContext,
): Promise<WorkerProfileData> {
  const actor = assertRole(assertActiveUser(context), "worker");
  const [profile] = await database
    .select({
      userId: workerProfiles.userId,
      displayName: workerProfiles.displayName,
      areaId: workerProfiles.areaId,
      areaName: areas.name,
      bio: workerProfiles.bio,
      availabilityNote: workerProfiles.availabilityNote,
    })
    .from(workerProfiles)
    .innerJoin(areas, eq(workerProfiles.areaId, areas.id))
    .where(eq(workerProfiles.userId, actor.userId))
    .limit(1);

  if (!profile) {
    throw new ApplicationError("NOT_FOUND", "Profil pekerja tidak ditemukan.");
  }

  const categoryInterests = await database
    .select({
      id: categories.id,
      name: categories.name,
      isActive: categories.isActive,
    })
    .from(workerInterests)
    .innerJoin(categories, eq(workerInterests.categoryId, categories.id))
    .where(eq(workerInterests.workerId, actor.userId))
    .orderBy(asc(categories.name), asc(categories.id));

  return { ...profile, categoryInterests };
}

export async function getMyProfile() {
  return queryWorkerProfile(db, await requireActiveUser());
}
