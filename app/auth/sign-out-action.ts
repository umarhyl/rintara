"use server";

import { signOut } from "@/server/auth/adapters";

export type SignOutResult =
  | { ok: true }
  | { ok: false; message: string };

export async function submitSignOut(): Promise<SignOutResult> {
  try {
    await signOut();
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Belum dapat keluar saat ini. Silakan coba lagi.",
    };
  }
}
