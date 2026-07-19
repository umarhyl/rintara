import Link from "next/link";
import { SearchX } from "lucide-react";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-background px-4 py-16">
      <AmbientBackdrop variant="page" />
      <div className="relative mx-auto w-full max-w-2xl border-y border-border bg-card/45 px-5 py-12 text-center backdrop-blur-sm sm:px-10">
        <SearchX className="mx-auto size-7 text-primary" aria-hidden="true" />
        <p className="mt-6 font-mono text-sm text-muted-foreground">404 / RUTE BERAKHIR</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">Tautan mungkin sudah tidak berlaku atau halaman ini bukan bagian dari aksesmu. Untuk menjaga privasi, kami tidak menampilkan rincian lebih jauh.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="h-11 rounded-full px-5" asChild><Link href="/jobs">Lihat pekerjaan</Link></Button>
          <Button variant="outline" className="h-11 rounded-full px-5" asChild><Link href="/">Beranda</Link></Button>
        </div>
      </div>
    </main>
  );
}
