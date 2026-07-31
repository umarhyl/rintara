"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, LoaderCircle, Mail } from "lucide-react";
import { submitSignIn } from "@/app/auth/actions";
import { AuthPasswordField } from "@/features/auth/components/auth-password-field";
import { useAuthSurfaceState } from "@/features/auth/components/auth-surface-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { primePublicAuthState } from "@/features/auth/use-public-auth-state";

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
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const {
    email,
    setEmail,
    signInPassword,
    setSignInPassword,
    setBusy,
  } = useAuthSurfaceState();

  const handleClearErrors = () => {
    if (errorMessage) setErrorMessage(null);
    if (emailError) setEmailError(false);
    if (passwordError) setPasswordError(false);
  };

  return (
    <form
      className="mt-6 grid gap-4"
      aria-busy={pending}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (submittingRef.current) return;

        handleClearErrors();

        const trimmedEmail = email.trim();
        const password = signInPassword;

        // 1. Validation check for completely empty submission
        if (!trimmedEmail && !password) {
          setEmailError(true);
          setPasswordError(true);
          setErrorMessage("Silakan isi email dan kata sandi terlebih dahulu.");
          return;
        }

        // 2. Validation check for missing email
        if (!trimmedEmail) {
          setEmailError(true);
          setErrorMessage("Silakan isi alamat email Anda terlebih dahulu.");
          return;
        }

        // 3. Validation check for invalid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          setEmailError(true);
          setErrorMessage("Format email tidak valid. Masukkan email seperti nama@contoh.id.");
          return;
        }

        // 4. Validation check for missing password
        if (!password) {
          setPasswordError(true);
          setErrorMessage("Silakan isi kata sandi Anda terlebih dahulu.");
          return;
        }

        submittingRef.current = true;
        setPending(true);
        setBusy(true);

        let completed = false;

        try {
          const result = await submitSignIn({
            email: trimmedEmail,
            password: password,
          });

          if (!result.ok) {
            setEmailError(true);
            setPasswordError(true);

            // User friendly Indonesian message for invalid credentials or unregistered account
            if (
              result.message.includes("tidak valid") ||
              result.message.includes("UNAUTHENTICATED") ||
              result.message.includes("Periksa kembali")
            ) {
              setErrorMessage("Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali atau daftar jika belum memiliki akun.");
            } else {
              setErrorMessage(result.message);
            }
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
          setBusy(false);
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
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Kata sandi</Label>
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center rounded px-2 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/25"
          >
            Lupa kata sandi?
          </Link>
        </div>
        <AuthPasswordField
          id="password"
          name="password"
          autoComplete="current-password"
          maxLength={128}
          className={cn(
            passwordError && "border-destructive focus-visible:ring-destructive/30",
          )}
          value={signInPassword}
          onChange={(event) => {
            setSignInPassword(event.target.value);
            handleClearErrors();
          }}
          disabled={pending}
        />
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

      <Button type="submit" size="lg" className="mt-2 h-12" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Memeriksa akun...
          </>
        ) : (
          <>
            Masuk ke Rintara <ArrowRight aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link
          href={
            nextPath && nextPath !== "/account/continue"
              ? { pathname: "/register", query: { next: nextPath } }
              : "/register"
          }
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </form>
  );
}
