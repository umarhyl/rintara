"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw, Search } from "lucide-react";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";

export default function CategoriesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[60svh] w-full max-w-2xl items-center px-4 py-16 sm:px-6">
        <section
          aria-labelledby="categories-error-heading"
          role="alert"
          className="w-full rounded-xl bg-white p-7 sm:p-9"
        >
          <CircleAlert className="size-6 text-destructive" aria-hidden="true" />
          <h1
            id="categories-error-heading"
            className="mt-6 text-3xl font-semibold tracking-[-0.025em]"
          >
            Kategori dan wilayah belum dapat dimuat
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Coba muat kembali halaman ini. Kamu juga dapat langsung membuka
            daftar pekerjaan tanpa menunggu data kategori.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button type="button" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Coba lagi
            </Button>
            <Button variant="outline" asChild>
              <Link href="/jobs">
                <Search aria-hidden="true" />
                Buka daftar pekerjaan
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
