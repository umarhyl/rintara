import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { AuthPanel } from "@/features/auth/components/auth-shell";

export const metadata = { title: "Lupa kata sandi" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const query = await searchParams;

  return (
    <AuthPanel
      title="Pulihkan akun"
      description="Masukkan email akunmu. Kami akan mengirim tautan untuk membuat kata sandi baru."
    >
      <ForgotPasswordForm
        initialErrorMessage={
          query.error === "recovery_failed"
            ? "Tautan pemulihan tidak dapat diproses atau sudah kedaluwarsa. Minta tautan baru."
            : null
        }
      />
    </AuthPanel>
  );
}
