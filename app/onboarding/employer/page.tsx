import { AuthShell } from "@/features/auth/components/auth-shell";
import { EmployerOnboardingForm } from "@/features/onboarding/components/employer-onboarding-form";
import { safeApplicationPath } from "@/server/auth/redirects";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil pemberi kerja" };

export default async function EmployerOnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const query = await searchParams;
  const rawNextPath = typeof query.next === "string" ? query.next : null;
  const nextPath = rawNextPath ? safeApplicationPath(rawNextPath, "/employer/dashboard") : undefined;
  const { getOnboardingAreaOptions } = await import(
    "@/server/queries/onboarding-reference-data"
  );
  const areas = await getOnboardingAreaOptions();

  return (
    <AuthShell
      title="Lengkapi profil pemberi kerja"
      description="Bantu pekerja mengenali siapa yang menawarkan pekerjaan dan di area mana kegiatan berlangsung."
      eyebrow="Profil pemberi kerja"
      stage={3}
    >
      <EmployerOnboardingForm areas={areas} nextPath={nextPath} />
    </AuthShell>
  );
}
