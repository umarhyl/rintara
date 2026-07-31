"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  HardHat,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RegistrationProgress } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export type SelectedRole = "worker" | "employer" | null;

const roleCards = [
  {
    value: "employer" as const,
    title: "Employer",
    subtitle: "Pemberi pekerjaan",
    description:
      "Pasang pekerjaan yang jelas, pilih satu pekerja, lalu verifikasi hasilnya.",
    icon: BriefcaseBusiness,
    graphicBg: "bg-accent text-accent-foreground",
  },
  {
    value: "worker" as const,
    title: "Worker",
    subtitle: "Mencari pekerjaan harian",
    description:
      "Temukan pekerjaan lokal, ajukan lamaran singkat, lalu bangun Bukti Kerja.",
    icon: HardHat,
    graphicBg: "bg-accent text-accent-foreground",
  },
] as const;

export function RegisterRoleGate({
  nextPath,
}: {
  nextPath?: string;
}) {
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);

  function handleRoleSelect(role: Exclude<SelectedRole, null>) {
    setSelectedRole(role);
  }

  function handleBack() {
    setSelectedRole(null);
  }

  if (selectedRole) {
    return (
      <div className="w-full rounded-2xl bg-white p-5 text-foreground shadow-[0_4px_8px_rgb(16_37_27/0.18)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] sm:p-8">
        <h1 className="sr-only">Buat akun Rintara</h1>

        <RegistrationProgress stage={2} />

        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground font-semibold">
              {selectedRole === "worker" ? (
                <HardHat className="size-4" aria-hidden="true" />
              ) : (
                <BriefcaseBusiness className="size-4" aria-hidden="true" />
              )}
            </span>
            <span>
              Mendaftar sebagai{" "}
              <strong className="font-semibold text-foreground">
                {selectedRole === "worker" ? "Worker" : "Employer"}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-11 self-start items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 sm:self-auto"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Ubah Peran
          </button>
        </div>

        <RegisterForm nextPath={nextPath} selectedRole={selectedRole} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <RegistrationProgress stage={1} tone="inverse" />

      <div className="mb-8 text-center sm:mb-9">
        <h1 className="text-balance text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[2.5rem] lg:text-5xl">
          Selamat datang di Rintara!
        </h1>
        <p className="mt-3 text-base text-white/90 sm:text-lg">
          Manakah yang lebih mendeskripsikan dirimu?
        </p>
      </div>

      <div className="mx-auto grid max-w-[46rem] gap-4 md:grid-cols-2 md:gap-5">
        {roleCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.value}
              type="button"
              onClick={() => handleRoleSelect(card.value)}
              className={cn(
                "group relative flex min-h-32 flex-row items-center gap-4 overflow-hidden rounded-2xl bg-card p-3.5 text-left outline-none transition-[transform,box-shadow] duration-200 sm:min-h-36 sm:p-4 md:min-h-[17rem] md:flex-col md:gap-4 md:p-3 md:text-center 2xl:min-h-[20rem]",
                "shadow-[0_4px_8px_rgb(16_37_27/0.16)] hover:shadow-[0_6px_8px_rgb(16_37_27/0.2)] motion-safe:hover:-translate-y-1 motion-safe:active:scale-[0.99]",
                "focus-visible:ring-3 focus-visible:ring-[#def4c6] focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
              )}
            >
              <div className="relative grid size-20 shrink-0 place-items-center sm:size-24 md:h-32 md:w-full 2xl:h-44">
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl",
                    card.graphicBg,
                  )}
                />
                <span className="relative grid size-12 place-items-center rounded-full bg-white/55 transition-transform duration-200 motion-safe:group-hover:scale-105 sm:size-14 md:size-16">
                  <Icon className="size-6 sm:size-7 md:size-8" aria-hidden="true" />
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col items-start text-left md:items-center md:px-3 md:pb-2 md:text-center">
                <h2 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary md:text-xl">
                  {card.title}
                </h2>
                <p className="mt-0.5 text-base font-semibold text-primary">
                  {card.subtitle}
                </p>
                <p className="sr-only text-pretty text-base leading-6 text-muted-foreground md:not-sr-only md:mt-2 md:max-w-[32ch]">
                  {card.description}
                </p>
              </div>

              <ArrowRight
                className="ml-auto hidden size-5 shrink-0 text-primary transition-transform duration-200 motion-safe:group-hover:translate-x-1 sm:block md:absolute md:bottom-5 md:right-5"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-center text-base text-white/90 sm:mt-6">
        Sudah punya akun?{" "}
        <Link
          href={
            nextPath && nextPath !== "/account/continue"
              ? { pathname: "/sign-in", query: { next: nextPath } }
              : "/sign-in"
          }
          className="font-semibold text-white underline underline-offset-4 transition-colors hover:text-white/90"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
