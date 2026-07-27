import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import type { listMyReports } from "@/server/queries/reports/my-reports";

type ReportPage = Awaited<ReturnType<typeof listMyReports>>;

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
  reviewing: "Sedang ditinjau",
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

export function MyReportsView({
  reportPage,
  nextBasePath,
}: {
  reportPage: ReportPage;
  nextBasePath: string;
}) {
  if (reportPage.items.length === 0) {
    return (
      <EmptyState
        title="Belum ada laporan"
        description="Laporan yang kamu kirim dari pekerjaan atau Mini Agreement akan tampil di sini."
      />
    );
  }

  return (
    <div className="grid gap-5">
      <ol className="overflow-hidden rounded-xl border border-border bg-card">
        {reportPage.items.map((report, index) => (
          <li
            key={report.id}
            className={`grid gap-3 p-5 ${
              index > 0 ? "border-t border-border/70" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={statusTones[report.status]}>
                {statusLabels[report.status]}
              </StatusBadge>
              <time className="text-xs text-muted-foreground">
                {formatDate(report.createdAt)}
              </time>
            </div>
            <div>
              <h2 className="font-semibold">{reasonLabels[report.reason]}</h2>
              {report.description ? (
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {report.description}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              ID laporan: {report.id}
            </p>
          </li>
        ))}
      </ol>

      {reportPage.nextCursor ? (
        <nav aria-label="Navigasi riwayat laporan">
          <Button variant="outline" asChild>
            <Link
              href={`${nextBasePath}?cursor=${encodeURIComponent(
                reportPage.nextCursor,
              )}`}
            >
              Laporan berikutnya <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
