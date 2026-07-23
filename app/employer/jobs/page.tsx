import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Plus, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import {
  listEmployerJobs,
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
  if (status === "draft") return "Draft";
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
    <article className="grid gap-5 border-y border-border bg-card/45 px-5 py-6 sm:grid-cols-[1fr_auto] sm:items-start sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={statusTone(job.status)}>
            {statusLabel(job.status)}
          </StatusBadge>
          {job.isFirstOpportunity ? (
            <StatusBadge tone="warning">Kesempatan Pertama</StatusBadge>
          ) : null}
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.025em]">
          <Link href={`/employer/jobs/${job.id}`} className="hover:underline">
            {job.title}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {job.categoryName} · {job.publicLocationLabel}
        </p>
        <dl className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
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
        <p className="mt-4 text-sm font-medium">
          {formatWage(job.wageAmount, job.wageUnit)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {job.status === "draft" ? (
          <Button variant="outline" className="h-10 rounded-full" asChild>
            <Link href={`/employer/jobs/${job.id}/edit`}>Edit draft</Link>
          </Button>
        ) : null}
        <Button className="h-10 rounded-full" asChild>
          <Link href={`/employer/jobs/${job.id}`}>
            Kelola <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export default async function EmployerJobsPage() {
  const account = await requireDashboardPageRole("employer", "/employer/jobs");
  const jobs = await listEmployerJobs(account.userId);
  const activeCount = jobs.filter(
    (job) => job.status === "published" || job.status === "filled",
  ).length;
  const draftCount = jobs.filter((job) => job.status === "draft").length;

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Pekerjaan saya"
        title="Kelola pekerjaan"
        description="Pantau draft, pekerjaan terbit, lamaran aktif, dan pekerjaan yang sudah ditutup."
        action={
          <Button className="rounded-full px-5" asChild>
            <Link href="/employer/jobs/new">
              <Plus aria-hidden="true" />
              Buat pekerjaan
            </Link>
          </Button>
        }
      />

      <section
        className="grid overflow-hidden border-y border-border/75 bg-card/40 sm:grid-cols-3"
        aria-label="Ringkasan pekerjaan"
      >
        <div className="px-1 py-5 sm:px-6">
          <p className="text-sm text-muted-foreground">Total pekerjaan</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
            {jobs.length}
          </p>
        </div>
        <div className="border-t border-border/70 px-1 py-5 sm:border-l sm:border-t-0 sm:px-6">
          <p className="text-sm text-muted-foreground">Aktif</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
            {activeCount}
          </p>
        </div>
        <div className="border-t border-border/70 px-1 py-5 sm:border-l sm:border-t-0 sm:px-6">
          <p className="text-sm text-muted-foreground">Draft</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
            {draftCount}
          </p>
        </div>
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
          description="Draft dan pekerjaan terbit akan muncul di sini setelah dibuat."
          actionLabel="Buat pekerjaan"
          actionHref="/employer/jobs/new"
        />
      )}
    </div>
  );
}
