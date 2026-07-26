import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { WithdrawApplicationButton } from "@/components/rintara/withdraw-application-button";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import {
  listMyApplications,
  type WorkerApplicationListItem,
  type WorkerApplicationListView,
} from "@/server/queries/applications/worker-applications";

function formatWage(
  amount: number,
  unit: WorkerApplicationListItem["wageUnit"],
) {
  const unitLabel =
    unit === "hour" ? "jam" : unit === "day" ? "hari" : "pekerjaan";
  return `${new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)} / ${unitLabel}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function statusLabel(status: WorkerApplicationListItem["status"]) {
  if (status === "submitted") return "Menunggu";
  if (status === "accepted") return "Diterima";
  if (status === "rejected") return "Ditolak";
  return "Ditarik";
}

function statusTone(status: WorkerApplicationListItem["status"]) {
  if (status === "submitted") return "info";
  if (status === "accepted") return "success";
  if (status === "rejected") return "warning";
  return "neutral";
}

function ApplicationCard({
  application,
}: {
  application: WorkerApplicationListItem;
}) {
  return (
    <article className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-start sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={statusTone(application.status)}>
            {statusLabel(application.status)}
          </StatusBadge>
          {application.isFirstOpportunity ? (
            <StatusBadge tone="warning">Kesempatan Pertama</StatusBadge>
          ) : null}
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight">
          {application.publicDetailAvailable ? (
            <Link
              href={`/jobs/${application.jobId}`}
              className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {application.jobTitle}
            </Link>
          ) : (
            application.jobTitle
          )}
        </h2>
        {!application.publicDetailAvailable ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Detail pekerjaan tidak lagi tersedia di pencarian.
          </p>
        ) : null}
        <p className="mt-1 text-sm text-muted-foreground">
          {application.employerDisplayName} · {application.publicLocationLabel}
        </p>
        <dl className="mt-4 grid gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <dt className="text-xs">Kategori</dt>
            <dd className="mt-1 font-medium text-foreground">
              {application.categoryName}
            </dd>
          </div>
          <div>
            <dt className="text-xs">Jadwal</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatDate(application.startsAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs">Upah tetap</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatWage(application.wageAmount, application.wageUnit)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Dikirim {formatDate(application.submittedAt)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {application.status === "submitted" ? (
          <WithdrawApplicationButton applicationId={application.id} />
        ) : null}
        {application.status === "accepted" && application.agreementId ? (
          <Button className="min-h-11" asChild>
            <Link href={`/worker/agreements/${application.agreementId}`}>
              Buka Mini Agreement <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string | string[];
    view?: string | string[];
  }>;
}) {
  const { cursor, view } = await searchParams;
  const selectedView: WorkerApplicationListView =
    view === "history" ? "history" : "active";
  await requireDashboardPageRole("worker", "/worker/applications");
  const applicationPage = await listMyApplications({
    cursor: typeof cursor === "string" ? cursor : undefined,
    view: selectedView,
  });
  const applications = applicationPage.items;
  const submittedCount = applications.filter(
    (application) => application.status === "submitted",
  ).length;
  const acceptedCount = applications.filter(
    (application) => application.status === "accepted",
  ).length;
  const rejectedCount = applications.filter(
    (application) => application.status === "rejected",
  ).length;
  const withdrawnCount = applications.filter(
    (application) => application.status === "withdrawn",
  ).length;
  const statusSummary =
    selectedView === "active"
      ? [
          { label: "Menunggu", value: submittedCount },
          { label: "Diterima", value: acceptedCount },
        ]
      : [
          { label: "Ditolak", value: rejectedCount },
          { label: "Ditarik", value: withdrawnCount },
        ];
  const nextPageHref = applicationPage.nextCursor
    ? `/worker/applications?${new URLSearchParams({
        view: selectedView,
        cursor: applicationPage.nextCursor,
      }).toString()}`
    : null;

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Lamaran"
        description="Pantau status lamaran dan lanjutkan yang sudah diterima."
        action={
          <Button className="px-5" asChild>
            <Link href="/jobs">
              Cari pekerjaan <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4">
        <nav
          className="grid w-full max-w-sm grid-cols-2 rounded-xl bg-muted p-1"
          aria-label="Tampilkan jenis lamaran"
        >
          {(
            [
              { value: "active", label: "Aktif" },
              { value: "history", label: "Riwayat" },
            ] as const
          ).map((option) => {
            const selected = selectedView === option.value;
            return (
              <Link
                key={option.value}
                href={`/worker/applications?view=${option.value}`}
                aria-current={selected ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  selected
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>

        <section
          className="flex flex-wrap items-center gap-x-7 gap-y-2 rounded-xl bg-muted px-4 py-3 sm:px-5"
          aria-label="Ringkasan lamaran pada halaman ini"
        >
          <p className="text-sm font-medium text-muted-foreground">
            Pada halaman ini
          </p>
          <dl className="flex flex-wrap gap-x-7 gap-y-2 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-semibold tabular-nums">
                {applications.length}
              </dd>
            </div>
            {statusSummary.map((item) => (
              <div key={item.label} className="flex items-baseline gap-2">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="font-semibold tabular-nums">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {applications.length > 0 ? (
        <div className="grid gap-4">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            selectedView === "active"
              ? "Belum ada lamaran aktif"
              : "Belum ada riwayat lamaran"
          }
          description={
            selectedView === "active"
              ? "Lamaran yang sedang menunggu keputusan atau sudah diterima akan tampil di sini."
              : "Lamaran yang ditolak atau ditarik akan muncul di sini."
          }
          actionLabel="Cari pekerjaan"
          actionHref="/jobs"
        />
      )}

      {nextPageHref ? (
        <nav aria-label="Navigasi daftar lamaran">
          <Button variant="outline" asChild>
            <Link href={nextPageHref}>
              Lamaran berikutnya <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
