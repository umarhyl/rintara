import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileCheck2,
  Send,
} from "lucide-react";
import { JobCard } from "@/components/rintara/job-card";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { demoApplications, demoJobs } from "@/lib/demo-data";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const workerSummary = [
  {
    label: "Lamaran aktif",
    value: "2",
    detail: "1 menunggu keputusan",
    icon: Send,
  },
  {
    label: "Kesepakatan",
    value: "1",
    detail: "Perlu dikonfirmasi",
    icon: BriefcaseBusiness,
  },
  {
    label: "Bukti Kerja",
    value: "1",
    detail: "Sudah terverifikasi",
    icon: FileCheck2,
  },
] as const;

export default async function WorkerDashboardPage() {
  const account = await requireDashboardPageRole(
    "worker",
    "/worker/dashboard",
  );

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Jejak kerjamu"
        title={`Halo, ${account.displayName}`}
        description="Selesaikan langkah terdekat, lalu lanjutkan membangun pengalaman yang bisa dipercaya."
        action={
          <Button className="h-11 rounded-full px-5" asChild>
            <Link href="/jobs">
              Cari pekerjaan <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section
        className="overflow-hidden border-y border-border/70 bg-card/45 backdrop-blur-sm"
        aria-label="Ringkasan akun"
      >
        <dl className="grid grid-cols-3">
          {workerSummary.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`relative min-h-28 px-3 py-5 sm:min-h-32 sm:px-6 sm:py-6 ${
                  index > 0 ? "border-l border-border/70" : ""
                }`}
              >
                <dt className="pr-7 text-xs font-medium leading-5 text-muted-foreground sm:text-sm">{item.label}</dt>
                <dd className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:mt-3 sm:text-4xl">{item.value}</dd>
                <dd className="sr-only text-muted-foreground sm:not-sr-only sm:mt-2 sm:block sm:text-xs">
                  {item.detail}
                </dd>
                <Icon className="absolute right-3 top-5 hidden size-5 text-primary/70 sm:right-6 sm:top-6 sm:block" aria-hidden="true" />
              </div>
            );
          })}
        </dl>
      </section>

      <section
        className="relative isolate overflow-hidden rounded-[2rem] bg-[#0a1c3f] text-white shadow-[0_28px_75px_-42px_rgb(15_42_104/0.85)]"
        aria-labelledby="worker-next-action"
      >
        <div className="pointer-events-none absolute -left-28 -top-36 size-96 rounded-full bg-blue-500/15 blur-3xl" aria-hidden="true" />
        <div className="relative grid lg:grid-cols-[1.35fr_0.65fr]">
          <div className="px-6 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-blue-200">
              <span className="soft-pulse size-2 rounded-full bg-amber-400" aria-hidden="true" />
              Langkah berikutnya
            </p>
            <h2
              id="worker-next-action"
              className="mt-7 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl"
            >
              Konfirmasi kesepakatan, lalu jadwalmu siap.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-blue-100/75">
              Baca kembali tugas, jadwal, upah, serta ketentuan pembayarannya sebelum
              menyetujui.
            </p>

            <Button
              className="theme-static-light mt-8 h-12 rounded-full bg-white px-5 text-slate-950 shadow-none hover:bg-blue-50"
              asChild
            >
              <Link href="/worker/agreements/kesepakatan-kru-acara">
                Tinjau kesepakatan <ArrowRight aria-hidden="true" />
              </Link>
            </Button>

            <dl className="mt-10 grid gap-5 border-t border-white/15 pt-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.13em] text-blue-200/65">Pekerjaan</dt>
                <dd className="mt-2 text-sm font-medium">Kru Acara Akhir Pekan</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.13em] text-blue-200/65">Jadwal</dt>
                <dd className="mt-2 text-sm font-medium">30 Juli · 09.00 WIB</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.13em] text-blue-200/65">Upah tetap</dt>
                <dd className="mt-2 text-sm font-medium">Rp200.000</dd>
              </div>
            </dl>
          </div>

          <aside className="border-t border-white/10 bg-white/[0.055] px-6 py-8 backdrop-blur-sm sm:px-9 lg:border-l lg:border-t-0 lg:py-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/65">
                  Kabar terbaru
                </p>
                <h2 className="mt-2 text-xl font-semibold">Lamaranmu</h2>
              </div>
              <span className="text-sm text-blue-100/60">2 aktif</span>
            </div>

            <ol className="mt-8">
              {demoApplications.map((application, index) => (
                <li key={application.id} className="relative grid grid-cols-[1.25rem_1fr] gap-4 pb-7 last:pb-0">
                  {index < demoApplications.length - 1 ? (
                    <span className="absolute bottom-0 left-[0.34rem] top-3 w-px bg-white/15" aria-hidden="true" />
                  ) : null}
                  <span
                    className={`relative mt-1 size-3 rounded-full border-2 border-[#0f2a59] ${
                      application.status === "accepted" ? "bg-emerald-400" : "bg-blue-300"
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-medium text-blue-200/70">{application.statusLabel}</p>
                    <p className="mt-1 font-semibold leading-snug">{application.jobTitle}</p>
                    <p className="mt-1 text-sm text-blue-100/60">{application.employer}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Button
              variant="ghost"
              className="mt-8 h-11 w-full justify-between rounded-full border border-white/10 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/worker/applications">
                Semua lamaran <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </aside>
        </div>
      </section>

      <section aria-labelledby="worker-opportunities">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Lanjutkan jejakmu</p>
            <h2 id="worker-opportunities" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
              Kesempatan di dekatmu
            </h2>
            <p className="mt-2 text-muted-foreground">Pilih pekerjaan dengan tugas dan ketentuan yang jelas.</p>
          </div>
          <Button variant="link" className="w-fit px-0" asChild>
            <Link href="/jobs">
              Lihat semua <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {demoJobs.map((job, index) => (
            <JobCard key={job.id} job={job} featured={index === 0} />
          ))}
        </div>
      </section>
    </div>
  );
}
