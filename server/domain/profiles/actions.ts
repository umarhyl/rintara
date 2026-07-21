"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { employerProfiles } from "@/server/db/schema";
import { requireActiveUser } from "@/server/auth/identity";
import { ApplicationError } from "@/server/errors/application-error";

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

export async function updateEmployerProfile(
  input: unknown
): Promise<UpdateEmployerProfileResult> {
  try {
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
