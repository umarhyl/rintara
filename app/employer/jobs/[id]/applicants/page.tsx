import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  Clock3,
  FileCheck2,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/rintara/empty-state";
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await requireDashboardPageRole(
    "employer",
    `/employer/jobs/${encodeURIComponent(id)}/applicants`,
  );
  let job;
  let applicantResult;

  try {
    [job, applicantResult] = await Promise.all([
      getEmployerJob(id, account.userId),
      listJobApplicants(id, account.userId),
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
    <div className="grid gap-8">
      <PageHeader
        eyebrow={job.title}
        title="Pelamar pekerjaan"
        description="Tinjau catatan lamaran, ringkasan pekerja, dan Paspor Rintara yang berwenang sebelum memilih satu pekerja."
        action={
          <div className="text-left sm:text-right">
            <p className="text-3xl font-semibold tracking-[-0.04em]">
              {activeApplicantCount.toString().padStart(2, "0")}
            </p>
            <p className="text-sm text-muted-foreground">pelamar aktif</p>
          </div>
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
        <section className="grid gap-5" aria-label="Daftar pelamar">
          {applicants.map((applicant) => (
            <article
              key={applicant.id}
              className="overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/78 backdrop-blur-sm"
            >
              <div className="grid gap-6 border-b border-border/70 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
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
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em]">
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

                <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border/70 bg-background/65 text-center sm:min-w-80">
                  <div className="px-3 py-4">
                    <dt className="text-xs text-muted-foreground">Selesai</dt>
                    <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                      {applicant.completedJobs}
                    </dd>
                  </div>
                  <div className="border-l border-border/70 px-3 py-4">
                    <dt className="text-xs text-muted-foreground">Kategori</dt>
                    <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                      {applicant.verifiedCategoryCount}
                    </dd>
                  </div>
                  <div className="border-l border-border/70 px-3 py-4">
                    <dt className="text-xs text-muted-foreground">Reputasi</dt>
                    <dd className="mt-1 text-sm font-semibold leading-7 text-success">
                      {applicant.completedJobs > 0 ? "Terverifikasi" : "Baru"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="grid gap-7 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
                <section aria-labelledby={`application-${applicant.id}`}>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    <BriefcaseBusiness className="size-4" aria-hidden="true" />
                    Catatan lamaran
                  </p>
                  <h3
                    id={`application-${applicant.id}`}
                    className="mt-3 text-lg font-semibold tracking-[-0.02em]"
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
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        <FileCheck2 className="size-4" aria-hidden="true" />
                        Paspor Rintara
                      </p>
                      <h3
                        id={`passport-${applicant.id}`}
                        className="mt-3 text-lg font-semibold tracking-[-0.02em]"
                      >
                        Bukti Kerja terverifikasi
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                      <ShieldCheck className="size-3.5" aria-hidden="true" />
                      Data privat terlindungi
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2" aria-label="Keahlian">
                    {applicant.skillInterests.length > 0 ? (
                      applicant.skillInterests.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex min-h-8 items-center rounded-full border border-border bg-background px-3 text-sm font-medium"
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

                  {applicant.proofEntries.length > 0 ? (
                    <ol className="mt-6 divide-y divide-border/70 border-y border-border/70">
                      {applicant.proofEntries.map((proof) => (
                        <li key={proof.id} className="grid gap-3 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-start">
                          <BadgeCheck className="mt-1 size-5 text-success" aria-hidden="true" />
                          <div>
                            <p className="font-semibold leading-6">
                              {proof.jobTitle}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {proof.categoryName} · {proof.areaLabel}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground sm:justify-end">
                            <CalendarCheck2 className="size-4" aria-hidden="true" />
                            {formatDate(proof.completedAt)}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/50 px-4 py-5">
                      <p className="flex items-center gap-2 font-medium">
                        <Sparkles className="size-4 text-primary" aria-hidden="true" />
                        Belum ada Bukti Kerja
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Pelamar ini belum memiliki riwayat terverifikasi. Jika
                        pekerjaan ini selesai, Bukti Kerja akan diterbitkan dari
                        alur Rintara.
                      </p>
                    </div>
                  )}

                  <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="size-4 text-primary" aria-hidden="true" />
                    Akses Paspor tersedia hanya dalam konteks lamaran pekerjaan
                    milikmu.
                  </p>
                </section>
              </div>
            </article>
          ))}
        </section>
      )}

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
