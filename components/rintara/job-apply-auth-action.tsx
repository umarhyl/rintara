"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicAuthState } from "@/features/auth/use-public-auth-state";

export function JobApplyAuthAction({ jobId }: { jobId: string }) {
  const authState = usePublicAuthState();

  const signedIn = authState === "signed-in";

  return (
    <div className="grid gap-5" aria-busy={authState === "checking"}>
      <div className="rounded-2xl border border-white/15 bg-white/[0.055] p-4">
        <p className="text-sm font-semibold text-white">
          {signedIn
            ? "Lanjutkan sesuai status akun"
            : "Catatan singkat setelah masuk"}
        </p>
        <p className="mt-2 text-sm leading-6 text-blue-100/65">
          {signedIn
            ? "Buka ruang kerja untuk melanjutkan dengan peran dan akses yang telah diverifikasi."
            : "Masuk sebagai pekerja untuk menulis ketersediaan dan alasan kamu cocok. Jangan cantumkan nomor rekening atau alamat pribadi."}
        </p>
      </div>

      {authState === "checking" ? (
        <Button
          className="theme-static-light h-12 rounded-full bg-white text-slate-950 shadow-none"
          disabled
        >
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          Memeriksa akun
        </Button>
      ) : signedIn ? (
        <Button
          className="theme-static-light h-12 rounded-full bg-white text-slate-950 shadow-none hover:bg-blue-50"
          asChild
        >
          <Link href="/account/continue" prefetch={false}>
            Buka ruang kerja <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <Button
          className="theme-static-light h-12 rounded-full bg-white text-slate-950 shadow-none hover:bg-blue-50"
          asChild
        >
          <Link
            href={{ pathname: "/sign-in", query: { next: `/jobs/${jobId}` } }}
            prefetch={false}
          >
            Masuk untuk melamar <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      )}

      <p className="flex gap-2 text-xs leading-5 text-blue-100/70">
        <BadgeCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Satu catatan singkat cukup; tidak ada penawaran upah.
      </p>
    </div>
  );
}
