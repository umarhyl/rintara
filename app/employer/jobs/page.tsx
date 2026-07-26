import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Plus, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import {
  listMyEmployerJobs,
  type EmployerJobListItem,
} from "@/server/queries/jobs/get-employer-job";

function formatWage(amount: number, unit: EmployerJobListItem["wageUnit"]) {
  const unitLabel = unit === "hour" ? "jam" : unit === "day" ? "hari" : "pekerjaan";
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

function statusLabel(status: EmployerJobListItem["status"]) {
  if (status === "draft") return "Draf";
  if (status === "published") return "Menerima lamaran";
  if (status === "filled") return "Terisi";
  if (status === "in_progress") return "Berjalan";
  if (status === "completed") return "Selesai";
  if (status === "expired") return "Kedaluwarsa";
  return "Dibatalkan";
}

function statusTone(status: EmployerJobListItem["status"]) {
  if (status === "published") return "success" as const;
  if (status === "draft") return "neutral" as const;
  if (status === "cancelled" || status === "expired") return "warning" as const;
  return "info" as const;
}

function JobCard({ job }: { job: EmployerJobListItem }) {
  return (
    <article className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-start sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={statusTone(job.status)}>
            {statusLabel(job.status)}
          </StatusBadge>
          {job.isFirstOpportunity ? (
            <StatusBadge tone="warning">Kesempatan Pertama</StatusBadge>
          ) : null}
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight">
          <Link href={`/employer/jobs/${job.id}`} className="hover:underline">
            {job.title}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {job.categoryName} · {job.publicLocationLabel}
        </p>
        <dl className="mt-4 grid gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1.5 text-xs">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Jadwal
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatDate(job.startsAt)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs">
              <MapPin className="size-3.5" aria-hidden="true" />
              Area
            </dt>
            <dd className="mt-1 font-medium text-foreground">{job.areaName}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs">
              <UsersRound className="size-3.5" aria-hidden="true" />
              Pelamar aktif
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {job.submittedApplicationCount}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm font-medium">
          {formatWage(job.wageAmount, job.wageUnit)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {job.status === "draft" ? (
          <Button variant="outline" className="min-h-11" asChild>
            <Link href={`/employer/jobs/${job.id}/edit`}>Edit draf</Link>
          </Button>
        ) : null}
        <Button className="min-h-11" asChild>
          <Link href={`/employer/jobs/${job.id}`}>
            Kelola <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export default async function EmployerJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { cursor } = await searchParams;
  await requireDashboardPageRole("employer", "/employer/jobs");
  const jobPage = await listMyEmployerJobs({
    cursor: typeof cursor === "string" ? cursor : undefined,
  });
  const jobs = jobPage.items;
  const activeCount = jobs.filter(
    (job) => job.status === "published" || job.status === "filled",
  ).length;
  const draftCount = jobs.filter((job) => job.status === "draft").length;

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Pekerjaan"
        description="Kelola draf, pekerjaan terbit, pelamar, dan pekerjaan yang sudah ditutup."
        action={
          <Button className="px-5" asChild>
            <Link href="/employer/jobs/new">
              <Plus aria-hidden="true" />
              Buat pekerjaan
            </Link>
          </Button>
        }
      />

      <section className="border-y border-border/75 py-3" aria-label="Ringkasan pekerjaan">
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">Tampil</dt>
            <dd className="font-semibold tabular-nums">{jobs.length}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">Aktif</dt>
            <dd className="font-semibold tabular-nums">{activeCount}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">Draf</dt>
            <dd className="font-semibold tabular-nums">{draftCount}</dd>
          </div>
        </dl>
      </section>

      {jobs.length > 0 ? (
        <section className="grid gap-4" aria-label="Daftar pekerjaan">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="Belum ada pekerjaan"
          description="Draf dan pekerjaan terbit akan muncul di sini setelah dibuat."
          actionLabel="Buat pekerjaan"
          actionHref="/employer/jobs/new"
        />
      )}

      {jobPage.nextCursor ? (
        <nav aria-label="Navigasi daftar pekerjaan">
          <Button variant="outline" asChild>
            <Link
              href={`/employer/jobs?cursor=${encodeURIComponent(jobPage.nextCursor)}`}
            >
              Pekerjaan berikutnya <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
