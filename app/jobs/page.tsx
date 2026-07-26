import Link from "next/link";
import { ArrowRight, ListFilter } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { JobCard } from "@/components/rintara/job-card";
import {
  JobFilters,
  type JobFilterValues,
} from "@/components/rintara/job-filters";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";
import { normalizeRupiahDigits } from "@/lib/format-rupiah";
import {
  getPublicJobReferenceData,
  listPublishedJobs,
  type OpportunityFilter,
  type PublicJobCard,
} from "@/server/queries/jobs/public-jobs";

export const metadata = { title: "Cari pekerjaan" };

const opportunityValues = ["all", "first", "general"] as const;

function firstQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function parsePositiveInteger(value: string) {
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseFilters(searchParams: {
  q?: string | string[];
  category?: string | string[];
  location?: string | string[];
  minWage?: string | string[];
  maxWage?: string | string[];
  opportunity?: string | string[];
}): JobFilterValues {
  const rawOpportunity = firstQueryValue(searchParams.opportunity);

  return {
    search: firstQueryValue(searchParams.q).trim().slice(0, 120),
    categoryId: firstQueryValue(searchParams.category) || "all",
    areaId: firstQueryValue(searchParams.location) || "all",
    minimumWage: normalizeRupiahDigits(
      firstQueryValue(searchParams.minWage),
    ),
    maximumWage: normalizeRupiahDigits(
      firstQueryValue(searchParams.maxWage),
    ),
    opportunity: opportunityValues.includes(
      rawOpportunity as JobFilterValues["opportunity"],
    )
      ? (rawOpportunity as JobFilterValues["opportunity"])
      : "all",
  };
}

function jobsHref(filters: JobFilterValues, cursor: string) {
  const query = new URLSearchParams();

  if (filters.search) query.set("q", filters.search);
  if (filters.categoryId !== "all") query.set("category", filters.categoryId);
  if (filters.areaId !== "all") query.set("location", filters.areaId);
  if (filters.minimumWage) query.set("minWage", filters.minimumWage);
  if (filters.maximumWage) query.set("maxWage", filters.maximumWage);
  if (filters.opportunity !== "all") {
    query.set("opportunity", filters.opportunity);
  }
  query.set("cursor", cursor);

  return `/jobs?${query.toString()}`;
}

function formatWage(amount: number, unit: PublicJobCard["wageUnit"]) {
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

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    location?: string | string[];
    minWage?: string | string[];
    maxWage?: string | string[];
    opportunity?: string | string[];
    cursor?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const [referenceData, jobPage] = await Promise.all([
    getPublicJobReferenceData(),
    listPublishedJobs({
      search: filters.search,
      categoryId: filters.categoryId === "all" ? undefined : filters.categoryId,
      areaId: filters.areaId === "all" ? undefined : filters.areaId,
      minimumWage: parsePositiveInteger(filters.minimumWage),
      maximumWage: parsePositiveInteger(filters.maximumWage),
      opportunity: filters.opportunity as OpportunityFilter,
      cursor: firstQueryValue(resolvedSearchParams.cursor) || undefined,
    }),
  ]);
  const filteredJobs = jobPage.items.map(toJobCardView);
  const filterKey = `${filters.search}:${filters.categoryId}:${filters.areaId}:${filters.minimumWage}:${filters.maximumWage}:${filters.opportunity}`;
  const areaLabel =
    filters.areaId === "all"
      ? "Semua area"
      : referenceData.areas.find((area) => area.id === filters.areaId)?.name ??
        "Area tidak tersedia";

  return (
    <PublicShell>
      <header className="bg-[#edf3ee]">
        <div className="mx-auto max-w-[80rem] px-4 py-9 sm:px-6 sm:py-11 lg:px-8">
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-4xl">
            Cari pekerjaan
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground">
            Bandingkan tugas, upah, jadwal, dan area umum. Alamat lengkap baru
            dibuka kepada pekerja yang diterima.
          </p>
        </div>
      </header>

      <section className="py-8 sm:py-10">
        <div className="mx-auto grid max-w-[80rem] items-start gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-8 lg:px-8">
          <JobFilters
            key={filterKey}
            initialValues={filters}
            categories={referenceData.categories}
            areas={referenceData.areas}
          />

          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div aria-live="polite">
                <p className="text-sm text-muted-foreground">{areaLabel}</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
                  {filteredJobs.length} pekerjaan pada halaman ini
                </h2>
              </div>
              <span className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-muted px-3 text-sm text-muted-foreground">
                <ListFilter className="size-4" aria-hidden="true" />
                Urutan: boost aktif, lalu terbaru
              </span>
            </div>

            {filteredJobs.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="mt-7">
                <EmptyState
                  title="Belum ada pekerjaan yang cocok"
                  description="Coba kata kunci yang lebih umum atau atur ulang kategori dan jenis kesempatan."
                  actionLabel="Atur ulang filter"
                  actionHref="/jobs"
                />
              </div>
            )}

            {jobPage.nextCursor ? (
              <nav
                aria-label="Pagination pekerjaan"
                className="mt-7 flex justify-center"
              >
                <Button variant="outline" asChild>
                  <Link href={jobsHref(filters, jobPage.nextCursor)}>
                    Lihat pekerjaan berikutnya
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </nav>
            ) : null}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
