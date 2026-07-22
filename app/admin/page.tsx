import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  ShieldAlert,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const metrics = [
  {
    label: "Laporan terbuka",
    value: "3",
    detail: "1 perlu diprioritaskan",
    icon: ShieldAlert,
  },
  {
    label: "Pekerjaan terbit",
    value: "18",
    detail: "Sedang ditayangkan",
    icon: BriefcaseBusiness,
  },
  {
    label: "Akun aktif",
    value: "42",
    detail: "30 pekerja · 12 pemberi kerja",
    icon: UsersRound,
  },
  {
    label: "Jejak hari ini",
    value: "27",
    detail: "Aksi penting tercatat",
    icon: Activity,
  },
];

const reports = [
  {
    id: "RPT-1042",
    reason: "Ketentuan pekerjaan tidak sesuai",
    target: "Kru Acara Akhir Pekan",
    status: "Terbuka",
    tone: "warning" as const,
  },
  {
    id: "RPT-1041",
    reason: "Masalah kehadiran",
    target: "Bantuan Bersih Ruang Pertemuan",
    status: "Ditinjau",
    tone: "info" as const,
  },
];

export default async function AdminPage() {
  await requireDashboardPageRole("admin", "/admin");

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Administrasi"
        title="Ringkasan operasional"
        description="Pantau antrean moderasi dan kesehatan alur pekerjaan tanpa membuka data privat yang tidak diperlukan."
        action={
          <Button asChild className="rounded-full">
            <Link href="/admin/reports">
              Tinjau laporan
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section
        aria-label="Ringkasan hari ini"
        className="grid overflow-hidden rounded-[1.5rem] border border-border/75 bg-border/70 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className="group relative min-h-40 bg-card/90 p-5 transition-colors duration-500 hover:bg-card sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <Icon className="size-4.5 text-primary/70" aria-hidden="true" />
              </div>
              <p className="mt-7 text-[2.6rem] font-semibold leading-none tracking-[-0.06em]">
                {metric.value}
              </p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
              <span
                className="absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-primary/60 transition-transform duration-700 group-hover:scale-x-100"
                aria-hidden="true"
              />
            </article>
          );
        })}
      </section>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <section className="overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-[0_24px_70px_-45px_rgb(15_23_42/0.9)]">
          <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
                Antrean prioritas
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                Laporan perlu ditinjau
              </h2>
              <p className="mt-2 max-w-xl text-base leading-7 text-slate-400">
                Laporan aktif menjeda penyelesaian pekerjaan terkait hingga keputusan dicatat.
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-200 transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Buka seluruh antrean
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="divide-y divide-white/10">
            {reports.map((report, index) => (
              <article key={report.id} className="grid gap-4 px-5 py-5 sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:px-7">
                <div className="hidden size-10 place-items-center rounded-full border border-white/15 font-mono text-xs text-slate-400 sm:grid">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-mono text-xs font-semibold tracking-wide text-slate-400">{report.id}</p>
                    <StatusBadge
                      status={report.tone}
                      className="border-white/10 bg-white/10 text-white"
                    >
                      {report.status}
                    </StatusBadge>
                  </div>
                  <h3 className="mt-2 font-medium leading-6">{report.reason}</h3>
                  <p className="mt-1 text-sm text-slate-400">{report.target}</p>
                </div>
                <Button asChild variant="outline" className="border-white/15 bg-white/[0.06] text-white hover:bg-white/10">
                  <Link href="/admin/reports">Tinjau</Link>
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-border/75 bg-card/72 p-6 backdrop-blur-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Jejak kesiapan</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">Hal yang perlu dijaga</h2>
          <div className="relative mt-7 grid gap-7 before:absolute before:bottom-3 before:left-[0.3rem] before:top-3 before:w-px before:bg-border">
            <div className="relative grid grid-cols-[1.1rem_1fr] gap-4">
              <span className="mt-1 size-2.5 rounded-full bg-success ring-4 ring-card" aria-hidden="true" />
              <div>
                <p className="font-medium">Alur pekerjaan utama</p>
                <p className="mt-1 text-base leading-7 text-muted-foreground">Tidak ada gangguan operasional yang terdeteksi.</p>
              </div>
            </div>
            <div className="relative grid grid-cols-[1.1rem_1fr] gap-4">
              <span className="mt-1 size-2.5 rounded-full bg-amber-500 ring-4 ring-card" aria-hidden="true" />
              <div>
                <p className="font-medium">Panduan upah belum tersedia</p>
                <p className="mt-1 text-base leading-7 text-muted-foreground">Kesempatan Pertama menunggu referensi yang dapat ditinjau.</p>
                <Link
                  href="/admin/wage-guidelines"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Siapkan panduan
                  <WalletCards className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="relative grid grid-cols-[1.1rem_1fr] gap-4">
              <span className="mt-1 size-2.5 rounded-full bg-primary ring-4 ring-card" aria-hidden="true" />
              <div>
                <p className="font-medium">Jejak audit tersimpan</p>
                <p className="mt-1 text-base leading-7 text-muted-foreground">Aksi penting tercatat dengan pengenal yang aman.</p>
                <Link
                  href="/admin/audit-logs"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Lihat audit
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
