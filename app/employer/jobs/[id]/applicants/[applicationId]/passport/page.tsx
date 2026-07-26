import Link from "next/link";
import { BadgeCheck, CalendarCheck2, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { ApplicationError } from "@/server/errors/application-error";
import { getApplicantPassport } from "@/server/queries/applications/job-applicants";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function ApplicantPassportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; applicationId: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { id, applicationId } = await params;
  const { cursor } = await searchParams;
  const returnPath = `/employer/jobs/${encodeURIComponent(id)}/applicants`;

  await requireDashboardPageRole(
    "employer",
    `${returnPath}/${encodeURIComponent(applicationId)}/passport`,
  );

  let passport;
  try {
    passport = await getApplicantPassport(id, applicationId, {
      cursor: typeof cursor === "string" ? cursor : undefined,
    });
  } catch (error) {
    if (
      error instanceof ApplicationError &&
      (error.code === "NOT_FOUND" || error.code === "JOB_NOT_FOUND")
    ) {
      notFound();
    }
    throw error;
  }

  const { applicant, proofEntries } = passport;

  return (
    <div className="grid gap-7">
      <PageHeader
        title={`Paspor ${applicant.workerDisplayName}`}
        description={`Bukti Kerja untuk lamaran ${passport.job.title}. Akses tersedia selama peninjauan.`}
        action={
          <StatusBadge
            tone={applicant.isEligibleForJobCategoryNow ? "success" : "warning"}
          >
            {applicant.isEligibleForJobCategoryNow
              ? "Layak kategori ini"
              : "Sudah berpengalaman"}
          </StatusBadge>
        }
      />

      <section className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:p-6">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {applicant.workerAreaName}
          </p>
          {applicant.workerBio ? (
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              {applicant.workerBio}
            </p>
          ) : null}
        </div>

        <dl className="grid overflow-hidden border-y border-border/70 sm:grid-cols-3">
          <div className="py-4 sm:px-4">
            <dt className="text-sm text-muted-foreground">Bukti Kerja</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {applicant.completedJobs}
            </dd>
          </div>
          <div className="border-t border-border/70 py-4 sm:border-l sm:border-t-0 sm:px-4">
            <dt className="text-sm text-muted-foreground">
              Kategori terverifikasi
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {applicant.verifiedCategoryCount}
            </dd>
          </div>
          <div className="border-t border-border/70 py-4 sm:border-l sm:border-t-0 sm:px-4">
            <dt className="text-sm text-muted-foreground">
              Bukti terbaru
            </dt>
            <dd className="mt-1 font-medium">
              {applicant.latestCompletedAt
                ? dateFormatter.format(applicant.latestCompletedAt)
                : "Belum ada"}
            </dd>
          </div>
        </dl>

        <div>
          <h2 className="font-semibold">Minat kategori</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {applicant.skillInterests.length > 0 ? (
              applicant.skillInterests.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex min-h-8 items-center rounded-lg border border-border px-3 text-sm"
                >
                  {skill.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada minat kategori yang ditulis.
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="proof-history-title">
        <h2 id="proof-history-title" className="text-xl font-semibold">
          Riwayat Bukti Kerja
        </h2>
        {proofEntries.length > 0 ? (
          <ol className="mt-4 divide-y divide-border/70 border-y border-border/70">
            {proofEntries.map((proof) => (
              <li
                key={proof.id}
                className="grid gap-3 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-start"
              >
                <BadgeCheck
                  className="mt-1 size-5 text-success"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold">{proof.jobTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {proof.categoryName} · {proof.areaLabel}
                  </p>
                </div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarCheck2 className="size-4" aria-hidden="true" />
                  {dateFormatter.format(proof.completedAt)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 border-y border-border/70 py-6 text-muted-foreground">
            Pelamar ini belum memiliki Bukti Kerja terverifikasi.
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        {passport.nextCursor ? (
          <Button variant="outline" asChild>
            <Link
              href={`${returnPath}/${encodeURIComponent(applicationId)}/passport?cursor=${encodeURIComponent(passport.nextCursor)}`}
            >
              Bukti berikutnya
            </Link>
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href={returnPath}>Kembali ke daftar pelamar</Link>
        </Button>
      </div>
    </div>
  );
}
