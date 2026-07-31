"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, Mail } from "lucide-react";
import { submitVerificationEmailRequest } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthSurfaceState } from "./auth-surface-state";

export function EmailVerificationForm({
  initialErrorMessage = null,
}: {
  initialErrorMessage?: string | null;
}) {
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const { email, setEmail } = useAuthSurfaceState();

  return (
    <form
      className="mt-6 grid gap-4"
      aria-busy={pending}
      onSubmit={async (event) => {
        event.preventDefault();
        if (submittingRef.current) return;
        submittingRef.current = true;
        setPending(true);
        setSent(false);
        setErrorMessage(null);

        try {
          const result = await submitVerificationEmailRequest({ email });
          if (!result.ok) {
            setErrorMessage(result.message);
            return;
          }
          setSent(true);
        } catch {
          setErrorMessage("Koneksi terputus. Periksa jaringan lalu coba lagi.");
        } finally {
          submittingRef.current = false;
          setPending(false);
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="verification-email">Email akun</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="verification-email"
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

      {sent ? (
        <div className="flex gap-3 rounded-xl border border-primary/25 bg-secondary p-4 text-base leading-7" role="status">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <p>Jika akun masih menunggu verifikasi, tautan baru telah dikirim. Periksa juga folder spam.</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-base leading-7 text-destructive" role="alert">
          <CircleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="h-12" disabled={pending}>
        {pending ? (
          <><LoaderCircle className="animate-spin" aria-hidden="true" />Mengirim ulang</>
        ) : "Kirim ulang email verifikasi"}
      </Button>
      <Button asChild variant="outline" size="lg" className="h-12">
        <Link href="/sign-in">Kembali ke halaman masuk</Link>
      </Button>
    </form>
  );
}
