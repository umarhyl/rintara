import Link from "next/link";
import { AlertTriangle, Clock3, FileWarning } from "lucide-react";
import { AdminReportActions } from "@/components/rintara/admin-report-actions";
import { DetailList } from "@/components/rintara/detail-list";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { adminListReports } from "@/server/queries/admin/moderation";

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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string | string[] }>;
}) {
  await requireDashboardPageRole("admin", "/admin/reports");
  const params = await searchParams;
  const reports = await adminListReports();
  const selectedReportId =
    typeof params.report === "string" ? params.report : undefined;
  const selected =
    reports.find((report) => report.id === selectedReportId) ??
    reports[0] ??
    null;
  const activeCount = reports.filter(
    (report) => report.status === "open" || report.status === "reviewing",
  ).length;

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Laporan"
        description="Tinjau konteks dan bukti sebelum menetapkan keputusan moderasi."
      />

      <div className="grid gap-7 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="h-fit overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border/70 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">Antrean</p>
                <h2 className="mt-1 text-lg font-semibold">{activeCount} laporan aktif</h2>
              </div>
              <FileWarning className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
          <nav aria-label="Daftar laporan" className="divide-y divide-border/70">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/admin/reports?report=${encodeURIComponent(report.id)}`}
                aria-current={report.id === selected?.id ? "page" : undefined}
                className="relative block min-h-11 px-5 py-5 transition-colors hover:bg-muted/45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                {report.id === selected?.id ? (
                  <span className="absolute inset-y-4 left-0 w-0.5 rounded-r-full bg-primary" aria-hidden="true" />
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                    {report.id.slice(0, 8)}
                  </span>
                  <StatusBadge status={statusTones[report.status]}>
                    {statusLabels[report.status]}
                  </StatusBadge>
                </div>
                <span className="mt-3 block font-medium leading-6">
                  {reasonLabels[report.reason]}
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                  {report.targetTitle || report.jobId || report.agreementId || report.reportedUserId}
                </span>
              </Link>
            ))}
            {reports.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Belum ada laporan.
              </p>
            ) : null}
          </nav>
        </aside>

        {selected ? (
          <div className="min-w-0 space-y-7">
            <section aria-labelledby="selected-report" className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex flex-col gap-5 border-b border-border/70 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-7">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-mono text-xs font-semibold tracking-wide text-muted-foreground">
                      {selected.id}
                    </p>
                    <StatusBadge status={statusTones[selected.status]}>
                      {statusLabels[selected.status]}
                    </StatusBadge>
                  </div>
                  <h2 id="selected-report" className="mt-3 text-2xl font-semibold tracking-tight">
                    {reasonLabels[selected.reason]}
                  </h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="size-4" aria-hidden="true" />
                    Dibuat {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
              <div className="px-5 sm:px-7">
                <DetailList
                  items={[
                    { label: "Target", value: selected.targetTitle || selected.jobId || selected.agreementId || selected.reportedUserId || "Target terkait" },
                    { label: "Status", value: statusLabels[selected.status] },
                    { label: "Alasan", value: reasonLabels[selected.reason] },
                    { label: "Keterangan", value: selected.description || "Tidak ada keterangan tambahan." },
                    { label: "Catatan moderator", value: selected.moderatorNote || "Belum ada keputusan." },
                  ]}
                />
              </div>
            </section>

            <Alert className="border-amber-300/70 bg-amber-50/80 text-amber-950">
              <AlertTriangle aria-hidden="true" />
              <AlertTitle>Catatan privat moderator</AlertTitle>
              <AlertDescription>
                Catatan internal tidak boleh disertakan dalam notifikasi kepada pihak terkait.
              </AlertDescription>
            </Alert>

            <section aria-labelledby="decision-title" className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="mb-6">
                <h2 id="decision-title" className="text-xl font-semibold tracking-tight">
                  Keputusan moderasi
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pilih tindakan yang didukung bukti. Setiap perubahan dicatat
                  dalam audit.
                </p>
              </div>
              <AdminReportActions
                key={`${selected.id}:${selected.status}`}
                reportId={selected.id}
                status={selected.status}
                hasJobTarget={Boolean(selected.jobId)}
                hasUserTarget={Boolean(selected.reportedUserId)}
              />
            </section>

          </div>
        ) : (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Tidak ada laporan</h2>
            <p className="mt-2 text-muted-foreground">Antrean moderasi kosong.</p>
          </section>
        )}
      </div>
    </div>
  );
}
