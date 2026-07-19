import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  FileCheck2,
  Handshake,
  MapPin,
  ReceiptText,
  ShieldCheck,
  UserRoundSearch,
} from "lucide-react";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { JobCard } from "@/components/rintara/job-card";
import { LiveIndicator } from "@/components/rintara/motion-primitives";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";
import { demoJobs } from "@/lib/demo-data";

const steps = [
  { icon: UserRoundSearch, number: "01", title: "Temukan yang jelas", text: "Tugas, upah, jadwal, dan area terlihat sebelum pekerja melamar." },
  { icon: Handshake, number: "02", title: "Sepakati bersama", text: "Satu pekerja diterima dan ketentuannya menjadi kesepakatan tetap." },
  { icon: FileCheck2, number: "03", title: "Bawa pulang bukti", text: "Pekerjaan yang selesai dan diverifikasi masuk ke Paspor Rintara." },
] as const;

const safeguards = [
  { icon: ShieldCheck, title: "Privasi sejak awal", text: "Alamat lengkap hanya dibuka kepada pekerja yang diterima." },
  { icon: ReceiptText, title: "Pembayaran tetap langsung", text: "Rintara mencatat ketentuan tanpa menyimpan rekening atau kartu." },
  { icon: BadgeCheck, title: "Bukti setelah verifikasi", text: "Riwayat kerja diterbitkan setelah penyelesaian dikonfirmasi." },
] as const;

