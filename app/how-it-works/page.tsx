import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Cara kerja" };

const stages = [
  {
    title: "Temukan pekerjaan",
    steps: [
      "Pemberi kerja menulis tugas, upah, jadwal, area umum, alat, dan cara pembayaran.",
      "Pekerja membandingkan ketentuan lalu mengirim catatan singkat tanpa menawar upah.",
    ],
  },
  {
    title: "Jalankan kesepakatan",
    steps: [
      "Pemberi kerja menerima tepat satu pekerja.",
      "Kedua pihak mengonfirmasi Mini Agreement yang sama.",
      "Pekerja check-in, menyelesaikan tugas, lalu check-out.",
      "Pemberi kerja memverifikasi penyelesaian.",
    ],
  },
  {
    title: "Terbitkan Bukti Kerja",
    steps: [
      "Pekerjaan yang selesai masuk ke Paspor Rintara sebagai Bukti Kerja.",
      "Pemberi kerja yang memenuhi syarat dapat menerima Kredit Kesempatan.",
    ],
  },
] as const;

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <header className="bg-[#edf3ee]">
        <div className="mx-auto flex max-w-[80rem] flex-col gap-7 px-4 py-11 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8 lg:py-14">
          <div>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Cara kerja Rintara
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Satu alur dari pekerjaan diterbitkan sampai Bukti Kerja masuk ke Paspor Rintara.
            </p>
          </div>
          <Button asChild>
            <Link href="/jobs">
              Cari pekerjaan
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[80rem] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8 lg:py-16">
        <ol className="grid gap-5">
          {stages.map((stage, index) => (
            <li
              key={stage.title}
              className={
                index === 0
                  ? "grid gap-6 rounded-xl bg-white p-6 shadow-[0_20px_55px_-48px_rgb(27_81_45/0.7)] sm:grid-cols-[13rem_1fr] sm:p-8"
                  : index === 1
                    ? "grid gap-6 rounded-xl bg-[#e5f1e8] p-6 sm:grid-cols-[13rem_1fr] sm:p-8"
                    : "grid gap-6 rounded-xl bg-[#def4c6] p-6 sm:grid-cols-[13rem_1fr] sm:p-8"
              }
            >
              <div className="flex items-center gap-3 sm:items-start">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h2 className="text-lg font-semibold leading-6">
                  {stage.title}
                </h2>
              </div>
              <ul className="grid gap-4">
                {stage.steps.map((step) => (
                  <li
                    key={step}
                    className="grid grid-cols-[1.25rem_1fr] gap-3 text-base leading-6 text-muted-foreground"
                  >
                    <Check
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <aside className="h-fit rounded-xl bg-[#eef4ef] p-6 lg:sticky lg:top-24">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-semibold">Batas data Rintara</h2>
          <dl className="mt-5 grid gap-3">
            <div className="rounded-xl bg-white/75 p-4">
              <dt className="text-base font-semibold">Dicatat di Rintara</dt>
              <dd className="mt-1 text-base leading-6 text-muted-foreground">
                Ketentuan, kehadiran, penyelesaian, dan Bukti Kerja.
              </dd>
            </div>
            <div className="rounded-xl bg-white/75 p-4">
              <dt className="text-base font-semibold">Dilakukan di luar Rintara</dt>
              <dd className="mt-1 text-base leading-6 text-muted-foreground">
                Pembayaran langsung sesuai cara dan waktu yang telah disepakati.
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-base leading-6 text-muted-foreground">
            Rintara tidak menyimpan rekening, kartu, atau lokasi secara terus-menerus.
          </p>
        </aside>
      </div>
    </PublicShell>
  );
}
