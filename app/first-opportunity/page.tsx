import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck2, Scale, ShieldCheck } from "lucide-react";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Kesempatan Pertama" };

const eligibilityRules = [
  {
    title: "Dihitung per kategori pekerjaan",
    text: "Pengalaman pada satu kategori tidak menutup kesempatan pertama pada kategori lain.",
  },
  {
    title: "Berdasarkan Bukti Kerja",
    text: "Hanya Bukti Kerja terverifikasi yang tidak dicabut yang menjadi dasar perhitungan.",
  },
  {
    title: "Ditentukan oleh sistem",
    text: "Pekerja tidak perlu—dan tidak dapat—menandai dirinya sendiri sebagai pemula.",
  },
  {
    title: "Tetap pekerjaan berbayar",
    text: "Kesempatan Pertama bukan kerja percobaan tanpa upah dan harus memenuhi referensi upah Rintara.",
  },
] as const;

export default function FirstOpportunityPage() {
  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden border-b border-border/70">
        <AmbientBackdrop variant="hero" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_srgb,var(--background)_91%,transparent)_52%,transparent_88%)] dark:bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_srgb,var(--background)_84%,transparent)_52%,transparent_88%)]" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[42rem] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-opportunity">
              <span className="h-px w-8 bg-opportunity/70" aria-hidden="true" />
              KESEMPATAN PERTAMA
            </p>
            <h1 className="mt-7 max-w-4xl text-balance text-[3.15rem] font-semibold leading-[1.01] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Pengalaman bisa dimulai dari <span className="font-serif font-normal italic text-opportunity">kepercayaan.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
              Pekerja yang belum memiliki Bukti Kerja pada suatu kategori tetap dapat memperoleh pekerjaan dengan tugas, upah, dan ketentuan yang jelas.
            </p>
            <Button className="mt-9 h-12 rounded-full px-6" asChild>
              <Link href="/jobs">Lihat pekerjaan tersedia <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>

          <div className="relative min-h-[25rem] lg:min-h-[34rem]" aria-label="Ilustrasi perjalanan Kesempatan Pertama">
            <div className="absolute left-[12%] top-[12%] h-[72%] w-px rotate-[24deg] bg-gradient-to-b from-transparent via-opportunity/70 to-transparent" aria-hidden="true" />
            <div className="absolute left-[30%] top-[10%] size-3 rounded-full border-[3px] border-background bg-opportunity ring-8 ring-opportunity/10" aria-hidden="true" />
            <div className="absolute bottom-[39%] left-[48%] size-3 rounded-full border-[3px] border-background bg-primary ring-8 ring-primary/10" aria-hidden="true" />
            <div className="absolute bottom-[12%] right-[12%] size-3 rounded-full border-[3px] border-background bg-success ring-8 ring-success/10" aria-hidden="true" />

            <div className="hero-artifact-slow absolute left-[2%] top-[2%] max-w-[15rem] border-l border-opportunity/45 bg-card/70 py-4 pl-5 pr-4 backdrop-blur-xl">
              <p className="font-mono text-xs text-opportunity">01 / KESEMPATAN</p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.02em]">Mulai pada kategori baru</p>
            </div>
            <div className="hero-artifact-delayed absolute left-[30%] top-[42%] max-w-[16rem] border-l border-primary/45 bg-card/70 py-4 pl-5 pr-4 backdrop-blur-xl">
              <p className="font-mono text-xs text-primary">02 / PEKERJAAN</p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.02em]">Jalani ketentuan yang disepakati</p>
            </div>
            <div className="hero-artifact-late absolute bottom-[1%] right-0 max-w-[15rem] border-l border-success/45 bg-card/70 py-4 pl-5 pr-4 backdrop-blur-xl">
              <p className="font-mono text-xs text-success">03 / BUKTI</p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.02em]">Bawa riwayat terverifikasi</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 sm:py-28" data-scroll-section>
        <AmbientBackdrop variant="page" className="opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-sm font-medium text-opportunity">Kelayakan yang dapat dipahami</p>
              <h2 className="mt-4 max-w-lg text-balance text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Kategori berbeda, titik mulai berbeda.</h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
                Seseorang yang sudah memiliki Bukti Kerja di Light Cleaning masih dapat memenuhi syarat untuk Kesempatan Pertama sebagai Event Helper.
              </p>
            </div>

            <ol className="divide-y divide-border border-y border-border" data-reveal-list>
              {eligibilityRules.map((rule, index) => (
                <li key={rule.title} className="group grid gap-3 py-7 sm:grid-cols-[3.5rem_1fr] sm:gap-6">
                  <span className="font-mono text-sm text-muted-foreground transition-colors duration-500 group-hover:text-opportunity">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.025em]">{rule.title}</h3>
                    <p className="mt-2 max-w-xl leading-7 text-muted-foreground">{rule.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/55 py-20 sm:py-24" data-scroll-section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <FileCheck2 className="size-6 text-primary" aria-hidden="true" />
              <h2 className="mt-6 max-w-lg text-balance text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Selesai bekerja bukan akhir dari perjalanannya.</h2>
              <p className="mt-5 max-w-lg leading-7 text-muted-foreground">Setelah penyelesaian diverifikasi, Bukti Kerja masuk ke Paspor Rintara sebagai riwayat yang tidak dapat diedit oleh pekerja.</p>
            </div>
            <div className="divide-y divide-border border-y border-border" data-reveal-list>
              <div className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr]">
                <Scale className="size-5 text-opportunity" aria-hidden="true" />
                <div><h3 className="font-semibold">Upah tetap bernilai</h3><p className="mt-2 leading-7 text-muted-foreground">Ketentuan upah terlihat sebelum melamar dan Kesempatan Pertama mengikuti referensi yang berlaku.</p></div>
              </div>
              <div className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr]">
                <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                <div><h3 className="font-semibold">Alamat lengkap tetap privat</h3><p className="mt-2 leading-7 text-muted-foreground">Lokasi lengkap baru ditampilkan kepada pekerja yang telah diterima melalui konteks kesepakatan.</p></div>
              </div>
              <div className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr]">
                <BadgeCheck className="size-5 text-success" aria-hidden="true" />
                <div><h3 className="font-semibold">Bukti mengikuti pekerjaan nyata</h3><p className="mt-2 leading-7 text-muted-foreground">Riwayat diterbitkan setelah pekerjaan selesai dan pemberi kerja memverifikasi penyelesaiannya.</p></div>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-lg font-medium">Temukan titik mula yang sesuai dengan kategorimu.</p>
            <Button variant="outline" className="h-12 w-fit rounded-full bg-background/70 px-6" asChild>
              <Link href="/jobs">Jelajahi pekerjaan <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