export default function Home() {
  const featuredJob = demoJobs[0];

  return (
    <PublicShell>
      <section className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden border-b border-border/70">
        <AmbientBackdrop variant="hero" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--background)_88%,transparent)_0%,color-mix(in_srgb,var(--background)_74%,transparent)_30%,color-mix(in_srgb,var(--background)_34%,transparent)_56%,transparent_78%)] dark:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--background)_90%,transparent)_0%,color-mix(in_srgb,var(--background)_76%,transparent)_30%,color-mix(in_srgb,var(--background)_38%,transparent)_55%,transparent_78%)]" aria-hidden="true" />

        <div className="relative mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-16">
          <div className="z-10 lg:col-span-7">
            <p className="hero-eyebrow inline-flex items-center overflow-hidden rounded-full border border-opportunity/25 bg-opportunity-soft/78 px-4 py-2 text-sm font-medium text-opportunity shadow-[0_10px_30px_-22px_rgb(180_83_9/0.65)] backdrop-blur-xl">
              <span className="relative z-[1]">Kerja pertama tetap pekerjaan yang bernilai</span>
            </p>
            <h1 className="mt-8 max-w-4xl text-balance text-[3.3rem] font-semibold leading-[0.98] tracking-[-0.065em] text-foreground sm:text-[4.6rem] lg:text-[5.6rem]">
              Kesempatan kecil.<br />Jejak yang <span className="font-serif font-normal italic text-primary">berarti.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
              Temukan pekerjaan lokal dengan ketentuan terbuka, jalani langkahnya dengan tenang, lalu bangun pengalaman yang dapat dipercaya.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-13 rounded-full px-7 text-base [&_svg]:group-hover/button:translate-x-1" asChild>
                <Link href="/jobs">Temukan pekerjaan <ArrowRight aria-hidden="true" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-13 rounded-full bg-card/60 px-7 text-base backdrop-blur-xl" asChild>
                <Link href="/register">Pasang kesempatan</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-success" aria-hidden="true" />Upah terlihat sejak awal</span>
              <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
              <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-success" aria-hidden="true" />Alamat lengkap tetap privat</span>
            </div>
          </div>

          <div className="relative flex flex-col justify-center py-6 lg:col-span-5" aria-label="Ringkasan perjalanan pekerjaan">
            <div className="hero-artifact-slow z-20 mr-2 ml-auto flex w-fit items-center gap-3 rounded-full border border-white/45 bg-card/76 px-4 py-3 text-sm shadow-[0_18px_50px_-28px_rgb(15_23_42/0.65)] backdrop-blur-2xl dark:border-white/12">
              <LiveIndicator label="Kesempatan dibuka" />
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <span className="text-muted-foreground">{featuredJob.deadline}</span>
            </div>

            <article className="hero-card-float relative z-10 mt-8 overflow-hidden rounded-[2rem] border border-white/60 bg-card/82 p-6 shadow-[0_34px_90px_-48px_rgb(15_23_42/0.72)] backdrop-blur-2xl dark:border-white/12 sm:mx-5 sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-medium text-primary">{featuredJob.category}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">{featuredJob.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{featuredJob.employer}</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-opportunity/25 bg-opportunity-soft text-opportunity"><BriefcaseBusiness className="size-5" aria-hidden="true" /></span>
              </div>
              <p className="mt-7 text-xs font-medium text-muted-foreground">UPAH TETAP</p>
              <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{featuredJob.wage}</p>
              <div className="mt-7 grid gap-4 border-y border-border/75 py-5 text-sm sm:grid-cols-2">
                <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4 text-primary" aria-hidden="true" />{featuredJob.publicLocation}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4 text-primary" aria-hidden="true" />{featuredJob.date}</p>
              </div>
              <Button variant="ghost" className="mt-4 h-11 w-full justify-between rounded-full px-1 hover:bg-transparent" asChild>
                <Link href={`/jobs/${featuredJob.id}`}>Lihat ketentuan lengkap <ArrowUpRight aria-hidden="true" /></Link>
              </Button>
            </article>

            <div className="relative z-20 mt-3 grid grid-cols-2 gap-3 sm:mx-1" data-hero-proof-row>
              <div className="hero-artifact-delayed flex min-w-0 items-center gap-3 rounded-2xl border border-white/50 bg-card/80 p-3.5 shadow-[0_24px_60px_-38px_rgb(15_23_42/0.75)] backdrop-blur-2xl dark:border-white/10 sm:p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Handshake className="size-4" aria-hidden="true" /></span>
                <div className="min-w-0"><p className="text-[0.68rem] font-medium text-muted-foreground sm:text-xs">KESEPAKATAN</p><p className="mt-1 text-xs font-semibold leading-5 sm:text-sm">Tugas dan upah terkunci setelah diterima.</p></div>
              </div>
              <div className="hero-artifact-late flex min-w-0 items-center gap-3 rounded-2xl border border-success/25 bg-success-soft/92 p-3.5 shadow-[0_20px_55px_-34px_rgb(15_23_42/0.7)] backdrop-blur-xl sm:p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success text-success-foreground"><FileCheck2 className="size-4" aria-hidden="true" /></span>
                <div className="min-w-0"><p className="text-[0.68rem] text-muted-foreground sm:text-xs">PASPOR RINTARA</p><p className="mt-1 text-xs font-semibold leading-5 sm:text-sm">Bukti Kerja terverifikasi</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 sm:py-28" data-scroll-section>
        <AmbientBackdrop variant="page" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div><p className="text-sm font-medium text-primary">Alur kerja Rintara</p><h2 className="mt-3 text-balance text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Tidak ada langkah yang disembunyikan.</h2></div>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground lg:justify-self-end">Setiap tahap menjawab apa yang perlu dilakukan, siapa yang perlu bertindak, dan bukti apa yang mengikuti setelahnya.</p>
          </div>
          <ol className="mt-14 grid border-y border-border md:grid-cols-3" data-reveal-list>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="group relative px-1 py-9 md:border-l md:px-7 md:first:border-l-0 lg:px-9">
                  <div className="flex items-center justify-between"><span className="font-mono text-sm text-muted-foreground">{step.number}</span><Icon className="size-5 text-primary transition-transform duration-500 group-hover:translate-x-0.5" aria-hidden="true" /></div>
                  <h3 className="mt-10 text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
                  <p className="mt-3 text-base leading-7 text-muted-foreground">{step.text}</p>
                  {index < steps.length - 1 ? <span className="absolute -right-1 top-1/2 hidden size-2 rounded-full bg-primary md:block" aria-hidden="true" /> : null}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="border-y border-border bg-card/55 py-20 sm:py-24" data-scroll-section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-medium text-primary">Pekerjaan terbaru</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">Mulai dari yang terbuka.</h2></div>
            <Button variant="link" className="w-fit px-0" asChild><Link href="/jobs">Lihat semua pekerjaan <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2" data-reveal-list>{demoJobs.map((job, index) => <JobCard key={job.id} job={job} featured={index === 0} />)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#09111f] py-20 text-white sm:py-28" data-scroll-section>
        <AmbientBackdrop variant="dashboard" className="opacity-80" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-medium text-blue-300">Kepercayaan dibangun dari detail</p>
            <h2 className="mt-4 max-w-xl text-balance text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Yang privat tetap privat. Yang disepakati tetap jelas.</h2>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button className="theme-static-light h-12 rounded-full bg-white px-6 text-slate-950 shadow-none hover:bg-slate-100" asChild><Link href="/register">Mulai sebagai pekerja</Link></Button>
              <Button className="h-12 rounded-full border border-white/20 bg-white/5 px-6 text-white shadow-none hover:bg-white/10" asChild><Link href="/register">Mulai sebagai pemberi kerja</Link></Button>
            </div>
          </div>
          <div className="divide-y divide-white/12 border-y border-white/12" data-reveal-list>
            {safeguards.map((item) => {
              const Icon = item.icon;
              return <div key={item.title} className="grid gap-3 py-7 sm:grid-cols-[3rem_1fr] sm:items-start"><Icon className="mt-1 size-5 text-blue-300" aria-hidden="true" /><div><h3 className="text-lg font-semibold">{item.title}</h3><p className="mt-2 text-base leading-7 text-slate-300">{item.text}</p></div></div>;
            })}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
