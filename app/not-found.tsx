import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-muted/40 px-4 py-16">
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-card px-5 py-12 text-center sm:px-10">
        <SearchX className="mx-auto size-7 text-primary" aria-hidden="true" />
        <p className="mt-6 text-sm font-semibold text-primary">Kode 404</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">Tautan mungkin sudah tidak berlaku atau halaman ini bukan bagian dari aksesmu. Untuk menjaga privasi, kami tidak menampilkan rincian lebih jauh.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="h-11 px-5" asChild><Link href="/jobs">Lihat pekerjaan</Link></Button>
          <Button variant="outline" className="h-11 px-5" asChild><Link href="/">Beranda</Link></Button>
        </div>
      </div>
    </main>
  );
}
