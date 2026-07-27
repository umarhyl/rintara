"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";
import { submitPasswordUpdate } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthPasswordField } from "./auth-password-field";
import { useAuthSurfaceState } from "./auth-surface-state";

export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { setBusy } = useAuthSurfaceState();

  if (!hasSession) {
    return (
      <div className="mt-6 grid gap-5">
        <div
          className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-base leading-7 text-destructive"
          role="alert"
        >
          <CircleAlert
            className="mt-0.5 size-4.5 shrink-0"
            aria-hidden="true"
          />
          <p>
            Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan
            baru untuk melanjutkan.
          </p>
        </div>
        <Button asChild size="lg" className="h-12">
          <Link href="/forgot-password">Minta tautan baru</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="mt-6 grid gap-4"
      aria-busy={pending}
      onSubmit={async (event) => {
        event.preventDefault();
        if (submittingRef.current) return;

        submittingRef.current = true;
        setPending(true);
        setBusy(true);
        setErrorMessage(null);

        try {
          const result = await submitPasswordUpdate({
            password,
            passwordConfirmation,
          });

          if (!result.ok) {
            setErrorMessage(result.message);
            return;
          }

          router.replace("/account/continue");
        } catch {
          setErrorMessage(
            "Koneksi terputus. Periksa jaringan lalu coba lagi.",
          );
        } finally {
          submittingRef.current = false;
          setPending(false);
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="new-password">Kata sandi baru</Label>
        <AuthPasswordField
          id="new-password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={pending}
          required
        />
        <p className="text-sm leading-6 text-muted-foreground">
          Gunakan 8–128 karakter.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password-confirmation">
          Ulangi kata sandi baru
        </Label>
        <AuthPasswordField
          id="password-confirmation"
          name="passwordConfirmation"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          disabled={pending}
          required
        />
      </div>
      {errorMessage ? (
        <div
          className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-base leading-7 text-destructive"
          role="alert"
        >
          <CircleAlert
            className="mt-0.5 size-4.5 shrink-0"
            aria-hidden="true"
          />
          <p>{errorMessage}</p>
        </div>
      ) : null}
      <Button type="submit" size="lg" className="mt-2 h-12" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Menyimpan
          </>
        ) : (
          <>
            Simpan kata sandi baru
            <ArrowRight aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
