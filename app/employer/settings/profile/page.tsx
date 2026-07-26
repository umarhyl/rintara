import { Metadata } from "next";
import { getOnboardingAreaOptions } from "@/server/queries/onboarding-reference-data";
import { EmployerProfileForm } from "@/features/employer/components/employer-profile-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export const metadata: Metadata = {
  title: "Profil Pemberi Kerja | Rintara",
  description: "Kelola profil bisnis dan status pemberi kesempatan.",
};

export default async function EmployerProfileSettingsPage() {
  await requireDashboardPageRole("employer", "/employer/settings/profile");

  const [
    { getEmployerProfile },
    areas
  ] = await Promise.all([
    import("@/server/queries/profiles/get-employer-profile"),
    getOnboardingAreaOptions()
  ]);
  const profile = await getEmployerProfile();

  return (
    <div className="mx-auto grid max-w-5xl gap-7">
      <PageHeader
        title="Profil pemberi kerja"
        description="Kelola informasi yang ditampilkan pada pekerjaan terbit."
      />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="profile-form-title">
          <h2 id="profile-form-title" className="text-lg font-semibold">
            Informasi profil
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Informasi ini muncul pada setiap pekerjaan yang kamu terbitkan.
          </p>
          <div className="mt-5 border-t border-border/75 pt-5">
            <EmployerProfileForm areas={areas} profile={profile} />
          </div>
        </section>

        <aside className="border-y border-border/75 py-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Status akun</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Dihitung otomatis dari pekerjaan yang selesai.
          </p>
          <dl className="mt-4 divide-y divide-border/70 border-y border-border/70">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-muted-foreground">Pekerjaan selesai</dt>
              <dd className="font-semibold tabular-nums">{profile.completedJobsCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-muted-foreground">Pemberi kesempatan</dt>
              <dd>
                {profile.isOpportunityGiver ? (
                  <Badge variant="default">Aktif</Badge>
                ) : (
                  <Badge variant="secondary">Belum aktif</Badge>
                )}
              </dd>
            </div>
          </dl>
          {!profile.isOpportunityGiver ? (
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Status aktif setelah pekerjaan Kesempatan Pertama selesai sesuai
              ketentuan.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
