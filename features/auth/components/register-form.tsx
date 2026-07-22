"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Circle, CircleAlert, LoaderCircle, Mail, MailCheck } from "lucide-react";
import { submitSignUp } from "@/app/auth/actions";
import { AuthPasswordField } from "@/features/auth/components/auth-password-field";
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
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const checks = [
    { label: "Minimal 8 karakter", met: password.length >= 8 },
    { label: "Memiliki huruf", met: /[a-zA-Z]/.test(password) },
    { label: "Memiliki angka", met: /\d/.test(password) },
  ];
  const onboardingPath = nextPath
    ? `/onboarding/role?next=${encodeURIComponent(nextPath)}`
    : "/onboarding/role";
  const signInHref = nextPath
    ? { pathname: "/sign-in", query: { next: nextPath } }
    : "/sign-in";

  useEffect(() => {
    if (confirmationEmail) confirmationHeadingRef.current?.focus();
  }, [confirmationEmail]);

  if (confirmationEmail) {
    return (
      <div className="mt-7 rounded-[1.75rem] border border-primary/20 bg-secondary/65 p-6" role="status" aria-live="polite">
        <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><MailCheck className="size-5" aria-hidden="true" /></span>
        <h2 ref={confirmationHeadingRef} tabIndex={-1} className="mt-5 text-xl font-semibold outline-none">Periksa emailmu</h2>
        <p className="mt-2 text-base leading-7 text-muted-foreground">Kami mengirim tautan konfirmasi ke <strong className="text-foreground">{confirmationEmail}</strong>. Setelah dikonfirmasi, lanjutkan memilih peran.</p>
        <Button variant="outline" className="mt-5 rounded-full" asChild><Link href={{ pathname: "/sign-in", query: { next: onboardingPath } }}>Kembali ke halaman masuk</Link></Button>
      </div>
    );
  }

  return (
    <form
      className="mt-5 grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();

        if (!termsAccepted) {
          setTermsError("Setujui ketentuan dan kebijakan privasi untuk melanjutkan.");
          window.requestAnimationFrame(() => document.getElementById("terms")?.focus());
          return;
        }

        if (submittingRef.current) return;
        submittingRef.current = true;

        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") ?? "");
        void (async () => {
          setPending(true);
          setErrorMessage(null);
          let completed = false;

          try {
            const result = await submitSignUp({ email, password, nextPath });

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
          <Input id="email" name="email" type="email" autoComplete="email" maxLength={320} placeholder="nama@contoh.id" className="h-12 pl-11" disabled={pending} required />
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="password-guidance"
          disabled={pending}
          required
        />
        <p className="pt-1 text-xs leading-5 text-muted-foreground">Minimal 8 karakter wajib dipenuhi. Huruf dan angka membantu membuat kata sandi lebih kuat.</p>
        <ul id="password-guidance" className="grid gap-1.5 text-xs" aria-label="Panduan kekuatan kata sandi">
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
          <Label htmlFor="terms" className="font-normal leading-6">Saya menyetujui Ketentuan Penggunaan dan Kebijakan Privasi Rintara.</Label>
        </div>
        {termsError ? <p id="terms-error" className="pl-7 text-sm leading-6 text-destructive" role="alert">{termsError}</p> : null}
      </div>
      {errorMessage ? (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-base leading-7 text-red-800" role="alert">
          <CircleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      ) : null}
      <Button type="submit" size="lg" className="h-12 rounded-full" disabled={pending}>
        {pending ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Membuat akun</> : <>Lanjut pilih peran <ArrowRight className="group-hover/button:translate-x-0.5" aria-hidden="true" /></>}
      </Button>
      <p className="text-center text-sm text-muted-foreground">Sudah punya akun? <Link href={signInHref} className="font-semibold text-primary hover:underline">Masuk</Link></p>
    </form>
  );
}
