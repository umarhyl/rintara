import {
  BookOpenCheck,
  CheckCircle2,
  CircleDashed,
  MapPinned,
  Tags,
} from "lucide-react";
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

export default async function WageGuidelinesPage() {
  await requireDashboardPageRole("admin", "/admin/wage-guidelines");
  const config = await getAdminMarketplaceConfig();

  const activeAreas = config.areas.filter((area) => area.isActive);
  const activeCategories = config.categories.filter(
    (category) => category.isActive,
  );
  const activeGuidelines = config.wageGuidelines.filter(
    (guideline) => guideline.isActive,
  );

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Konfigurasi marketplace"
        title="Kategori, area, dan Panduan Upah"
        description="Kelola konfigurasi operasional yang menentukan area pilot, kategori pekerjaan, dan kelayakan upah untuk Kesempatan Pertama."
        action={
          <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card/75 text-center">
            <div className="px-4 py-3">
              <p className="text-2xl font-semibold tracking-[-0.04em]">
                {activeCategories.length}
              </p>
              <p className="text-xs text-muted-foreground">kategori aktif</p>
            </div>
            <div className="border-l border-border px-4 py-3">
              <p className="text-2xl font-semibold tracking-[-0.04em]">
                {activeAreas.length}
              </p>
              <p className="text-xs text-muted-foreground">area pilot</p>
            </div>
            <div className="border-l border-border px-4 py-3">
              <p className="text-2xl font-semibold tracking-[-0.04em]">
                {activeGuidelines.length}
              </p>
              <p className="text-xs text-muted-foreground">panduan aktif</p>
            </div>
          </div>
        }
      />

      <section className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
        <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/72 px-6 py-8 backdrop-blur-sm sm:px-8">
          <div
            className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/[0.07] blur-3xl"
            aria-hidden="true"
          />
          <BookOpenCheck className="size-7 text-primary" aria-hidden="true" />
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Panduan aktif
          </p>
          <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-[-0.04em]">
            Referensi upah per lokasi dan kategori.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Nilai minimum dipakai untuk menentukan kepatuhan upah. Rekomendasi
            maksimum membantu admin memberi konteks penyesuaian lokasi tanpa
            menjadikannya klaim hukum.
          </p>
          <p className="mt-8 flex items-start gap-3 border-t border-border/70 pt-5 text-base leading-7 text-muted-foreground">
            <CircleDashed
              className="mt-0.5 size-4.5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            Kesempatan Pertama hanya bisa diterbitkan saat kategori, area, dan
            panduan upah aktif tersedia.
          </p>
        </div>

        <section
          aria-labelledby="guideline-route"
          className="rounded-[1.75rem] border border-border/75 bg-card/72 p-6 backdrop-blur-sm sm:p-7"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Jejak penerbitan
          </p>
          <h2
            id="guideline-route"
            className="mt-2 text-xl font-semibold tracking-[-0.025em]"
          >
            Dari konfigurasi ke marketplace
          </h2>
          <ol className="relative mt-8 grid gap-8 before:absolute before:bottom-3 before:left-[0.3rem] before:top-3 before:w-px before:bg-border">
            {[
              ["Pilot area", "Area aktif muncul di onboarding, filter, dan form pekerjaan."],
              ["Kategori", "Kategori aktif menentukan jenis pekerjaan dan aturan First Opportunity."],
              ["Panduan Upah", "Nilai aktif dipakai saat employer menerbitkan pekerjaan."],
            ].map(([title, detail], index) => (
              <li key={title} className="relative grid grid-cols-[1.1rem_1fr] gap-4">
                <span
                  className={`mt-1 size-2.5 rounded-full ring-4 ring-card ${
                    index < 2 ? "bg-primary" : "bg-muted-foreground/50"
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-base leading-7 text-muted-foreground">
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </section>

      <section
        aria-labelledby="category-config-title"
        className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/82"
      >
        <div className="grid gap-4 border-b border-border/70 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              <Tags className="size-4" aria-hidden="true" />
              Kategori pekerjaan
            </p>
            <h2
              id="category-config-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.03em]"
            >
              Buat kategori
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Kategori aktif tersedia untuk profil pekerja, pencarian, dan form
              pekerjaan employer.
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
            Aksi tercatat di audit
          </p>
        </div>
        <div className="px-5 py-6 sm:px-7">
          <CategoryConfigForm />
        </div>
      </section>

      <section
        aria-labelledby="area-config-title"
        className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/82"
      >
        <div className="grid gap-4 border-b border-border/70 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              <MapPinned className="size-4" aria-hidden="true" />
              Pilot area
            </p>
            <h2
              id="area-config-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.03em]"
            >
              Kelola area pilot
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
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
        className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/82"
      >
        <div className="grid gap-4 border-b border-border/70 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Panduan Upah
            </p>
            <h2
              id="guideline-config-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.03em]"
            >
              Konfigurasi upah per area
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Setiap panduan berlaku untuk satu area, kategori, dan satuan upah.
              Nilai ini menjadi dasar penyesuaian lokasi saat pekerjaan
              diterbitkan.
            </p>
          </div>
        </div>
        <div className="px-5 py-6 sm:px-7">
          <WageGuidelineConfigForm
            areas={config.areas}
            categories={config.categories}
          />
        </div>
      </section>

      <section
        aria-labelledby="existing-config-title"
        className="grid gap-5"
      >
        <div className="border-b border-border/70 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Data tersimpan
          </p>
          <h2
            id="existing-config-title"
            className="mt-2 text-2xl font-semibold tracking-[-0.03em]"
          >
            Ringkasan konfigurasi
          </h2>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <article className="rounded-[1.5rem] border border-border/75 bg-card/72 p-5">
            <h3 className="font-semibold">Kategori</h3>
            <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
              {config.categories.slice(0, 8).map((category) => (
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
          </article>

          <article className="rounded-[1.5rem] border border-border/75 bg-card/72 p-5">
            <h3 className="font-semibold">Pilot area</h3>
            <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
              {config.areas.slice(0, 8).map((area) => (
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
          </article>

          <article className="rounded-[1.5rem] border border-border/75 bg-card/72 p-5">
            <h3 className="font-semibold">Panduan Upah</h3>
            <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
              {config.wageGuidelines.slice(0, 8).map((guideline) => (
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
          </article>
        </div>
      </section>
    </div>
  );
}
