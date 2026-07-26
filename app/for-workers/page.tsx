import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  FileCheck2,
  LockKeyhole,
  MapPin,
  Search,
} from "lucide-react";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Untuk pekerja",
  description:
    "Temukan pekerjaan lokal dengan ketentuan jelas dan bangun Bukti Kerja melalui Rintara.",
};

const decisionPoints = [
  {
    icon: BriefcaseBusiness,
    label: "Tugas dan alat",
    detail: "Ruang lingkup kerja dan perlengkapan dijelaskan sebelum melamar.",
  },
  {
    icon: CalendarClock,
    label: "Jadwal dan durasi",
    detail:
      "Waktu mulai, perkiraan durasi, dan tenggat lamaran dapat dibandingkan.",
  },
  {
    icon: MapPin,
    label: "Area umum",
    detail: "Wilayah kerja terlihat tanpa membuka alamat lengkap ke publik.",
  },
] as const;

const workerJourney = [
  {
    title: "Cari dan bandingkan",
    description:
      "Saring pekerjaan berdasarkan tugas, kategori, wilayah, upah, dan jenis kesempatan.",
  },
  {
    title: "Kirim satu catatan",
    description:
      "Jelaskan kesiapanmu secara singkat. Lamaran tidak digunakan untuk menawar upah.",
  },
  {
    title: "Konfirmasi dan bekerja",
    description:
      "Setelah diterima, konfirmasi Mini Agreement yang sama lalu ikuti proses check-in dan check-out.",
  },
  {
    title: "Bawa hasilnya",
    description:
      "Penyelesaian yang diverifikasi diterbitkan sebagai Bukti Kerja di Paspor Rintara.",
  },
] as const;

export default function ForWorkersPage() {
  return (
    <PublicShell>
      <template
        data-rintara-direction
        dangerouslySetInnerHTML={{
          __html:
            "<!-- seed: a29a8bd0. THESIS: Worker guidance should turn uncertainty into one clear route to real jobs. OWN-WORLD: Forest typography, a Chalk decision ledger, compact icons, and an editorial numbered journey. STORY: compare terms, apply without bidding, confirm work, then receive system-issued proof. FIRST VIEWPORT: a direct proposition and job-search action sit beside the information visible before applying. FORM: an asymmetrical public guide, not a generic feature-card grid or invented marketplace claim. -->",
        }}
      />

      <header className="bg-[#edf3ee] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="mx-auto grid max-w-[80rem] overflow-hidden rounded-[1.5rem] bg-[#1b512d] text-white lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-9 sm:py-12 lg:px-12 lg:py-16">
            <p className="text-sm font-semibold text-[#bfe8c9]">
              Untuk pekerja
            </p>
            <h1 className="mt-4 max-w-[13ch] text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-5xl">
              Kerja yang jelas sebelum kamu melamar
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/75">
              Bandingkan tugas, upah, waktu, dan area umum. Saat sudah cocok,
              kirim satu catatan singkat tanpa menawar ketentuan pekerjaan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                className="bg-[#def4c6] text-[#1b512d] hover:bg-[#cfe9b4]"
                asChild
              >
                <Link href="/jobs">
                  Cari pekerjaan
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/25 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                asChild
              >
                <Link href="/how-it-works">Pelajari alurnya</Link>
              </Button>
            </div>
          </div>

          <aside className="bg-[#def4c6] p-6 text-[#163f27] sm:p-8 lg:p-10">
            <Search className="size-6" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">
              Nilai pekerjaan dari informasinya
            </h2>
            <ul className="mt-7 grid gap-6">
              {decisionPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <li
                    key={point.label}
                    className="grid grid-cols-[2.75rem_1fr] items-center gap-4"
                  >
                    <span className="grid size-11 place-items-center rounded-lg bg-white/65">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{point.label}</h3>
                      <p className="mt-1 text-base leading-6 text-[#1b512d]/75">
                        {point.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </header>

      <section
        id="alur-bukti-kerja"
        className="scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-18"
      >
        <div className="mx-auto grid max-w-[80rem] gap-9 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <FileCheck2 className="size-6 text-primary" aria-hidden="true" />
            <h2 className="mt-5 max-w-md text-3xl font-semibold tracking-[-0.025em]">
              Dari lamaran menjadi Bukti Kerja
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
              Setiap langkah meneruskan konteks pekerjaan yang sama, sehingga
              kamu tidak perlu menebak apa yang terjadi setelah diterima.
            </p>
          </div>

          <ol className="grid">
            {workerJourney.map((step, index) => (
              <li
                key={step.title}
                className="grid grid-cols-[3rem_1fr] gap-4 py-6 first:pt-0 last:pb-0 sm:grid-cols-[4rem_1fr]"
              >
                <span className="grid size-11 place-items-center rounded-lg bg-[#e5f1e8] text-sm font-semibold text-[#1b512d]">
                  {index + 1}
                </span>
                <div className="pb-6 not-last:border-b not-last:border-border">
                  <h3 className="text-xl font-semibold tracking-[-0.015em]">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#f1f6e6] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-[80rem] gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] lg:items-center">
          <div>
            <span className="grid size-11 place-items-center rounded-lg bg-[#def4c6] text-[#1b512d]">
              <BadgeCheck className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.025em]">
              Baru di satu kategori bukan berarti mulai tanpa nilai
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Kesempatan Pertama tetap pekerjaan berbayar. Rintara menghitung
              kelayakan untuk kategori pekerjaan tersebut dari Bukti Kerja
              terverifikasi, bukan dari pernyataan yang kamu pilih sendiri.
            </p>
            <Button className="mt-7" asChild>
              <Link href="/jobs?opportunity=first">
                Lihat Kesempatan Pertama
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <aside className="rounded-xl bg-white p-6 sm:p-7">
            <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Alamat tetap privat</h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              Daftar pekerjaan hanya menampilkan area umum. Alamat lengkap
              tersedia kepada pekerja setelah satu lamaran diterima dan masuk ke
              konteks kesepakatan.
            </p>
          </aside>
        </div>
      </section>
    </PublicShell>
  );
}
