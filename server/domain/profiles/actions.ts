"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  ApplicationError,
  type ApplicationErrorCode,
} from "@/server/errors/application-error";
import { workerProfileSchema } from "./schemas";

const employerProfileSchema = z.object({
  displayName: z.string().min(2, "Nama usaha terlalu pendek.").max(120, "Nama usaha terlalu panjang."),
  employerType: z.enum(["individual", "business", "community"], {
    error: "Pilih jenis pemberi kerja yang valid.",
  }),
  areaId: z.string().uuid("Pilih area kegiatan."),
  description: z.string().max(1000, "Deskripsi terlalu panjang.").nullable(),
});

export type UpdateEmployerProfileResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export type UpdateWorkerProfileResult =
  | { ok: true }
  | {
      ok: false;
      code: ApplicationErrorCode;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function updateWorkerProfile(
  input: unknown,
): Promise<UpdateWorkerProfileResult> {
  const parsed = workerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Periksa kembali isian profil.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { requireActiveUser } = await import("@/server/auth/identity");
    const { db } = await import("@/server/db/client");
    const { updateWorkerProfileInDatabase } = await import("./worker-profile");

    await updateWorkerProfileInDatabase(
      db,
      await requireActiveUser(),
      parsed.data,
    );
    revalidatePath("/worker/profile");
    revalidatePath("/worker/dashboard");

    return { ok: true };
  } catch (error) {
    if (error instanceof ApplicationError) {
      return { ok: false, code: error.code, message: error.message };
    }

    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Profil belum dapat disimpan. Periksa jaringan lalu coba lagi.",
    };
  }
}

export async function updateEmployerProfile(
  input: unknown
): Promise<UpdateEmployerProfileResult> {
  try {
    const { requireActiveUser } = await import("@/server/auth/identity");
    const context = await requireActiveUser();
    if (context.role !== "employer") {
      throw new ApplicationError("FORBIDDEN", "Only employers can update this profile.");
    }

    const parseResult = employerProfileSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        ok: false,
        message: "Periksa kembali isian profil.",
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const data = parseResult.data;
    
    const { db } = await import("@/server/db/client");
    const { employerProfiles } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");

    await db
      .update(employerProfiles)
      .set({
        displayName: data.displayName,
        employerType: data.employerType,
        areaId: data.areaId,
        description: data.description || null,
        updatedAt: new Date(),
      })
      .where(eq(employerProfiles.userId, context.userId));

    revalidatePath("/employer/settings/profile");
    revalidatePath("/employer/dashboard");

    return { ok: true };
  } catch (error) {
    if (error instanceof ApplicationError) {
      if (error.code === "UNAUTHENTICATED") {
        return { ok: false, message: "Sesi berakhir. Masuk kembali untuk menyimpan." };
      }
      if (error.code === "ACCOUNT_INACTIVE") {
        return { ok: false, message: "Akun dibatasi. Tidak dapat menyimpan." };
      }
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: "Profil belum dapat disimpan. Periksa jaringan lalu coba lagi.",
    };
  }
}
