import { AuthPanel } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Buat kata sandi baru" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthPanel
      title="Buat kata sandi baru"
      description="Pilih kata sandi baru untuk akun Rintara kamu."
    >
      <ResetPasswordForm hasSession={user !== null} />
    </AuthPanel>
  );
}
