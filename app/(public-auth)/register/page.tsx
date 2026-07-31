import { AuthPanel } from "@/features/auth/components/auth-shell";
import { RegisterRoleGate } from "@/features/auth/components/register-role-gate";
import { safeApplicationPath } from "@/server/auth/redirects";

export const metadata = { title: "Buat akun" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawNextPath = typeof query.next === "string" ? query.next : null;
  const nextPath = rawNextPath ? safeApplicationPath(rawNextPath, "/account/continue") : undefined;

  return (
    <AuthPanel
      title="Buat akun Rintara"
      description="Pilih peran yang sesuai, lalu lengkapi data akunmu."
    >
      <RegisterRoleGate active="register" nextPath={nextPath} />
    </AuthPanel>
  );
}
