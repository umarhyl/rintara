import { AuthShell } from "@/features/auth/components/auth-shell";
import { RoleSelection } from "@/features/onboarding/components/role-selection";
import { safeApplicationPath } from "@/server/auth/redirects";

export const metadata = { title: "Pilih peran" };

export default async function RolePage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const query = await searchParams;
  const rawNextPath = typeof query.next === "string" ? query.next : null;
  const nextPath = rawNextPath ? safeApplicationPath(rawNextPath, "/account/continue") : undefined;

  return <AuthShell title="Pilih peranmu" description="Setiap akun memiliki satu peran aktif. Pilih sebagai pekerja atau pemberi kerja." eyebrow="Tentukan jalurmu" stage={2}><RoleSelection nextPath={nextPath} /></AuthShell>;
}
