"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Circle, CircleAlert, LoaderCircle, Mail } from "lucide-react";
import {
  submitSignUp,
  submitVerificationEmailRequest,
} from "@/app/auth/actions";
import { AuthPasswordField } from "@/features/auth/components/auth-password-field";
import { RegistrationPolicyDialog } from "@/features/auth/components/registration-policy-dialog";
import { useAuthSurfaceState } from "@/features/auth/components/auth-surface-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { primePublicAuthState } from "@/features/auth/use-public-auth-state";

export function RegisterForm({
  nextPath,
  selectedRole,
}: {
  nextPath?: string;
  selectedRole?: "worker" | "employer" | null;
}) {
  const router = useRouter();
  const continuationHeadingRef = useRef<HTMLHeadingElement>(null);
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [continuationEmail, setContinuationEmail] = useState<string | null>(null);
  const [resendPending, setResendPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const {
    email,
    setEmail,
    registerPassword,
    setRegisterPassword,
    termsAccepted,
    setTermsAccepted,
  } = useAuthSurfaceState();

  const checks = [
    { label: "Minimal 8 karakter", met: registerPassword.length >= 8 },
    { label: "Memiliki huruf", met: /[a-zA-Z]/.test(registerPassword) },
    { label: "Memiliki angka", met: /\d/.test(registerPassword) },
  ];

  const onboardingPath = selectedRole
    ? `/onboarding/${selectedRole}${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
    : nextPath
      ? `/onboarding/role?next=${encodeURIComponent(nextPath)}`
      : "/onboarding/role";

  const signInHref = nextPath
    ? { pathname: "/sign-in", query: { next: nextPath } }
    : "/sign-in";

  useEffect(() => {
    if (continuationEmail) continuationHeadingRef.current?.focus();
  }, [continuationEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleClearErrors = () => {
    if (errorMessage) setErrorMessage(null);
    if (emailError) setEmailError(false);
    if (passwordError) setPasswordError(false);
  };

  if (continuationEmail) {
    return (
      <div
        className="mt-6 grid gap-4 rounded-xl border border-primary/20 bg-[#edf5ec] p-6"
        aria-labelledby="email-verification-heading"
      >
        <div className="flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#1b512d] text-white">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <h2
            id="email-verification-heading"
            ref={continuationHeadingRef}
            tabIndex={-1}
            className="text-xl font-semibold outline-none"
          >
            Verifikasi emailmu
          </h2>
        </div>

        <p className="text-base leading-7 text-muted-foreground">
          Jika ini pendaftaran baru, tautan verifikasi dikirim ke{" "}
          <strong className="font-semibold text-foreground">{continuationEmail}</strong>.
          Buka tautan tersebut untuk mengaktifkan akun dan melanjutkan ke profil.
          Periksa juga folder spam.
        </p>

        <p className="text-sm leading-6 text-muted-foreground">
          Demi keamanan, kami tidak mengonfirmasi apakah alamat ini sudah
          terdaftar. Jika kamu pernah mendaftar, kamu tetap bisa masuk atau
          memulihkan kata sandi.
        </p>

        {resendMessage ? (
          <p className="text-sm font-medium text-primary" role="status" aria-live="polite">
            {resendMessage}
          </p>
        ) : null}

        <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
          <Button
            type="button"
            className="h-11"
            disabled={resendPending || resendCooldown > 0}
            onClick={() => {
              if (resendPending || resendCooldown > 0) return;
              void (async () => {
                setResendPending(true);
                setResendMessage(null);
                try {
                  const result = await submitVerificationEmailRequest({
                    email: continuationEmail,
                    nextPath,
                    selectedRole,
                  });
                  if (!result.ok) {
                    setResendMessage(result.message);
                    return;
                  }
                  setResendCooldown(60);
                  setResendMessage(
                    "Jika akun masih menunggu verifikasi, tautan baru telah dikirim.",
                  );
                } catch {
                  setResendMessage(
                    "Koneksi terputus. Periksa jaringan lalu coba lagi.",
                  );
                } finally {
                  setResendPending(false);
                }
              })();
            }}
          >
            {resendPending
              ? "Mengirim ulang…"
              : resendCooldown > 0
                ? `Kirim ulang (${resendCooldown} dtk)`
                : "Kirim ulang email"}
          </Button>
          <Button variant="outline" className="h-11 bg-white" asChild>
            <Link href={signInHref}>Masuk ke akun</Link>
          </Button>
          <Button variant="ghost" className="h-11 hover:bg-black/5" asChild>
            <Link href="/forgot-password">Pulihkan kata sandi</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mt-6 grid gap-4"
      aria-busy={pending}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        handleClearErrors();

        const trimmedEmail = email.trim();
        const password = registerPassword;

        // 1. Check empty email and password
        if (!trimmedEmail && !password) {
          setEmailError(true);
          setPasswordError(true);
          setErrorMessage("Silakan isi email dan kata sandi terlebih dahulu.");
          return;
        }

        // 2. Check empty email
        if (!trimmedEmail) {
          setEmailError(true);
          setErrorMessage("Silakan isi alamat email Anda terlebih dahulu.");
          return;
        }

        // 3. Check invalid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          setEmailError(true);
          setErrorMessage("Format email tidak valid. Masukkan email seperti nama@contoh.id.");
          return;
        }

        // 4. Check password length & criteria
        if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
          setPasswordError(true);
          setErrorMessage("Kata sandi harus minimal 8 karakter dan mengandung huruf serta angka.");
          return;
        }

        // 5. Check terms accepted
        if (!termsAccepted) {
          setTermsError("Setujui ketentuan dan kebijakan privasi Rintara untuk melanjutkan.");
          window.requestAnimationFrame(() => document.getElementById("terms")?.focus());
          return;
        }

        if (submittingRef.current) return;
        submittingRef.current = true;

        void (async () => {
          setPending(true);
          setErrorMessage(null);
          let completed = false;

          try {
            const result = await submitSignUp({
              email: trimmedEmail,
              password: registerPassword,
              nextPath,
              selectedRole,
            });

            if (!result.ok) {
              setErrorMessage(result.message);
              return;
            }

            if (result.nextStep === "confirm-or-sign-in") {
              setContinuationEmail(trimmedEmail);
              setResendCooldown(60);
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
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={320}
            placeholder="nama@contoh.id"
            className={cn(
              "h-12 pl-11 transition-colors",
              emailError && "border-destructive focus-visible:ring-destructive/30",
            )}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              handleClearErrors();
            }}
            disabled={pending}
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
          className={cn(
            passwordError && "border-destructive focus-visible:ring-destructive/30",
          )}
          value={registerPassword}
          onChange={(event) => {
            setRegisterPassword(event.target.value);
            handleClearErrors();
          }}
          aria-describedby="password-guidance"
          disabled={pending}
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
          <p className="text-sm leading-6 text-foreground">
            <Label htmlFor="terms" className="inline cursor-pointer font-normal">
              Saya menyetujui
            </Label>{" "}
            <RegistrationPolicyDialog kind="terms" /> dan{" "}
            <RegistrationPolicyDialog kind="privacy" /> Rintara.
          </p>
        </div>
        {termsError ? <p id="terms-error" className="pl-7 text-sm leading-6 text-destructive" role="alert">{termsError}</p> : null}
      </div>

      {errorMessage ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive"
          role="alert"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="mt-1 h-12" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Membuat akun...
          </>
        ) : (
          <>
            Lanjut ke Profil <ArrowRight aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href={signInHref}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </form>
  );
}
