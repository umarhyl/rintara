"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BriefcaseBusiness, HardHat, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { RegistrationProgress } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export type SelectedRole = "worker" | "employer" | null;

const roleCards = [
  {
    value: "worker" as const,
    title: "Worker",
    subtitle: "Mencari pekerjaan harian",
    description: "Temukan lowongan harian lokal, kirim lamaran cepat, dan kumpulkan Bukti Kerja.",
    icon: HardHat,
    graphicBg: "bg-primary/10 text-primary",
    activeBorder: "border-primary ring-2 ring-primary/20 bg-primary/5",
  },
  {
    value: "employer" as const,
    title: "Employer",
    subtitle: "Pemberi pekerjaan",
    description: "Terbitkan pekerjaan fair 1-on-1, pilih pekerja terpercaya, dan verifikasi hasil kerja.",
    icon: BriefcaseBusiness,
    graphicBg: "bg-primary/10 text-primary",
    activeBorder: "border-primary ring-2 ring-primary/20 bg-primary/5",
  },
] as const;

export function RegisterRoleGate({
  nextPath,
}: {
  nextPath?: string;
  active?: "register";
}) {
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
  const [showForm, setShowForm] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (selectedRole && !showForm) {
      const timer = window.setTimeout(() => {
        setShowForm(true);
        setEntering(true);
        window.setTimeout(() => {
          setEntering(false);
        }, 50);
      }, 250);

      return () => window.clearTimeout(timer);
    }
  }, [selectedRole, showForm]);

  function handleRoleSelect(role: Exclude<SelectedRole, null>) {
    setSelectedRole(role);
    setExiting(true);
  }

  function handleBack() {
    setEntering(true);
    window.setTimeout(() => {
      setShowForm(false);
      setExiting(false);
      setSelectedRole(null);
      setEntering(false);
    }, 50);
  }

  if (showForm) {
    return (
      <div
        className={cn(
          "w-full transition-all duration-300 ease-out",
          entering ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        {/* Step 2 Indicator: Akun */}
        <RegistrationProgress stage={2} />

        {/* Active Role Selection Banner */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground font-semibold">
              {selectedRole === "worker" ? <HardHat className="size-4" /> : <BriefcaseBusiness className="size-4" />}
            </span>
            <span>
              Mendaftar sebagai <strong className="font-semibold text-foreground">{selectedRole === "worker" ? "Worker" : "Employer"}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <RotateCcw className="size-3.5" />
            Ubah Peran
          </button>
        </div>

        <RegisterForm nextPath={nextPath} selectedRole={selectedRole} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 ease-out",
        exiting ? "scale-98 opacity-0" : "scale-100 opacity-100",
      )}
    >
      {/* Step 1 Indicator: Peran */}
      <RegistrationProgress stage={1} />

      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Selamat datang di Rintara!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manakah yang lebih mendeskripsikan dirimu?
        </p>
      </div>

      {/* Role Cards Grid in Container (Centered Content) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {roleCards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedRole === card.value;

          return (
            <button
              key={card.value}
              type="button"
              onClick={() => handleRoleSelect(card.value)}
              disabled={!!selectedRole}
              className={cn(
                "group relative flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-xs outline-none transition-all duration-200",
                "hover:border-primary/50 hover:shadow-md",
                "focus-visible:ring-2 focus-visible:ring-primary",
                "disabled:pointer-events-none",
                isSelected && card.activeBorder,
              )}
            >
              <div className="relative flex w-full items-center justify-center">
                <div className={cn("grid size-12 place-items-center rounded-xl transition-colors", card.graphicBg)}>
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                {isSelected && (
                  <div className="absolute right-0 top-0 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col items-center text-center">
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-primary">
                  {card.subtitle}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Link to Sign In */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href={
            nextPath && nextPath !== "/account/continue"
              ? { pathname: "/sign-in", query: { next: nextPath } }
              : "/sign-in"
          }
          className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
