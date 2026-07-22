import { ArrowDown, SlidersHorizontal } from "lucide-react";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { EmptyState } from "@/components/rintara/empty-state";
import { JobCard } from "@/components/rintara/job-card";
import {
  JobFilters,
  type JobFilterValues,
} from "@/components/rintara/job-filters";
import { PublicShell } from "@/components/rintara/public-shell";
import {
  getPublicJobReferenceData,
  listPublishedJobs,
  type OpportunityFilter,
  type PublicJobCard,
} from "@/server/queries/jobs/public-jobs";

export const metadata = { title: "Cari pekerjaan" };

const opportunityValues = ["all", "first", "general"] as const;
const pageSize = 10;

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
    minimumWage: firstQueryValue(searchParams.minWage).replace(/\D/g, "").slice(0, 12),
    maximumWage: firstQueryValue(searchParams.maxWage).replace(/\D/g, "").slice(0, 12),
    opportunity: opportunityValues.includes(
      rawOpportunity as JobFilterValues["opportunity"],
    )
      ? (rawOpportunity as JobFilterValues["opportunity"])
      : "all",
  };
}

function parsePage(value: string | string[] | undefined) {
  return parsePositiveInteger(firstQueryValue(value)) ?? 1;
}

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
    page?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const page = parsePage(resolvedSearchParams.page);
  const [referenceData, jobPage] = await Promise.all([
    getPublicJobReferenceData(),
    listPublishedJobs({
      search: filters.search,
      categoryId: filters.categoryId === "all" ? undefined : filters.categoryId,
      areaId: filters.areaId === "all" ? undefined : filters.areaId,
      minimumWage: parsePositiveInteger(filters.minimumWage),
      maximumWage: parsePositiveInteger(filters.maximumWage),
      opportunity: filters.opportunity as OpportunityFilter,
      page,
      pageSize,
    }),
  ]);
  const filteredJobs = jobPage.items.map(toJobCardView);
  const filterKey = `${filters.search}:${filters.categoryId}:${filters.areaId}:${filters.minimumWage}:${filters.maximumWage}:${filters.opportunity}`;

  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden border-b border-border/70">
        <AmbientBackdrop variant="page" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-8">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-primary">
              <span className="h-px w-8 bg-primary/60" aria-hidden="true" />
              PEKERJAAN LOKAL
            </p>
            <h1 className="mt-7 max-w-3xl text-balance text-[3.15rem] font-semibold leading-[1.02] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Ketentuan jelas sebelum kamu{" "}
              <span className="font-serif font-normal italic text-primary">
                melangkah.
              </span>
            </h1>
          </div>
          <div className="lg:pb-2">
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              Bandingkan tugas, upah, jadwal, dan area umum. Alamat lengkap tetap
              privat sampai satu pekerja diterima.
            </p>
            <div className="mt-8 flex items-end gap-5 border-y border-border/80 py-5">
              <p className="text-4xl font-semibold tracking-[-0.05em]">
                {jobPage.items.length}
              </p>
              <p className="pb-1 text-base leading-7 text-muted-foreground">
                pekerjaan tampil
                <br />
                halaman {jobPage.page}
              </p>
              <ArrowDown
                className="mb-1 ml-auto size-5 text-primary"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-10 sm:py-14" data-scroll-section>
        <AmbientBackdrop variant="page" className="opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 -mt-20 sm:-mt-24">
            <JobFilters
              key={filterKey}
              initialValues={filters}
              categories={referenceData.categories}
              areas={referenceData.areas}
            />
          </div>

          <div className="mt-12 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div aria-live="polite">
              <p className="text-sm text-muted-foreground">
                Ditemukan di Bandung
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
                {filteredJobs.length} pekerjaan terbuka
              </h2>
            </div>
            <span className="flex min-h-11 w-fit items-center gap-2 rounded-full px-3 text-sm text-muted-foreground">
              <SlidersHorizontal aria-hidden="true" />
              Urutan: boost aktif, lalu terbaru
            </span>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-2" data-reveal-list>
              {filteredJobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  featured={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="Belum ada pekerjaan yang cocok"
                description="Coba kata kunci yang lebih umum atau atur ulang kategori dan jenis kesempatan."
                actionLabel="Atur ulang filter"
                actionHref="/jobs"
              />
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20" data-scroll-section>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8">
          <div>
            <p className="text-sm font-medium text-primary">
              Baca sebelum melamar
            </p>
            <h2 className="mt-3 max-w-md text-balance text-3xl font-semibold leading-tight tracking-[-0.04em]">
              Pilih pekerjaan dengan tenang.
            </h2>
          </div>
          <div className="grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0" data-reveal-list>
            <p className="py-5 text-base leading-7 text-muted-foreground sm:px-5 sm:first:pl-0">
              Upah dan cara pembayaran terlihat sejak awal.
            </p>
            <p className="py-5 text-base leading-7 text-muted-foreground sm:px-5">
              Tidak ada proses menawar upah di dalam lamaran.
            </p>
            <p className="py-5 text-base leading-7 text-muted-foreground sm:px-5 sm:last:pr-0">
              Alamat lengkap hanya dibuka kepada pekerja yang diterima.
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
