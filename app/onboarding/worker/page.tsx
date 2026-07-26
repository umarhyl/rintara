import { AuthShell } from "@/features/auth/components/auth-shell";
import { WorkerOnboardingForm } from "@/features/onboarding/components/worker-onboarding-form";
import { safeApplicationPath } from "@/server/auth/redirects";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil pekerja" };

export default async function WorkerOnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const query = await searchParams;
  const rawNextPath = typeof query.next === "string" ? query.next : null;
  const nextPath = rawNextPath ? safeApplicationPath(rawNextPath, "/worker/dashboard") : undefined;
  const { getOnboardingReferenceData } = await import(
    "@/server/queries/onboarding-reference-data"
  );
  const referenceData = await getOnboardingReferenceData();

  return (
    <AuthShell
      title="Lengkapi profil pekerja"
      description="Isi informasi dasar agar pekerjaan yang relevan lebih mudah ditemukan."
      stage={3}
    >
      <WorkerOnboardingForm
        areas={referenceData.areas}
        categories={referenceData.categories}
        nextPath={nextPath}
      />
    </AuthShell>
  );
}
