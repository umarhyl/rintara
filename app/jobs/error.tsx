"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw, SlidersHorizontal } from "lucide-react";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";

export default function JobsError({ reset }: { reset: () => void }) {
  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[60svh] max-w-2xl items-center px-4 py-16 sm:px-6">
        <section className="w-full rounded-xl border border-border bg-card p-7 sm:p-9">
          <CircleAlert className="size-6 text-destructive" aria-hidden="true" />
          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.025em]">
            Daftar pekerjaan belum dapat dimuat
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Coba muat ulang. Jika filter pada alamat halaman tidak lagi valid,
            hapus filter untuk kembali ke daftar utama.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Coba lagi
            </Button>
            <Button variant="outline" asChild>
              <Link href="/jobs">
                <SlidersHorizontal aria-hidden="true" />
                Hapus filter
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
