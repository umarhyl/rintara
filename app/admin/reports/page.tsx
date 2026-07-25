import { AlertTriangle, Clock3, FileWarning, ShieldCheck } from "lucide-react";
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

export default async function ReportsPage() {
  await requireDashboardPageRole("admin", "/admin/reports");
  const reports = await adminListReports();
  const selected = reports[0] ?? null;
  const activeCount = reports.filter(
    (report) => report.status === "open" || report.status === "reviewing",
  ).length;

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Kepercayaan & keamanan"
        title="Moderasi laporan"
        description="Tinjau hubungan pihak, konteks pekerjaan, dan jejak tindakan sebelum membuat keputusan."
      />

      <div className="grid gap-7 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="h-fit overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/70 backdrop-blur-sm">
          <div className="border-b border-border/70 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Antrean</p>
                <h2 className="mt-1 text-lg font-semibold">{activeCount} laporan aktif</h2>
              </div>
              <FileWarning className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
          <nav aria-label="Daftar laporan" className="divide-y divide-border/70">
            {reports.map((report, index) => (
              <div
                key={report.id}
                aria-current={index === 0 ? "true" : undefined}
                className="relative px-5 py-5"
              >
                {index === 0 ? (
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
              </div>
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
            <section aria-labelledby="selected-report" className="overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/82">
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
                  <h2 id="selected-report" className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
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

            <Alert className="border-amber-300/70 bg-amber-50/80 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle aria-hidden="true" />
              <AlertTitle>Catatan privat moderator</AlertTitle>
              <AlertDescription className="dark:text-amber-200/75">
                Catatan internal tidak boleh disertakan dalam notifikasi kepada pihak terkait.
              </AlertDescription>
            </Alert>

            <section aria-labelledby="decision-title" className="rounded-[1.5rem] border border-border/75 bg-card/72 p-5 backdrop-blur-sm sm:p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Tahap keputusan</p>
                <h2 id="decision-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Tindakan yang dapat diterapkan
                </h2>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  Pilih hanya tindakan yang didukung bukti. Setiap perubahan akan ditambahkan ke jejak audit.
                </p>
              </div>
              <AdminReportActions
                reportId={selected.id}
                status={selected.status}
                hasJobTarget={Boolean(selected.jobId)}
                hasUserTarget={Boolean(selected.reportedUserId)}
              />
            </section>

            <section aria-labelledby="related-audit" className="grid gap-5 border-t border-border/70 pt-7 sm:grid-cols-[15rem_1fr]">
              <div>
                <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                <h2 id="related-audit" className="mt-3 text-lg font-semibold">Audit terkait</h2>
                <p className="mt-2 text-base leading-7 text-muted-foreground">Identitas ditampilkan dalam bentuk aman.</p>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                Audit keputusan akan muncul di halaman audit log setelah tindakan disimpan.
              </p>
            </section>
          </div>
        ) : (
          <section className="rounded-[1.5rem] border border-border/75 bg-card p-7">
            <h2 className="text-xl font-semibold">Tidak ada laporan</h2>
            <p className="mt-2 text-muted-foreground">Antrean moderasi kosong.</p>
          </section>
        )}
      </div>
    </div>
  );
}
