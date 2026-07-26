import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import {
  CategoryConfigForm,
  CategoryStatusForm,
  PilotAreaStatusForm,
  PilotAreaConfigForm,
  WageGuidelineConfigForm,
  WageGuidelineStatusForm,
} from "@/features/admin/components/marketplace-config-forms";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { getAdminMarketplaceConfig } from "@/server/queries/admin/marketplace-config";

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

type ConfigCursors = {
  areaCursor?: string;
  categoryCursor?: string;
  wageGuidelineCursor?: string;
};

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

export default async function WageGuidelinesPage({
  searchParams,
}: {
  searchParams: Promise<{
    areaCursor?: string | string[];
    categoryCursor?: string | string[];
    wageGuidelineCursor?: string | string[];
  }>;
}) {
  await requireDashboardPageRole("admin", "/admin/wage-guidelines");
  const params = await searchParams;
  const cursors: ConfigCursors = {
    areaCursor:
      typeof params.areaCursor === "string" ? params.areaCursor : undefined,
    categoryCursor:
      typeof params.categoryCursor === "string"
        ? params.categoryCursor
        : undefined,
    wageGuidelineCursor:
      typeof params.wageGuidelineCursor === "string"
        ? params.wageGuidelineCursor
        : undefined,
  };
  const config = await getAdminMarketplaceConfig(cursors);

  const activeAreas = config.areas.filter((area) => area.isActive);
  const activeCategories = config.categories.filter(
    (category) => category.isActive,
  );
  const activeGuidelines = config.wageGuidelines.filter(
    (guideline) => guideline.isActive,
  );

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Konfigurasi marketplace"
        description="Kelola kategori, area pilot, dan Panduan Upah untuk Kesempatan Pertama."
        action={
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">Kategori</dt>
              <dd className="font-semibold tabular-nums">{activeCategories.length}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">Area</dt>
              <dd className="font-semibold tabular-nums">{activeAreas.length}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">Panduan</dt>
              <dd className="font-semibold tabular-nums">{activeGuidelines.length}</dd>
            </div>
          </dl>
        }
      />

      <section
        aria-labelledby="category-config-title"
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="border-b border-border/70 p-5 sm:p-6">
          <div>
            <h2
              id="category-config-title"
              className="text-xl font-semibold tracking-tight"
            >
              Buat kategori
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Kategori aktif tersedia untuk profil pekerja, pencarian, dan form
              pekerjaan employer.
            </p>
          </div>
        </div>
        <div className="px-5 py-6 sm:px-7">
          <CategoryConfigForm />
        </div>
      </section>

      <section
        aria-labelledby="area-config-title"
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="border-b border-border/70 p-5 sm:p-6">
          <div>
            <h2
              id="area-config-title"
              className="text-xl font-semibold tracking-tight"
            >
              Kelola area pilot
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Area pilot disimpan sebagai kota/kabupaten agar bisa dipakai oleh
              onboarding, pekerjaan, dan Panduan Upah.
            </p>
          </div>
        </div>
        <div className="px-5 py-6 sm:px-7">
          <PilotAreaConfigForm />
        </div>
      </section>

      <section
        aria-labelledby="guideline-config-title"
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="border-b border-border/70 p-5 sm:p-6">
          <div>
            <h2
              id="guideline-config-title"
              className="text-xl font-semibold tracking-tight"
            >
              Konfigurasi upah per area
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Setiap panduan berlaku untuk satu area, kategori, dan satuan upah.
              Nilai ini menjadi dasar penyesuaian lokasi saat pekerjaan
              diterbitkan.
            </p>
          </div>
        </div>
        <div className="px-5 py-6 sm:px-7">
          <WageGuidelineConfigForm
            areas={config.activeAreaOptions}
            categories={config.activeCategoryOptions}
          />
        </div>
      </section>

      <section
        aria-labelledby="existing-config-title"
        className="grid gap-5"
      >
        <div className="border-b border-border/70 pb-4">
          <h2
            id="existing-config-title"
            className="text-xl font-semibold tracking-tight"
          >
            Konfigurasi tersimpan
          </h2>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <article className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold">Kategori</h3>
            <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
              {config.categories.map((category) => (
                <div key={category.id} className="grid gap-2 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{category.name}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={category.isActive ? "success" : "neutral"}>
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
                      <PilotAreaStatusForm id={area.id} isActive={area.isActive} />
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
                      <StatusBadge tone={guideline.isActive ? "success" : "neutral"}>
                        {guideline.isActive ? "Aktif" : "Nonaktif"}
                      </StatusBadge>
                      <WageGuidelineStatusForm
                        id={guideline.id}
                        isActive={guideline.isActive}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {guideline.areaName} · {formatRupiah(guideline.minimumAmount)}
                    {" - "}
                    {formatRupiah(guideline.recommendedAmount)} /{" "}
                    {unitLabel(guideline.unit)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Efektif {guideline.effectiveFrom}
                    {guideline.effectiveTo ? ` sampai ${guideline.effectiveTo}` : ""}
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
      </section>
    </div>
  );
}
