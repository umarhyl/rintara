import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  FileSignature,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { EmployerPublishAction } from "@/components/rintara/employer-publish-action";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Untuk pemberi kerja",
  description:
    "Terbitkan pekerjaan dengan ketentuan jelas, terima satu pekerja, dan verifikasi penyelesaian di Rintara.",
};

const employerJourney = [
  {
    icon: BriefcaseBusiness,
    title: "Terbitkan ketentuan",
    description:
      "Tulis tugas, jadwal, durasi, area umum, upah, alat, dan tenggat lamaran.",
  },
  {
    icon: UserCheck,
    title: "Terima satu pekerja",
    description:
      "Tinjau pelamar yang masuk lalu terima tepat satu pekerja untuk satu pekerjaan.",
  },
  {
    icon: FileSignature,
    title: "Konfirmasi kesepakatan",
    description:
      "Kedua pihak mengonfirmasi snapshot Mini Agreement yang sama sebelum bekerja.",
  },
  {
    icon: BadgeCheck,
    title: "Verifikasi penyelesaian",
    description:
      "Setelah pekerja check-out, verifikasi hasil agar Bukti Kerja dapat diterbitkan.",
  },
] as const;

export default function ForEmployersPage() {
  return (
    <PublicShell>
      <template
        data-rintara-direction
        dangerouslySetInnerHTML={{
          __html:
            "<!-- seed: a29a8bd0. THESIS: Employer guidance should make publishing and responsibility feel equally concrete. OWN-WORLD: a quiet white editorial field meets a Deep Forest operating ledger, with compact numbered steps and restrained Chalk emphasis. STORY: define terms, accept one worker, confirm one agreement, verify completion, then understand the conditional reward. FIRST VIEWPORT: the publishing proposition and role-aware action face a concise record of what Rintara connects. FORM: an operational public guide with asymmetrical typography, not a pricing page, talent directory, or fake dashboard. -->",
        }}
      />

      <header className="bg-[#edf3ee] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="mx-auto grid max-w-[80rem] overflow-hidden rounded-[1.5rem] bg-white lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-9 sm:py-12 lg:px-12 lg:py-16">
            <p className="text-sm font-semibold text-primary">
              Untuk pemberi kerja
            </p>
            <h1 className="mt-4 max-w-[14ch] text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-5xl">
              Buka pekerjaan dengan ketentuan yang jelas
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Susun kebutuhan kerja sekali, tinjau lamaran dalam konteks yang
              sama, lalu selesaikan alur bersama satu pekerja.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <EmployerPublishAction />
              <Button variant="ghost" asChild>
                <Link href="/how-it-works">
                  Lihat cara kerja
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <aside className="bg-[#1b512d] p-6 text-white sm:p-8 lg:p-10">
            <div className="flex items-center gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-[#73e2a7]">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                Satu konteks sampai selesai
              </h2>
            </div>
            <dl className="mt-7 grid gap-5">
              <div>
                <dt className="text-sm font-semibold text-[#bfe8c9]">
                  Sebelum diterima
                </dt>
                <dd className="mt-1 text-base leading-7 text-white/72">
                  Pelamar membandingkan tugas, area umum, jadwal, durasi, upah,
                  dan ketentuan kerja yang dipublikasikan.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-[#bfe8c9]">
                  Setelah diterima
                </dt>
                <dd className="mt-1 text-base leading-7 text-white/72">
                  Alamat lengkap dibuka hanya dalam konteks pihak yang
                  berwenang, lalu ketentuan masuk ke Mini Agreement.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-[#bfe8c9]">
                  Setelah selesai
                </dt>
                <dd className="mt-1 text-base leading-7 text-white/72">
                  Verifikasi penyelesaian menghubungkan pekerjaan dengan Bukti
                  Kerja yang diterbitkan sistem.
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </header>

      <section
        id="alur-pekerjaan"
        className="scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-18"
      >
        <div className="mx-auto max-w-[80rem]">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">
              Satu pekerjaan, satu pekerja, satu alur
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Setiap tahap meneruskan ketentuan yang sudah disepakati, bukan
              membuat proses baru yang terpisah.
            </p>
          </div>

          <ol className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {employerJourney.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className={
                    index === 0
                      ? "flex min-h-64 flex-col bg-[#e5f1e8] p-6"
                      : index === 3
                        ? "flex min-h-64 flex-col bg-[#def4c6] p-6"
                        : "flex min-h-64 flex-col bg-[#f4f7f4] p-6"
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-lg bg-white text-[#1b512d]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="mt-auto pt-10">
                    <h3 className="text-xl font-semibold tracking-[-0.015em]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-base leading-7 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section
        id="ketentuan-privasi"
        className="scroll-mt-24 bg-[#f4f7f4] px-4 py-14 sm:px-6 lg:px-8 lg:py-18"
      >
        <div className="mx-auto grid max-w-[80rem] gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-14">
          <div>
            <div className="flex items-center gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#e5f1e8] text-[#1b512d]">
                <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                Publikasikan yang perlu dibandingkan, lindungi yang tetap privat
              </h2>
            </div>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Informasi publik membantu pekerja mengambil keputusan. Alamat
              lengkap disimpan terpisah dan tidak masuk ke daftar pekerjaan.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="bg-white p-5">
                <h3 className="font-semibold">Terlihat sebelum melamar</h3>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  Judul, tugas, kategori, area umum, waktu, durasi, upah, alat,
                  serta cara dan waktu pembayaran.
                </p>
              </div>
              <div className="bg-[#e5f1e8] p-5">
                <h3 className="font-semibold">Dibuka setelah diterima</h3>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  Alamat lengkap hanya tersedia kepada pemilik pekerjaan dan
                  pekerja yang diterima melalui konteks kesepakatan.
                </p>
              </div>
            </div>
          </div>

          <aside
            id="kredit-kesempatan"
            className="h-fit scroll-mt-24 rounded-xl bg-[#1b512d] p-6 text-white sm:p-8"
          >
            <div className="flex items-center gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-[#73e2a7]">
                <CalendarCheck2
                  className="size-5"
                  aria-hidden="true"
                />
              </span>
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                Penghargaan mengikuti hasil terverifikasi
              </h2>
            </div>
            <p className="mt-3 text-base leading-7 text-white/72">
              Penyelesaian Kesempatan Pertama yang memenuhi syarat dapat
              menerbitkan satu Kredit Kesempatan. Kredit bukan uang dan dapat
              digunakan untuk meningkatkan satu pekerjaan terbit selama 24 jam.
            </p>
            <div className="mt-6 bg-white/8 p-5">
              <h3 className="font-semibold text-[#def4c6]">
                Pembayaran tetap langsung
              </h3>
              <p className="mt-2 text-base leading-7 text-white/72">
                Rintara mencatat cara dan waktu pembayaran dalam ketentuan,
                tetapi pembayaran dilakukan langsung di luar platform.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </PublicShell>
  );
}
