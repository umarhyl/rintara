import { Suspense } from "react";
import { PageHeader } from "@/features/dashboard/components/page-header";
import {
  CategoryConfigForm,
  PilotAreaConfigForm,
} from "@/features/admin/components/marketplace-config-forms";
import {
  MarketplaceConfigLists,
  MarketplaceConfigListsLoading,
  MarketplaceStats,
  MarketplaceStatsLoading,
  WageGuidelineFormLoading,
  WageGuidelineFormWithConfig,
  type ConfigCursors,
} from "@/features/admin/components/marketplace-config-results";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { getAdminMarketplaceConfig } from "@/server/queries/admin/marketplace-config";

export default async function WageGuidelinesPage({
  searchParams,
}: {
  searchParams: Promise<{
    areaCursor?: string | string[];
    categoryCursor?: string | string[];
    wageGuidelineCursor?: string | string[];
  }>;
}) {
  const account = await requireDashboardPageRole(
    "admin",
    "/admin/wage-guidelines",
  );
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
  const configPromise = getAdminMarketplaceConfig(cursors, account);

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Konfigurasi marketplace"
        description="Kelola kategori, area pilot, dan Panduan Upah untuk Kesempatan Pertama."
        action={
          <Suspense fallback={<MarketplaceStatsLoading />}>
            <MarketplaceStats configPromise={configPromise} />
          </Suspense>
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
          <Suspense fallback={<WageGuidelineFormLoading />}>
            <WageGuidelineFormWithConfig configPromise={configPromise} />
          </Suspense>
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

        <Suspense fallback={<MarketplaceConfigListsLoading />}>
          <MarketplaceConfigLists
            configPromise={configPromise}
            cursors={cursors}
          />
        </Suspense>
      </section>
    </div>
  );
}
