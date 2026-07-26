import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { adminDashboardSummary } from "@/server/queries/admin/moderation";

const reasonLabels = {
  suspicious_job: "Pekerjaan mencurigakan",
  terms_mismatch: "Ketentuan tidak sesuai",
  absence: "Masalah kehadiran",
  unsafe_behavior: "Kekhawatiran keamanan",
  spam: "Spam",
  other: "Lainnya",
} as const;

const statusLabels = {
  open: "Terbuka",
  reviewing: "Ditinjau",
  resolved: "Selesai",
  rejected: "Ditolak",
} as const;

const statusTones = {
  open: "warning",
  reviewing: "info",
  resolved: "success",
  rejected: "neutral",
} as const;

export default async function AdminPage() {
  await requireDashboardPageRole("admin", "/admin");
  const summary = await adminDashboardSummary();
  const metrics = [
    {
      label: "Laporan aktif",
      value: summary.activeReportCount,
      detail: `${summary.reportCount} laporan total`,
      href: "/admin/reports",
    },
    {
      label: "Pekerjaan",
      value: summary.jobCount,
      detail: null,
      href: "/admin/jobs",
    },
    {
      label: "Akun terdaftar",
      value: summary.userCount,
      detail: null,
      href: "/admin/users",
    },
    {
      label: "Entri audit",
      value: summary.auditCount,
      detail: null,
      href: "/admin/audit-logs",
    },
  ] as const;

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Ringkasan admin"
        description="Pantau laporan terbaru dan data operasional Rintara."
        action={
          <Button className="h-11" asChild>
            <Link href="/admin/reports">
              {summary.activeReportCount > 0
                ? `Tinjau ${summary.activeReportCount} laporan aktif`
                : "Buka laporan"}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section
        aria-label="Ringkasan data operasional"
        className="grid gap-x-8 gap-y-6 border-y border-border py-6 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <div key={metric.label}>
            <Link
              href={metric.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {metric.label}
              <ArrowRight className="ml-2 size-3.5" aria-hidden="true" />
            </Link>
            <p className="text-3xl font-semibold tracking-tight">
              {metric.value}
            </p>
            {metric.detail ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {metric.detail}
              </p>
            ) : null}
          </div>
        ))}
      </section>

      <section aria-labelledby="latest-reports">
        <header className="border-b border-border pb-5">
          <h2
            id="latest-reports"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Laporan terbaru
          </h2>
          <p className="mt-2 text-base leading-6 text-muted-foreground">
            Lima laporan terakhir beserta status dan target yang tersedia.
          </p>
        </header>

        <div className="divide-y divide-border">
          {summary.latestReports.map((report) => (
            <article
              key={report.id}
              className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    ID {report.id.slice(0, 8)}
                  </span>
                  <StatusBadge status={statusTones[report.status]}>
                    {statusLabels[report.status]}
                  </StatusBadge>
                </div>
                <h3 className="mt-2 font-semibold leading-6">
                  {reasonLabels[report.reason]}
                </h3>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {report.targetTitle ||
                    report.jobId ||
                    report.agreementId ||
                    report.reportedUserId ||
                    "Target tidak tersedia"}
                </p>
              </div>
              <Button variant="outline" className="h-11" asChild>
                <Link
                  href={`/admin/reports?report=${encodeURIComponent(report.id)}`}
                >
                  Tinjau
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </article>
          ))}
          {summary.latestReports.length === 0 ? (
            <p className="py-7 text-sm text-muted-foreground">
              Belum ada laporan.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
