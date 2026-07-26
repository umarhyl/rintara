import {
  BriefcaseBusiness,
  Clock3,
  FileCheck2,
  MapPin,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/rintara/empty-state";
import { AcceptApplicationButton } from "@/components/rintara/accept-application-button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/rintara/status-badge";
import { ApplicationError } from "@/server/errors/application-error";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { getEmployerJob } from "@/server/queries/jobs/get-employer-job";
import { listJobApplicants } from "@/server/queries/applications/job-applicants";

const statusLabels = {
  submitted: "Menunggu tinjauan",
  accepted: "Diterima",
  rejected: "Tidak dipilih",
  withdrawn: "Ditarik",
} as const;

const statusTones = {
  submitted: "info",
  accepted: "success",
  rejected: "neutral",
  withdrawn: "warning",
} as const;

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export default async function ApplicantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { id } = await params;
  const { cursor } = await searchParams;
  await requireDashboardPageRole(
    "employer",
    `/employer/jobs/${encodeURIComponent(id)}/applicants`,
  );
  let job;
  let applicantResult;

  try {
    [job, applicantResult] = await Promise.all([
      getEmployerJob(id),
      listJobApplicants(
        id,
        { cursor: typeof cursor === "string" ? cursor : undefined },
      ),
    ]);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "JOB_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const applicants = applicantResult.applicants;
  const activeApplicantCount = applicants.filter(
    (applicant) => applicant.status === "submitted",
  ).length;

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Pelamar"
        description={`Tinjau pelamar untuk ${job.title} sebelum menerima satu pekerja.`}
        action={
          <p className="text-sm text-muted-foreground">
            <strong className="font-semibold tabular-nums text-foreground">
              {activeApplicantCount}
            </strong>{" "}
            pelamar aktif
          </p>
        }
      />

      {applicants.length === 0 ? (
        <EmptyState
          title="Belum ada pelamar"
          description="Lamaran untuk pekerjaan ini akan muncul di sini setelah pekerja mengirim catatan lamarannya."
          actionLabel="Lihat pekerjaan"
          actionHref={`/employer/jobs/${job.id}`}
        />
      ) : (
        <section className="grid gap-4" aria-label="Daftar pelamar">
          {applicants.map((applicant) => (
            <article
              key={applicant.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="border-b border-border/70 p-5 sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={statusTones[applicant.status]}>
                      {statusLabels[applicant.status]}
                    </StatusBadge>
                    {job.isFirstOpportunity ? (
                      <StatusBadge
                        tone={
                          applicant.isEligibleForJobCategoryNow
                            ? "success"
                            : "danger"
                        }
                      >
                        {applicant.isEligibleForJobCategoryNow
                          ? "Layak Kesempatan Pertama"
                          : "Tidak layak kategori ini"}
                      </StatusBadge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight">
                    {applicant.workerDisplayName}
                  </h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-primary" aria-hidden="true" />
                    {applicant.workerAreaName}
                  </p>
                  {applicant.workerBio ? (
                    <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                      {applicant.workerBio}
                    </p>
                  ) : null}
                </div>

              </div>

              <div className="grid gap-7 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
                <section aria-labelledby={`application-${applicant.id}`}>
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <BriefcaseBusiness className="size-4" aria-hidden="true" />
                    Catatan lamaran
                  </p>
                  <h3
                    id={`application-${applicant.id}`}
                    className="mt-3 text-lg font-semibold tracking-tight"
                  >
                    Ringkasan pelamar
                  </h3>
                  <blockquote className="mt-4 border-l-2 border-primary/30 pl-4 text-base leading-7 text-muted-foreground">
                    {applicant.note}
                  </blockquote>

                  <dl className="mt-6 divide-y divide-border/70 border-y border-border/70">
                    <div className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr]">
                      <dt className="text-sm text-muted-foreground">Dikirim</dt>
                      <dd className="font-medium">{formatDate(applicant.submittedAt)}</dd>
                    </div>
                    <div className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr]">
                      <dt className="text-sm text-muted-foreground">Ketersediaan</dt>
                      <dd className="font-medium">
                        {applicant.availabilityNote || "Belum ditulis"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section aria-labelledby={`passport-${applicant.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <FileCheck2 className="size-4" aria-hidden="true" />
                        Paspor Rintara
                      </p>
                      <h3
                        id={`passport-${applicant.id}`}
                        className="mt-3 text-lg font-semibold tracking-tight"
                      >
                        Bukti Kerja terverifikasi
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                      <ShieldCheck className="size-3.5" aria-hidden="true" />
                      Data privat terlindungi
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2" aria-label="Keahlian">
                    {applicant.skillInterests.length > 0 ? (
                      applicant.skillInterests.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex min-h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium"
                        >
                          {skill.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Belum ada minat kategori yang ditulis.
                      </span>
                    )}
                  </div>

                  <dl className="mt-5 grid grid-cols-2 border-y border-border/70">
                    <div className="px-3 py-4">
                      <dt className="text-xs text-muted-foreground">
                        Bukti Kerja
                      </dt>
                      <dd className="mt-1 text-lg font-semibold tabular-nums">
                        {applicant.completedJobs}
                      </dd>
                    </div>
                    <div className="border-l border-border/70 px-3 py-4">
                      <dt className="text-xs text-muted-foreground">
                        Kategori terverifikasi
                      </dt>
                      <dd className="mt-1 text-lg font-semibold tabular-nums">
                        {applicant.verifiedCategoryCount}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="size-4 text-primary" aria-hidden="true" />
                    {applicant.status === "submitted"
                      ? "Paspor tersedia selama lamaran ini sedang kamu tinjau."
                      : "Akses Paspor ditutup setelah proses peninjauan berakhir."}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {applicant.status === "submitted" ? (
                      <>
                        <Button variant="outline" asChild className="h-11">
                          <Link
                            href={`/employer/jobs/${job.id}/applicants/${applicant.id}/passport`}
                          >
                            Lihat Paspor Rintara
                          </Link>
                        </Button>
                        <AcceptApplicationButton
                          applicationId={applicant.id}
                          workerDisplayName={applicant.workerDisplayName}
                          disabledReason={
                            job.isFirstOpportunity &&
                            !applicant.isEligibleForJobCategoryNow
                              ? "Pekerja ini sudah tidak layak untuk kategori Kesempatan Pertama."
                              : undefined
                          }
                        />
                      </>
                    ) : applicant.status === "accepted" ? (
                      applicant.agreementId ? (
                        <Button asChild className="h-11">
                          <Link
                            href={`/employer/agreements/${applicant.agreementId}`}
                          >
                            Lihat Mini Agreement
                          </Link>
                        </Button>
                      ) : null
                    ) : null}
                  </div>
                </section>
              </div>
            </article>
          ))}
        </section>
      )}

      {applicantResult.nextCursor ? (
        <nav aria-label="Navigasi daftar pelamar">
          <Button variant="outline" asChild>
            <Link
              href={`/employer/jobs/${job.id}/applicants?cursor=${encodeURIComponent(applicantResult.nextCursor)}`}
            >
              Pelamar berikutnya
            </Link>
          </Button>
        </nav>
      ) : null}

      <Alert className="border-primary/20 bg-primary/5">
        <RefreshCcw className="text-primary" aria-hidden="true" />
        <AlertTitle>Status dapat berubah saat ditinjau</AlertTitle>
        <AlertDescription>
          Jika pekerja lain telah lebih dulu diterima, muat ulang halaman untuk
          melihat hasil terbaru. Tidak ada penerimaan sebagian yang disimpan.
        </AlertDescription>
      </Alert>

      <div>
        <Button variant="outline" asChild>
          <Link href={`/employer/jobs/${job.id}`}>Kembali ke pekerjaan</Link>
        </Button>
      </div>
    </div>
  );
}
