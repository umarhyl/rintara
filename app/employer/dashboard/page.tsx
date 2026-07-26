import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { EmptyState } from "@/components/rintara/empty-state";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import {
  listMyEmployerJobs,
  type EmployerJobListItem,
} from "@/server/queries/jobs/get-employer-job";
import { getMyCreditDashboardSummary } from "@/server/queries/rewards/employer-credits";

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
  if (status === "cancelled" || status === "expired") {
    return "warning" as const;
  }
  return "info" as const;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function jobDestination(job: EmployerJobListItem) {
  if (job.status === "draft") return `/employer/jobs/${job.id}/edit`;
  if (job.status === "published" && job.submittedApplicationCount > 0) {
    return `/employer/jobs/${job.id}/applicants`;
  }
  if (job.status === "filled" && job.agreementId) {
    return `/employer/agreements/${job.agreementId}`;
  }
  return `/employer/jobs/${job.id}`;
}

function jobActionLabel(job: EmployerJobListItem) {
  if (job.status === "draft") return "Lanjutkan draf";
  if (job.status === "published" && job.submittedApplicationCount > 0) {
    return "Tinjau pelamar";
  }
  if (job.status === "filled" && job.agreementId) {
    return "Buka kesepakatan";
  }
  return "Kelola";
}

export function EmployerDashboardContent({
  displayName,
  jobs,
  creditSummary,
}: {
  displayName: string;
  jobs: EmployerJobListItem[];
  creditSummary: {
    activeCreditCount: number;
    activeBoostCount: number;
  };
}) {
  const actionableJob =
    jobs.find(
      (job) =>
        job.status === "published" && job.submittedApplicationCount > 0,
    ) ??
    jobs.find((job) => job.status === "draft") ??
    jobs.find(
      (job) => job.status === "filled" || job.status === "in_progress",
    );

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Selamat datang, ${displayName}`}
        description="Lanjutkan pekerjaan yang membutuhkan perhatian atau buat kesempatan baru."
        action={
          <Button className="h-11 px-5" asChild>
            <Link href="/employer/jobs/new">
              <Plus aria-hidden="true" />
              Buat pekerjaan
            </Link>
          </Button>
        }
      />

      {actionableJob ? (
        <section
          aria-labelledby="employer-next-action"
          className="flex flex-col gap-4 rounded-xl bg-secondary p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="min-w-0">
            <StatusBadge
              tone={
                actionableJob.status === "published" ? "success" : "neutral"
              }
            >
              Perlu ditindak
            </StatusBadge>
            <h2
              id="employer-next-action"
              className="mt-3 text-xl font-semibold tracking-[-0.02em]"
            >
              {actionableJob.title}
            </h2>
            <p className="mt-1 text-base leading-6 text-muted-foreground">
              {actionableJob.status === "published"
                ? `${actionableJob.submittedApplicationCount} pelamar menunggu peninjauanmu.`
                : actionableJob.status === "draft"
                  ? "Draf ini belum terlihat oleh pekerja."
                  : actionableJob.status === "filled"
                    ? "Mini Agreement menunggu konfirmasi kedua pihak."
                  : "Buka pekerjaan untuk melanjutkan tahap berikutnya."}
            </p>
          </div>
          <Button className="h-11 w-full shrink-0 sm:w-auto" asChild>
            <Link href={jobDestination(actionableJob)}>
              {jobActionLabel(actionableJob)}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </section>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="recent-employer-jobs">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="recent-employer-jobs"
                className="text-xl font-semibold tracking-[-0.02em]"
              >
                Pekerjaan terbaru
              </h2>
              <p className="mt-1 text-base leading-6 text-muted-foreground">
                Status dan pelamar aktif dari pekerjaan milikmu.
              </p>
            </div>
            {jobs.length > 0 ? (
              <Link
                href="/employer/jobs"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Lihat semua
                <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          {jobs.length > 0 ? (
            <div className="grid gap-3">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="grid gap-4 rounded-xl bg-card px-5 py-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={statusTone(job.status)}>
                        {statusLabel(job.status)}
                      </StatusBadge>
                      {job.isFirstOpportunity ? (
                        <span className="text-sm font-medium text-opportunity-foreground">
                          Kesempatan Pertama
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold leading-6">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {job.categoryName}, {job.publicLocationLabel}
                    </p>
                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">
                          Pelamar
                        </dt>
                        <dd className="font-semibold">
                          {job.submittedApplicationCount}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Jadwal</dt>
                        <dd className="font-medium">
                          {formatDate(job.startsAt)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <Button variant="outline" className="h-11" asChild>
                    <Link href={jobDestination(job)}>
                      {jobActionLabel(job)}
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada pekerjaan"
              description="Buat pekerjaan pertama agar pekerja dapat melihat ketentuannya."
              actionLabel="Buat pekerjaan"
              actionHref="/employer/jobs/new"
            />
          )}
        </section>

        <aside
          aria-labelledby="credit-summary"
          className="rounded-xl bg-muted p-5"
        >
          <h2
            id="credit-summary"
            className="text-lg font-semibold tracking-[-0.02em]"
          >
            Kredit Kesempatan
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Kredit bukan uang dan hanya dapat digunakan untuk boost pekerjaan
            milikmu.
          </p>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex min-h-11 items-center justify-between gap-4">
              <dt className="text-muted-foreground">Siap digunakan</dt>
              <dd className="font-semibold">
                {creditSummary.activeCreditCount} dari 3
              </dd>
            </div>
            <div className="flex min-h-11 items-center justify-between gap-4">
              <dt className="text-muted-foreground">Boost aktif</dt>
              <dd className="font-semibold">
                {creditSummary.activeBoostCount}
              </dd>
            </div>
          </dl>
          <Button variant="outline" className="mt-4 h-11 w-full" asChild>
            <Link href="/employer/opportunity-credits">
              Kelola kredit
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

export default async function EmployerDashboardPage() {
  const account = await requireDashboardPageRole(
    "employer",
    "/employer/dashboard",
  );
  const [jobPage, creditSummary] = await Promise.all([
    listMyEmployerJobs({ limit: 5 }),
    getMyCreditDashboardSummary(),
  ]);

  return (
    <EmployerDashboardContent
      displayName={account.displayName}
      jobs={jobPage.items}
      creditSummary={creditSummary}
    />
  );
}
