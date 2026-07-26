import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { WorkerProfileForm } from "@/features/onboarding/components/worker-onboarding-form";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil pekerja | Rintara" };

function initialsFor(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function WorkerProfilePage() {
  await requireDashboardPageRole("worker", "/worker/profile");

  const [{ getMyProfile }, { getOnboardingReferenceData }] =
    await Promise.all([
      import("@/server/queries/profiles/get-worker-profile"),
      import("@/server/queries/onboarding-reference-data"),
    ]);
  const [profile, referenceData] = await Promise.all([
    getMyProfile(),
    getOnboardingReferenceData(),
  ]);

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Profil pekerja"
        description="Perbarui identitas kerja, ketersediaan, dan kategori minatmu."
      />

      <section className="grid gap-4 border-y border-border/75 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <span
          className="grid size-12 place-items-center rounded-xl bg-primary/10 font-semibold text-primary"
          aria-hidden="true"
        >
          {initialsFor(profile.displayName)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {profile.displayName}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>Pekerja</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {profile.areaName}
            </span>
          </div>
        </div>
        <Button variant="outline" className="min-h-11 w-full sm:w-auto" asChild>
          <Link href="/worker/passport">Lihat Paspor Rintara</Link>
        </Button>
      </section>

      <div className="grid gap-6">
        <WorkerProfileForm
          areas={referenceData.areas}
          categories={referenceData.categories}
          initialProfile={{
            displayName: profile.displayName,
            areaId: profile.areaId,
            areaName: profile.areaName,
            bio: profile.bio,
            availabilityNote: profile.availabilityNote,
            categoryInterestIds: profile.categoryInterests.map(({ id }) => id),
            verifiedCategoryIds: profile.verifiedCategoryIds,
          }}
        />

        <aside className="flex gap-3 border-t border-border/75 pt-5 text-sm leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <p>
            Data kontak tidak ditampilkan di profil. Status pengalaman berasal
            dari Bukti Kerja, bukan dari pilihan minat.
          </p>
        </aside>
      </div>
    </div>
  );
}
