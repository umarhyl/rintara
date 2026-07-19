import { AuthRouteSwitch } from "@/components/rintara/auth-route-switch";
import { AuthShell } from "@/components/rintara/auth-shell";
import { SignInForm } from "@/components/rintara/sign-in-form";
import { safeApplicationPath } from "@/server/auth/redirects";

export const metadata = { title: "Masuk" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const query = await searchParams;
  const authenticationFailed = query.error === "authentication_failed";
  const nextPath = safeApplicationPath(typeof query.next === "string" ? query.next : null, "/account/continue");

  return (
    <AuthShell title="Lanjutkan jejakmu" description="Masuk untuk menemukan kesempatan berikutnya atau mengelola pekerjaan yang sedang berjalan." eyebrow="Selamat datang kembali">
      <AuthRouteSwitch active="sign-in" nextPath={nextPath !== "/account/continue" ? nextPath : undefined} />
      <SignInForm
        initialErrorMessage={authenticationFailed ? "Tautan masuk tidak dapat diproses atau sudah kedaluwarsa. Silakan masuk kembali." : null}
        nextPath={nextPath}
      />
    </AuthShell>
  );
}
