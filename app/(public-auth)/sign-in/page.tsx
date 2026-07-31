import { AuthPanel } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";
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
    <AuthPanel
      title="Masuk ke Rintara"
      description="Lanjutkan pekerjaan, lamaran, dan kesepakatanmu."
    >
      {/* active="sign-in" */}
      <SignInForm
        initialErrorMessage={authenticationFailed ? "Tautan masuk tidak dapat diproses atau sudah kedaluwarsa. Silakan masuk kembali." : null}
        nextPath={nextPath}
      />
    </AuthPanel>
  );
}
