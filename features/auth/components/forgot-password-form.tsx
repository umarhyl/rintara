"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Mail,
} from "lucide-react";
import { submitPasswordRecoveryRequest } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthSurfaceState } from "./auth-surface-state";

export function ForgotPasswordForm({
  initialErrorMessage = null,
}: {
  initialErrorMessage?: string | null;
}) {
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage,
  );
  const { email, setEmail } = useAuthSurfaceState();

  if (sent) {
    return (
      <div className="mt-6 grid gap-5">
        <div
          className="flex gap-3 rounded-xl border border-primary/25 bg-secondary p-4 text-base leading-7"
          role="status"
        >
          <CircleCheck
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p>
            Jika email tersebut terdaftar, tautan untuk mengganti kata sandi
            telah dikirim. Periksa juga folder spam.
          </p>
        </div>
        <Button asChild variant="outline" size="lg" className="h-12">
          <Link href="/sign-in">
            <ArrowLeft aria-hidden="true" />
            Kembali ke halaman masuk
          </Link>
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
        setErrorMessage(null);

        const form = new FormData(event.currentTarget);
        try {
          const result = await submitPasswordRecoveryRequest({
            email: String(form.get("email") ?? ""),
          });

          if (!result.ok) {
            setErrorMessage(result.message);
            return;
          }

          setSent(true);
        } catch {
          setErrorMessage(
            "Koneksi terputus. Periksa jaringan lalu coba lagi.",
          );
        } finally {
          submittingRef.current = false;
          setPending(false);
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="recovery-email">Email akun</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={320}
            placeholder="nama@contoh.id"
            className="h-12 pl-11"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            required
          />
        </div>
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
            Mengirim tautan
          </>
        ) : (
          "Kirim tautan pemulihan"
        )}
      </Button>
      <Link
        href="/sign-in"
        className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke halaman masuk
      </Link>
    </form>
  );
}
