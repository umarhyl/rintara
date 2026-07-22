import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";

export default function AccountRestrictedPage() {
  return (
    <PublicShell>
      <div className="relative isolate flex min-h-[68vh] items-center overflow-hidden px-4 py-16">
        <AmbientBackdrop variant="page" />
        <section className="relative mx-auto w-full max-w-2xl border-y border-border bg-card/45 px-5 py-12 text-center backdrop-blur-sm sm:px-10" aria-labelledby="restricted-title">
          <ShieldAlert className="mx-auto size-7 text-destructive" aria-hidden="true" />
          <p className="mt-6 text-sm font-medium text-destructive">Akses akun dibatasi</p>
          <h1 id="restricted-title" className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Akun tidak dapat digunakan sementara</h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">Hubungi tim Rintara jika kamu merasa pembatasan ini keliru. Pekerjaan publik tetap dapat dilihat.</p>
          <Button className="mt-7 h-11 rounded-full px-5" asChild><Link href="/jobs">Lihat pekerjaan publik</Link></Button>
        </section>
      </div>
    </PublicShell>
  );
}
