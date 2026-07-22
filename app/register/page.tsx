import { AuthRouteSwitch } from "@/features/auth/components/auth-route-switch";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
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
    <AuthShell title="Mulai dari satu kesempatan" description="Buat akses awal, lalu pilih satu peran aktif sebagai pekerja atau pemberi kerja." eyebrow="Mulai jejakmu" stage={1}>
      <AuthRouteSwitch active="register" nextPath={nextPath} />
      <RegisterForm nextPath={nextPath} />
    </AuthShell>
  );
}
