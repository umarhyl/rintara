"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, LoaderCircle, Mail } from "lucide-react";
import { submitSignIn } from "@/app/auth/actions";
import { AuthPasswordField } from "@/components/rintara/auth-password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { primePublicAuthState } from "@/components/rintara/use-public-auth-state";

export function SignInForm({
  initialErrorMessage = null,
  nextPath = "/account/continue",
}: {
  initialErrorMessage?: string | null;
  nextPath?: string;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);

  return (
    <form
      className="mt-7 grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (submittingRef.current) return;

        submittingRef.current = true;
        setPending(true);
        setErrorMessage(null);

        const form = new FormData(event.currentTarget);
        let completed = false;

        try {
          const result = await submitSignIn({
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          });

          if (!result.ok) {
            setErrorMessage(result.message);
            return;
          }

          primePublicAuthState("signed-in");
          completed = true;
          router.replace(nextPath);
        } catch {
          setErrorMessage(
            "Koneksi terputus saat masuk. Periksa jaringan lalu coba lagi.",
          );
        } finally {
          if (!completed) {
            submittingRef.current = false;
            setPending(false);
          }
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="email" name="email" type="email" autoComplete="email" maxLength={320} placeholder="nama@contoh.id" className="h-12 pl-11" disabled={pending} required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Kata sandi</Label>
        <AuthPasswordField id="password" name="password" autoComplete="current-password" maxLength={128} disabled={pending} required />
      </div>
      {errorMessage ? (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-base leading-7 text-red-800" role="alert">
          <CircleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      ) : null}
      <Button type="submit" size="lg" className="mt-1 h-12 rounded-full" disabled={pending}>
        {pending ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Memeriksa akun</> : <>Masuk ke Rintara <ArrowRight className="group-hover/button:translate-x-0.5" aria-hidden="true" /></>}
      </Button>
    </form>
  );
}
