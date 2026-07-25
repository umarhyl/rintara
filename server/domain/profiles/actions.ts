"use server";

import { revalidatePath } from "next/cache";
import {
  ApplicationError,
  type ApplicationErrorCode,
} from "@/server/errors/application-error";
import { employerProfileSchema, workerProfileSchema } from "./schemas";

export type UpdateEmployerProfileResult =
  | { ok: true }
  | {
      ok: false;
      code: ApplicationErrorCode;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

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
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi kamu telah berakhir. Masuk kembali untuk melanjutkan."
          : error.code === "ACCOUNT_INACTIVE"
            ? "Akun ini sedang dibatasi dan belum dapat menyimpan profil."
            : error.code === "FORBIDDEN"
              ? "Profil pekerja tidak dapat diubah oleh akun ini."
              : error.code === "VALIDATION_FAILED" || error.code === "NOT_FOUND"
                ? error.message
                : "Profil belum dapat disimpan. Silakan coba lagi.";

      return { ok: false, code: error.code, message };
    }

    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Profil belum dapat disimpan. Periksa jaringan lalu coba lagi.",
    };
  }
}

export async function updateEmployerProfile(
  input: unknown,
): Promise<UpdateEmployerProfileResult> {
  const parsed = employerProfileSchema.safeParse(input);
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
    const { updateEmployerProfileInDatabase } = await import(
      "./employer-profile"
    );

    await updateEmployerProfileInDatabase(
      db,
      await requireActiveUser(),
      parsed.data,
    );

    revalidatePath("/employer/settings/profile");
    revalidatePath("/employer/dashboard");

    return { ok: true };
  } catch (error) {
    if (error instanceof ApplicationError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi kamu telah berakhir. Masuk kembali untuk melanjutkan."
          : error.code === "ACCOUNT_INACTIVE"
            ? "Akun ini sedang dibatasi dan belum dapat menyimpan profil."
            : error.code === "FORBIDDEN"
              ? "Profil pemberi kerja tidak dapat diubah oleh akun ini."
              : error.code === "VALIDATION_FAILED" ||
                  error.code === "NOT_FOUND"
                ? error.message
                : "Profil belum dapat disimpan. Silakan coba lagi.";

      return { ok: false, code: error.code, message };
    }

    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Profil belum dapat disimpan. Periksa jaringan lalu coba lagi.",
    };
  }
}
