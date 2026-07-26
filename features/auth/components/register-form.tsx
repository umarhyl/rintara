"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Circle, CircleAlert, LoaderCircle, Mail, MailCheck } from "lucide-react";
import { submitSignUp } from "@/app/auth/actions";
import { AuthPasswordField } from "@/features/auth/components/auth-password-field";
import { useAuthSurfaceState } from "@/features/auth/components/auth-surface-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { primePublicAuthState } from "@/features/auth/use-public-auth-state";

export function RegisterForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const {
    email,
    setEmail,
    registerPassword,
    setRegisterPassword,
    termsAccepted,
    setTermsAccepted,
    setBusy,
  } = useAuthSurfaceState();
  const checks = [
    { label: "Minimal 8 karakter", met: registerPassword.length >= 8 },
    { label: "Memiliki huruf", met: /[a-zA-Z]/.test(registerPassword) },
    { label: "Memiliki angka", met: /\d/.test(registerPassword) },
  ];
  const onboardingPath = nextPath
    ? `/onboarding/role?next=${encodeURIComponent(nextPath)}`
    : "/onboarding/role";

  useEffect(() => {
    if (confirmationEmail) confirmationHeadingRef.current?.focus();
  }, [confirmationEmail]);

  if (confirmationEmail) {
    return (
      <div className="mt-6 border-y border-primary/25 bg-secondary/40 py-5" role="status" aria-live="polite">
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><MailCheck className="size-5" aria-hidden="true" /></span>
        <h2 ref={confirmationHeadingRef} tabIndex={-1} className="mt-4 text-xl font-semibold outline-none">Periksa emailmu</h2>
        <p className="mt-2 text-base leading-7 text-muted-foreground">Tautan konfirmasi dikirim ke <strong className="text-foreground">{confirmationEmail}</strong>.</p>
        <Button variant="outline" className="mt-4" asChild><Link href={{ pathname: "/sign-in", query: { next: onboardingPath } }}>Kembali ke halaman masuk</Link></Button>
      </div>
    );
  }

  return (
    <form
      className="mt-6 grid gap-4"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();

        if (!termsAccepted) {
          setTermsError("Setujui ketentuan dan kebijakan privasi untuk melanjutkan.");
          window.requestAnimationFrame(() => document.getElementById("terms")?.focus());
          return;
        }

        if (submittingRef.current) return;
        submittingRef.current = true;
        setBusy(true);

        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") ?? "");
        void (async () => {
          setPending(true);
          setErrorMessage(null);
          let completed = false;

          try {
            const result = await submitSignUp({
              email,
              password: registerPassword,
              nextPath,
            });

            if (!result.ok) {
              setErrorMessage(result.message);
              return;
            }

            if (result.requiresEmailConfirmation) {
              setConfirmationEmail(email);
              return;
            }

            primePublicAuthState("signed-in");
            completed = true;
            router.replace(onboardingPath);
          } catch {
            setErrorMessage(
              "Koneksi terputus saat membuat akun. Periksa jaringan lalu coba lagi.",
            );
          } finally {
            setBusy(false);
            if (!completed) {
              submittingRef.current = false;
              setPending(false);
            }
          }
        })();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="email"
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
      <div className="grid gap-2">
        <Label htmlFor="password">Kata sandi</Label>
        <AuthPasswordField
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          value={registerPassword}
          onChange={(event) => setRegisterPassword(event.target.value)}
          aria-describedby="password-guidance"
          disabled={pending}
          required
        />
        <ul id="password-guidance" className="grid gap-1 text-xs sm:grid-cols-3" aria-label="Panduan kekuatan kata sandi">
          {checks.map((check) => {
            const Icon = check.met ? Check : Circle;
            return (
              <li key={check.label} className={cn("flex items-center gap-2 text-muted-foreground transition-colors", check.met && "text-success")}>
                <Icon className="size-3.5" aria-hidden="true" />
                {check.met ? `${check.label} terpenuhi` : check.label}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="grid gap-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            name="terms"
            className="mt-1"
            checked={termsAccepted}
            onCheckedChange={(checked) => {
              const accepted = checked === true;
              setTermsAccepted(accepted);
              if (accepted) setTermsError(null);
            }}
            aria-invalid={termsError ? true : undefined}
            aria-describedby={termsError ? "terms-error" : undefined}
            disabled={pending}
          />
          <Label htmlFor="terms" className="font-normal leading-6">Saya menyetujui ketentuan dan kebijakan privasi Rintara.</Label>
        </div>
        {termsError ? <p id="terms-error" className="pl-7 text-sm leading-6 text-destructive" role="alert">{termsError}</p> : null}
      </div>
      {errorMessage ? (
        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-base leading-7 text-destructive" role="alert">
          <CircleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      ) : null}
      <Button type="submit" size="lg" className="mt-1 h-12" disabled={pending}>
        {pending ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Membuat akun</> : <>Lanjut pilih peran <ArrowRight aria-hidden="true" /></>}
      </Button>
    </form>
  );
}
