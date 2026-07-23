import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const employerSummary = [
  {
    label: "Pekerjaan aktif",
    value: "2",
    detail: "1 menerima lamaran",
    icon: BriefcaseBusiness,
  },
  {
    label: "Pelamar baru",
    value: "2",
    detail: "Menunggu peninjauan",
    icon: UsersRound,
  },
  {
    label: "Kredit aktif",
    value: "2",
    detail: "Batas aktif 3 kredit",
    icon: TicketCheck,
  },
] as const;

const publishedJobJourney = [
  { label: "Pekerjaan diterbitkan", detail: "Ketentuan terlihat oleh pekerja", complete: true },
  { label: "Pelamar masuk", detail: "2 orang menunggu peninjauan", complete: true },
  { label: "Pilih satu pekerja", detail: "Langkah berikutnya", complete: false },
  { label: "Konfirmasi kesepakatan", detail: "Tersedia setelah pekerja dipilih", complete: false },
] as const;

export default async function EmployerDashboardPage() {
  const account = await requireDashboardPageRole(
    "employer",
    "/employer/dashboard",
  );

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Ruang kerja"
        title={account.displayName}
        description="Bawa setiap pekerjaan dari ketentuan yang jelas menuju Bukti Kerja yang terverifikasi."
        action={
          <Button className="h-11 rounded-full px-5" asChild>
            <Link href="/employer/jobs/new">Pasang pekerjaan</Link>
          </Button>
        }
      />

      <section
        className="overflow-hidden border-y border-border/70 bg-card/45 backdrop-blur-sm"
        aria-label="Ringkasan pekerjaan"
      >
        <dl className="grid grid-cols-3">
          {employerSummary.map((item, index) => {
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

      <section className="grid gap-5 lg:grid-cols-[1.38fr_0.62fr]" aria-labelledby="employer-priority">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#0a1c3f] px-6 py-8 text-white shadow-[0_28px_75px_-42px_rgb(15_42_104/0.85)] sm:px-9 sm:py-10 lg:px-11 lg:py-12">
          <div className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full bg-blue-500/15 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-blue-200">
              <span className="soft-pulse size-2 rounded-full bg-amber-400" aria-hidden="true" />
              Prioritas hari ini
            </p>
            <h2
              id="employer-priority"
              className="mt-7 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl"
            >
              Dua pelamar siap kamu tinjau.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-blue-100/75">
              Bandingkan catatan lamaran dan riwayat Bukti Kerja sebelum menerima tepat satu pekerja.
            </p>
            <Button
              className="theme-static-light mt-8 h-12 rounded-full bg-white px-5 text-slate-950 shadow-none hover:bg-blue-50"
              asChild
            >
              <Link href="/employer/jobs">
                Tinjau pelamar <ArrowRight aria-hidden="true" />
              </Link>
            </Button>

            <div className="mt-10 border-t border-white/15 pt-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-200/65">
                    Menunggu verifikasi
                  </p>
                  <h3 className="mt-2 font-semibold">Bantuan Bersih Ruang Pertemuan</h3>
                  <p className="mt-1 text-sm text-blue-100/65">Pekerja sudah menyelesaikan check-out.</p>
                </div>
                <Button
                  variant="ghost"
                  className="h-11 rounded-full border border-white/15 text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/employer/work/sesi-pekerjaan">Verifikasi pekerjaan</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-border/70 bg-card/58 px-6 py-8 backdrop-blur-sm sm:px-8 lg:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Pekerjaan terbit</p>
          <h2 className="mt-3 text-xl font-semibold leading-snug">Kru Acara Akhir Pekan</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sukajadi, Bandung · 30 Juli 2026</p>

          <ol className="mt-8">
            {publishedJobJourney.map((step, index) => (
              <li key={step.label} className="relative grid grid-cols-[1.25rem_1fr] gap-4 pb-7 last:pb-0">
                {index < publishedJobJourney.length - 1 ? (
                  <span className="absolute bottom-0 left-[0.34rem] top-3 w-px bg-border" aria-hidden="true" />
                ) : null}
                <span
                  className={`relative mt-1 size-3 rounded-full border-2 border-card ${
                    step.complete ? "bg-primary" : "bg-muted-foreground/35"
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className={`font-medium leading-snug ${step.complete ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <Button variant="ghost" className="mt-8 h-11 w-full justify-between rounded-full px-3" asChild>
            <Link href="/employer/jobs">
              Kelola pekerjaan <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </aside>
      </section>

      <section
        className="relative overflow-hidden border-y border-opportunity/25 bg-opportunity-soft/65 px-5 py-7 sm:px-8"
        aria-labelledby="credit-title"
      >
        <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-[-0.06em] text-opportunity">2</span>
            <span className="text-sm font-medium text-opportunity-foreground">kredit aktif</span>
          </div>
          <div className="md:border-l md:border-opportunity/25 md:pl-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-opportunity">Kredit Kesempatan</p>
            <h2 id="credit-title" className="mt-2 text-xl font-semibold tracking-[-0.025em]">
              Dorong satu pekerjaan terbit selama 24 jam.
            </h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              Setiap kredit hanya dapat digunakan satu kali dan tidak memiliki nilai tunai.
            </p>
          </div>
          <Button variant="outline" className="h-11 rounded-full bg-card/80" asChild>
            <Link href="/employer/opportunity-credits">
              Kelola kredit <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
