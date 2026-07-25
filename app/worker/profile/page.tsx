import Link from "next/link";
import { BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
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
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Identitas kerja"
        title="Profil pekerja"
        description="Kelola informasi dasar, ketersediaan, dan kategori pekerjaan yang kamu minati."
      />

      <div className="grid gap-9 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-12">
        <aside className="relative isolate overflow-hidden rounded-2xl bg-[#0a1c3f] p-7 text-white shadow-[0_8px_8px_-6px_rgb(15_42_104/0.72)] lg:sticky lg:top-24">
          <span
            className="grid size-16 place-items-center rounded-full border border-white/15 bg-white/10 text-xl font-semibold"
            aria-hidden="true"
          >
            {initialsFor(profile.displayName)}
          </span>
          <p className="mt-7 text-sm font-semibold text-blue-200">Pekerja</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
            {profile.displayName}
          </h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-blue-100/80">
            <MapPin className="size-4" aria-hidden="true" />
            {profile.areaName}
          </p>

          <div className="mt-8 grid gap-5 border-t border-white/15 pt-6 text-base leading-7 text-blue-100/80">
            <div className="flex gap-3">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-emerald-300"
                aria-hidden="true"
              />
              <p>Data kontak tidak ditampilkan melalui profil ini.</p>
            </div>
            <div className="flex gap-3">
              <BadgeCheck
                className="mt-0.5 size-4 shrink-0 text-blue-300"
                aria-hidden="true"
              />
              <p>
                Status pengalaman berasal dari Bukti Kerja, bukan dari pilihan
                minat.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="theme-static-light mt-7 w-full rounded-full border-white/20 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/worker/passport">Lihat Paspor Rintara</Link>
          </Button>
        </aside>

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
      </div>
    </div>
  );
}
