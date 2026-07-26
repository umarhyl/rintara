"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center bg-muted/40 px-4 py-16">
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-card px-5 py-12 text-center sm:px-10">
        <AlertTriangle className="mx-auto size-7 text-destructive" aria-hidden="true" />
        <p className="mt-6 text-sm font-medium text-primary">Ada langkah yang tertunda</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Halaman belum berhasil dimuat</h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">Coba sekali lagi, lalu periksa perubahan terakhir setelah halaman berhasil dimuat.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="h-11 px-5" onClick={reset}>Coba lagi</Button>
          <Button variant="outline" className="h-11 px-5" asChild><Link href="/">Kembali ke beranda</Link></Button>
        </div>
      </div>
    </main>
  );
}
