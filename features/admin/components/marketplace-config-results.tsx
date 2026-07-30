import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/rintara/status-badge";
import {
  WageGuidelineConfigForm,
  CategoryStatusForm,
  PilotAreaStatusForm,
  WageGuidelineStatusForm,
} from "@/features/admin/components/marketplace-config-forms";
import type { AdminMarketplaceConfig } from "@/server/queries/admin/marketplace-config";

export type ConfigCursors = {
  areaCursor?: string;
  categoryCursor?: string;
  wageGuidelineCursor?: string;
};

type ConfigPromise = Promise<AdminMarketplaceConfig>;

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function unitLabel(unit: "hour" | "day" | "job") {
  if (unit === "hour") return "jam";
  if (unit === "day") return "hari";
  return "pekerjaan";
}

function nextPageHref(
  cursors: ConfigCursors,
  key: keyof ConfigCursors,
  nextCursor: string,
) {
  const query = new URLSearchParams();
  const nextCursors = { ...cursors, [key]: nextCursor };

  for (const [name, value] of Object.entries(nextCursors)) {
    if (value) query.set(name, value);
  }

  return `/admin/wage-guidelines?${query.toString()}`;
}

export function MarketplaceStatsLoading() {
  return <Skeleton className="h-8 w-56 rounded-md" />;
}

export async function MarketplaceStats({
  configPromise,
}: {
  configPromise: ConfigPromise;
}) {
  const config = await configPromise;
  const activeAreas = config.areas.filter((area) => area.isActive);
  const activeCategories = config.categories.filter(
    (category) => category.isActive,
  );
  const activeGuidelines = config.wageGuidelines.filter(
    (guideline) => guideline.isActive,
  );

  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <div className="flex items-baseline gap-2">
        <dt className="text-muted-foreground">Kategori</dt>
        <dd className="font-semibold tabular-nums">
          {activeCategories.length}
        </dd>
      </div>
      <div className="flex items-baseline gap-2">
        <dt className="text-muted-foreground">Area</dt>
        <dd className="font-semibold tabular-nums">{activeAreas.length}</dd>
      </div>
      <div className="flex items-baseline gap-2">
        <dt className="text-muted-foreground">Panduan</dt>
        <dd className="font-semibold tabular-nums">
          {activeGuidelines.length}
        </dd>
      </div>
    </dl>
  );
}

export function WageGuidelineFormLoading() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {[1, 2, 3, 4, 5, 6].map((field) => (
        <div key={field} className="grid gap-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-11 rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-11 w-40 rounded-xl sm:col-span-2" />
    </div>
  );
}

export async function WageGuidelineFormWithConfig({
  configPromise,
}: {
  configPromise: ConfigPromise;
}) {
  const config = await configPromise;

  return (
    <WageGuidelineConfigForm
      areas={config.activeAreaOptions}
      categories={config.activeCategoryOptions}
    />
  );
}

export function MarketplaceConfigListsLoading() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <article
          key={item}
          className="rounded-xl border border-border bg-card p-5"
        >
          <Skeleton className="h-5 w-32 rounded-md" />
          <div className="mt-4 grid gap-4 border-y border-border/70 py-4">
            {[1, 2, 3].map((row) => (
              <div key={row} className="grid gap-2">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export async function MarketplaceConfigLists({
  configPromise,
  cursors,
}: {
  configPromise: ConfigPromise;
  cursors: ConfigCursors;
}) {
  const config = await configPromise;

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <article className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Kategori</h3>
        <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
          {config.categories.map((category) => (
            <div key={category.id} className="grid gap-2 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{category.name}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    tone={category.isActive ? "success" : "neutral"}
                  >
                    {category.isActive ? "Aktif" : "Nonaktif"}
                  </StatusBadge>
                  <CategoryStatusForm
                    id={category.id}
                    isActive={category.isActive}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {category.slug} · risiko {category.riskLevel}
              </p>
            </div>
          ))}
        </div>
        {config.categoryNextCursor ? (
          <nav
            aria-label="Navigasi kategori"
            className="mt-4 flex justify-end"
          >
            <Button variant="outline" size="sm" className="min-h-11" asChild>
              <Link
                href={nextPageHref(
                  cursors,
                  "categoryCursor",
                  config.categoryNextCursor,
                )}
              >
                Kategori berikutnya
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        ) : null}
      </article>

      <article className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Pilot area</h3>
        <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
          {config.areas.map((area) => (
            <div key={area.id} className="grid gap-2 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{area.name}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={area.isActive ? "success" : "neutral"}>
                    {area.isActive ? "Aktif" : "Nonaktif"}
                  </StatusBadge>
                  <PilotAreaStatusForm
                    id={area.id}
                    isActive={area.isActive}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {area.code} · {area.level}
              </p>
            </div>
          ))}
        </div>
        {config.areaNextCursor ? (
          <nav
            aria-label="Navigasi area pilot"
            className="mt-4 flex justify-end"
          >
            <Button variant="outline" size="sm" className="min-h-11" asChild>
              <Link
                href={nextPageHref(
                  cursors,
                  "areaCursor",
                  config.areaNextCursor,
                )}
              >
                Area berikutnya
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        ) : null}
      </article>

      <article className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Panduan Upah</h3>
        <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
          {config.wageGuidelines.map((guideline) => (
            <div key={guideline.id} className="grid gap-2 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{guideline.categoryName}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    tone={guideline.isActive ? "success" : "neutral"}
                  >
                    {guideline.isActive ? "Aktif" : "Nonaktif"}
                  </StatusBadge>
                  <WageGuidelineStatusForm
                    id={guideline.id}
                    isActive={guideline.isActive}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {guideline.areaName} ·{" "}
                {formatRupiah(guideline.minimumAmount)}
                {" - "}
                {formatRupiah(guideline.recommendedAmount)} /{" "}
                {unitLabel(guideline.unit)}
              </p>
              <p className="text-xs text-muted-foreground">
                Efektif {guideline.effectiveFrom}
                {guideline.effectiveTo
                  ? ` sampai ${guideline.effectiveTo}`
                  : ""}
                {guideline.isSimulated ? " · simulasi" : ""}
              </p>
            </div>
          ))}
        </div>
        {config.wageGuidelineNextCursor ? (
          <nav
            aria-label="Navigasi Panduan Upah"
            className="mt-4 flex justify-end"
          >
            <Button variant="outline" size="sm" className="min-h-11" asChild>
              <Link
                href={nextPageHref(
                  cursors,
                  "wageGuidelineCursor",
                  config.wageGuidelineNextCursor,
                )}
              >
                Panduan berikutnya
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        ) : null}
      </article>
    </div>
  );
}
