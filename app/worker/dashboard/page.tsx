import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { JobCard } from "@/components/rintara/job-card";
import { StatusBadge } from "@/components/rintara/status-badge";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import {
  listMyApplications,
  type WorkerApplicationListItem,
} from "@/server/queries/applications/worker-applications";
import {
  listPublishedJobs,
  type PublicJobCard,
} from "@/server/queries/jobs/public-jobs";

function formatWage(amount: number, unit: PublicJobCard["wageUnit"]) {
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

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `Sekitar ${hours} jam ${remainingMinutes} menit`
    : `Sekitar ${hours} jam`;
}

function toJobCardView(job: PublicJobCard) {
  return {
    id: job.id,
    title: job.title,
    category: job.categoryName,
    employer: job.employerDisplayName,
    publicLocation: job.publicLocationLabel,
    wage: formatWage(job.wageAmount, job.wageUnit),
    date: formatDate(job.startsAt),
    duration: formatDuration(job.estimatedMinutes),
    firstOpportunity: job.isFirstOpportunity,
    boosted: job.activeBoost,
  };
}

function applicationStatusLabel(
  status: WorkerApplicationListItem["status"],
) {
  if (status === "submitted") return "Menunggu";
  if (status === "accepted") return "Diterima";
  if (status === "rejected") return "Ditolak";
  return "Ditarik";
}

function applicationStatusTone(
  status: WorkerApplicationListItem["status"],
) {
  if (status === "submitted") return "info" as const;
  if (status === "accepted") return "success" as const;
  if (status === "rejected") return "warning" as const;
  return "neutral" as const;
}

function applicationDestination(application: WorkerApplicationListItem) {
  return application.status === "accepted" && application.agreementId
    ? `/worker/agreements/${application.agreementId}`
    : "/worker/applications";
}

export function WorkerDashboardContent({
  displayName,
  jobs,
  applications,
}: {
  displayName: string;
  jobs: ReturnType<typeof toJobCardView>[];
  applications: WorkerApplicationListItem[];
}) {
  const acceptedApplication = applications.find(
    (application) =>
      application.status === "accepted" && application.agreementId,
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Halo, ${displayName}`}
        description="Lanjutkan lamaranmu atau temukan pekerjaan berikutnya."
        className="border-b-0 pb-0"
        action={
          <Button className="h-11 px-5" asChild>
            <Link href="/jobs">
              Cari pekerjaan <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      {acceptedApplication ? (
        <section
          aria-labelledby="worker-next-action"
          className="flex flex-col gap-4 rounded-xl bg-success-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="min-w-0">
            <StatusBadge tone="success">Lamaran diterima</StatusBadge>
            <h2
              id="worker-next-action"
              className="mt-3 text-xl font-semibold tracking-[-0.02em]"
            >
              {acceptedApplication.jobTitle}
            </h2>
            <p className="mt-1 text-base leading-6 text-muted-foreground">
              Buka Mini Agreement untuk melihat ketentuan dan langkah
              berikutnya.
            </p>
          </div>
          <Button className="h-11 w-full shrink-0 sm:w-auto" asChild>
            <Link
              href={`/worker/agreements/${acceptedApplication.agreementId}`}
            >
              Buka Mini Agreement
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </section>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="worker-opportunities">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="worker-opportunities"
                className="text-xl font-semibold tracking-[-0.02em]"
              >
                Pekerjaan terbaru
              </h2>
              <p className="mt-1 text-base leading-6 text-muted-foreground">
                Bandingkan ketentuan sebelum melamar.
              </p>
            </div>
            {jobs.length > 0 ? (
              <Link
                href="/jobs"
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
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada pekerjaan terbuka"
              description="Pekerjaan baru akan muncul setelah diterbitkan oleh pemberi kerja."
              actionLabel="Buka pencarian"
              actionHref="/jobs"
            />
          )}
        </section>

        <aside
          aria-labelledby="worker-application-activity"
          className="rounded-xl bg-muted p-5"
        >
          <h2
            id="worker-application-activity"
            className="text-lg font-semibold tracking-[-0.02em]"
          >
            Aktivitas lamaran
          </h2>

          {applications.length > 0 ? (
            <>
              <ul className="mt-3 grid gap-2">
                {applications.map((application) => (
                  <li key={application.id}>
                    <Link
                      href={applicationDestination(application)}
                      className="group flex min-h-11 items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            tone={applicationStatusTone(application.status)}
                          >
                            {applicationStatusLabel(application.status)}
                          </StatusBadge>
                          {application.isFirstOpportunity ? (
                            <span className="text-xs font-medium text-opportunity-foreground">
                              Kesempatan Pertama
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-2 block font-semibold leading-5 text-foreground">
                          {application.jobTitle}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                          {application.employerDisplayName}
                        </span>
                      </span>
                      <ArrowRight
                        className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/worker/applications"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Semua lamaran
                <ArrowRight aria-hidden="true" />
              </Link>
            </>
          ) : (
            <div className="mt-4">
              <p className="text-base leading-6 text-muted-foreground">
                Belum ada lamaran yang dikirim.
              </p>
              <Button variant="outline" className="mt-4 h-11 w-full" asChild>
                <Link href="/jobs">Cari pekerjaan</Link>
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default async function WorkerDashboardPage() {
  const account = await requireDashboardPageRole(
    "worker",
    "/worker/dashboard",
  );
  const [jobPage, applicationPage] = await Promise.all([
    listPublishedJobs({ limit: 3 }),
    listMyApplications({ limit: 3 }),
  ]);

  return (
    <WorkerDashboardContent
      displayName={account.displayName}
      jobs={jobPage.items.map(toJobCardView)}
      applications={applicationPage.items}
    />
  );
}
