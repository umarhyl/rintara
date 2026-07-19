import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Cara kerja" };

const stages = [
  {
    number: "01",
    label: "Temukan",
    title: "Mulai dari ketentuan yang terbuka",
    summary: "Pekerja dapat memahami pekerjaan sebelum menentukan langkah.",
    steps: [
      {
        title: "Pemberi kerja memasang pekerjaan",
        text: "Tugas, upah, jadwal, area umum, alat, dan cara pembayaran ditulis sebelum dipublikasikan.",
      },
      {
        title: "Pekerja menemukan kesempatan",
        text: "Pekerja membandingkan ketentuan dan mengirim catatan singkat tanpa menawar upah.",
      },
    ],
  },
  {
    number: "02",
    label: "Jalankan",
    title: "Sepakati dulu, lalu kerjakan",
    summary: "Satu pekerjaan punya satu alur yang sama-sama dapat diikuti.",
    steps: [
      {
        title: "Satu pekerja diterima",
        text: "Pemberi kerja menerima tepat satu pekerja dan lamaran lain ditutup secara konsisten.",
      },
      {
        title: "Keduanya mengonfirmasi kesepakatan",
        text: "Ketentuan menjadi catatan tetap dan tidak dapat diedit diam-diam setelah diterima.",
      },
      {
        title: "Pekerja check-in dan check-out",
        text: "Kode enam digit berlaku singkat. Rintara tidak mengumpulkan lokasi secara terus-menerus.",
      },
      {
        title: "Pemberi kerja memverifikasi selesai",
        text: "Jika ada laporan aktif, penyelesaian dapat ditahan sampai proses peninjauan selesai.",
      },
    ],
  },
  {
    number: "03",
    label: "Buktikan",
    title: "Akhiri dengan jejak yang dapat dipercaya",
    summary: "Pekerjaan yang benar-benar selesai menjadi awal untuk kesempatan berikutnya.",
    steps: [
      {
        title: "Bukti Kerja diterbitkan",
        text: "Riwayat yang telah diverifikasi masuk ke Paspor Rintara dan menjadi dasar kelayakan pada kategori tersebut.",
      },
      {
        title: "Kredit Kesempatan dapat digunakan",
        text: "Pemberi kerja yang memenuhi syarat dapat memprioritaskan satu pekerjaan selama 24 jam.",
      },
    ],
  },
] as const;

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden border-b border-border/70">
        <AmbientBackdrop variant="page" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:px-8 lg:py-28">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-primary">
              <span className="h-px w-8 bg-primary/60" aria-hidden="true" />
              CARA KERJA RINTARA
            </p>
            <h1 className="mt-7 max-w-4xl text-balance text-[3.1rem] font-semibold leading-[1.02] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Satu pekerjaan.<br />Satu jejak yang <span className="font-serif font-normal italic text-primary">utuh.</span>
            </h1>
          </div>

          <div className="lg:pb-2">
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              Dari ketentuan pertama hingga Bukti Kerja, setiap tahap menunjukkan siapa yang perlu bertindak dan apa yang terjadi setelahnya.
            </p>
            <div className="mt-8 grid grid-cols-2 border-y border-border/80 py-5">
              <div className="border-r border-border pr-5">
                <p className="text-3xl font-semibold tracking-[-0.04em]">1</p>
                <p className="mt-1 text-base leading-7 text-muted-foreground">pekerja diterima per pekerjaan</p>
              </div>
              <div className="pl-5">
                <p className="text-3xl font-semibold tracking-[-0.04em]">1</p>
                <p className="mt-1 text-base leading-7 text-muted-foreground">Bukti Kerja per kesepakatan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 sm:py-28" data-scroll-section>
        <AmbientBackdrop variant="page" className="opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 border-b border-border pb-9 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <p className="text-sm font-medium text-primary">Perjalanan dari kesempatan ke bukti</p>
            <h2 className="max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl lg:justify-self-end">
              Tidak ada lompatan yang perlu ditebak.
            </h2>
          </div>

          <div className="relative mt-5">
            <span className="absolute bottom-0 left-[1.15rem] top-0 w-px bg-border sm:left-[2.4rem] lg:left-[23rem]" aria-hidden="true" />
            <ol data-reveal-list>
              {stages.map((stage, stageIndex) => (
                <li key={stage.number} className="relative grid gap-7 border-b border-border py-12 last:border-b-0 sm:pl-10 lg:grid-cols-[21rem_1fr] lg:gap-16 lg:pl-0">
                <div className="relative pl-12 sm:pl-16 lg:pl-0">
                  <span className="absolute left-[0.83rem] top-1.5 size-3 rounded-full border-[3px] border-background bg-primary sm:-left-[2.97rem] lg:left-auto lg:-right-[2.4rem]" aria-hidden="true" />
                  <p className="font-mono text-sm text-muted-foreground">{stage.number} / {stage.label}</p>
                  <h3 className="mt-4 max-w-sm text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">{stage.title}</h3>
                  <p className="mt-4 max-w-sm leading-7 text-muted-foreground">{stage.summary}</p>
                </div>

                <ol className="divide-y divide-border border-y border-border">
                  {stage.steps.map((step, stepIndex) => (
                    <li key={step.title} className="group grid gap-3 py-6 sm:grid-cols-[3.25rem_1fr] sm:gap-5">
                      <span className="font-mono text-sm text-muted-foreground transition-colors duration-500 group-hover:text-primary">
                        {String(stageIndex === 0 ? stepIndex + 1 : stageIndex === 1 ? stepIndex + 3 : stepIndex + 7).padStart(2, "0")}
                      </span>
                      <div>
                        <h4 className="text-lg font-semibold tracking-[-0.02em]">{step.title}</h4>
                        <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#09111f] py-16 text-white sm:py-20" data-scroll-section>
        <AmbientBackdrop variant="dashboard" className="opacity-70" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <ShieldCheck className="size-6 text-blue-300" aria-hidden="true" />
            <h2 className="mt-6 max-w-xl text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Yang dicatat seperlunya. Yang privat tetap terlindungi.</h2>
          </div>
          <div className="divide-y divide-white/15 border-y border-white/15">
            <div className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr]">
              <p className="text-sm font-medium text-blue-300">Di Rintara</p>
              <p className="leading-7 text-slate-300">Ketentuan, kehadiran, penyelesaian, dan Bukti Kerja.</p>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr]">
              <p className="text-sm font-medium text-blue-300">Di luar Rintara</p>
              <p className="leading-7 text-slate-300">Pembayaran dilakukan langsung sesuai cara dan waktu yang telah dicatat.</p>
            </div>
          </div>
          <div className="lg:col-start-2">
            <Button className="theme-static-light h-12 rounded-full bg-white px-6 text-slate-950 shadow-none hover:bg-slate-100" asChild>
              <Link href="/jobs">Temukan pekerjaan <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
