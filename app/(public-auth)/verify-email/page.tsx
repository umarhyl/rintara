import { AuthPanel } from "@/features/auth/components/auth-shell";
import { EmailVerificationForm } from "@/features/auth/components/email-verification-form";

export const metadata = { title: "Verifikasi email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const query = await searchParams;

  return (
    <AuthPanel
      title="Verifikasi email"
      description="Minta tautan baru untuk mengaktifkan akun Rintara dan melanjutkan pendaftaran."
    >
      <EmailVerificationForm
        initialErrorMessage={
          query.error === "verification_failed"
            ? "Tautan verifikasi tidak valid atau sudah kedaluwarsa. Minta tautan baru."
            : null
        }
      />
    </AuthPanel>
  );
}
