"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type Role = "worker" | "employer";

const roles = [
  {
    value: "worker",
    title: "Saya mencari pekerjaan",
    description:
      "Cari pekerjaan, kirim lamaran, dan simpan Bukti Kerja di Paspor.",
    icon: UserRound,
  },
  {
    value: "employer",
    title: "Saya memberi pekerjaan",
    description:
      "Terbitkan pekerjaan, tinjau pelamar, dan kelola penyelesaian.",
    icon: BriefcaseBusiness,
  },
] as const;

export function RoleSelection({ nextPath }: { nextPath?: string }) {
  const [role, setRole] = useState<Role | null>(null);

  return (
    <div className="grid gap-5">
      <RadioGroup
        value={role ?? ""}
        onValueChange={(value) => setRole(value as Role)}
        className="grid gap-3"
        aria-label="Pilih peran aktif Rintara"
      >
        {roles.map((item) => {
          const Icon = item.icon;
          const selected = role === item.value;

          return (
            <Label
              key={item.value}
              htmlFor={item.value}
              className={cn(
                "group grid min-h-24 cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-4 font-normal outline-none transition-[background-color,border-color] duration-200",
                selected
                  ? "border-primary bg-primary/8"
                  : "border-border bg-background hover:border-primary/40 hover:bg-muted/45",
              )}
            >
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-lg border border-border bg-card text-muted-foreground",
                  selected &&
                    "border-primary bg-primary text-primary-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold leading-6 text-foreground">
                  {item.title}
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <RadioGroupItem id={item.value} value={item.value} />
            </Label>
          );
        })}
      </RadioGroup>

      <p className="text-sm leading-6 text-muted-foreground">
        Peran tidak dapat diubah setelah profil disimpan.
      </p>

      {role ? (
        <Button className="h-12" asChild>
          <Link
            href={
              nextPath
                ? {
                    pathname: `/onboarding/${role}`,
                    query: { next: nextPath },
                  }
                : `/onboarding/${role}`
            }
          >
            Lanjut sebagai {role === "worker" ? "pekerja" : "pemberi kerja"}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <Button type="button" className="h-12" disabled>
          Pilih satu peran untuk melanjutkan
        </Button>
      )}
    </div>
  );
}
