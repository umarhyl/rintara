"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type Role = "worker" | "employer";

const roles = [
  {
    value: "worker",
    number: "01",
    title: "Saya mencari pekerjaan",
    description: "Temukan pekerjaan pemula, kirim catatan lamaran, dan bangun Paspor Rintara.",
    icon: UserRound,
    accent: "text-primary",
  },
  {
    value: "employer",
    number: "02",
    title: "Saya memberi pekerjaan",
    description: "Terbitkan pekerjaan yang jelas dan bantu seseorang memulai pengalaman pertamanya.",
    icon: BriefcaseBusiness,
    accent: "text-opportunity",
  },
] as const;

export function RoleSelection({ nextPath }: { nextPath?: string }) {
  const [role, setRole] = useState<Role>("worker");

  return (
    <div className="grid gap-7">
      <RadioGroup
        value={role}
        onValueChange={(value) => setRole(value as Role)}
        className="divide-y divide-border border-y border-border"
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
                "group relative grid min-h-32 cursor-pointer grid-cols-[2.5rem_1fr_auto] items-start gap-4 py-6 font-normal transition-[background-color,color] duration-500 sm:grid-cols-[3rem_1fr_auto] sm:px-2",
                selected ? "bg-secondary/55" : "hover:bg-muted/45",
              )}
            >
              <span className={cn("font-mono text-xs", selected ? item.accent : "text-muted-foreground")}>{item.number}</span>
              <span>
                <span className="flex items-center gap-3">
                  <Icon className={cn("size-5 transition-colors duration-500", selected ? item.accent : "text-muted-foreground")} aria-hidden="true" />
                  <span className="text-base font-semibold text-foreground">{item.title}</span>
                </span>
                <span className="mt-3 block max-w-sm text-base leading-7 text-muted-foreground">{item.description}</span>
              </span>
              <RadioGroupItem id={item.value} value={item.value} className="mt-0.5" />
              {selected ? <span className="absolute inset-y-4 left-0 w-0.5 rounded-r-full bg-primary" aria-hidden="true" /> : null}
            </Label>
          );
        })}
      </RadioGroup>

      <Button className="h-12 rounded-full" asChild>
        <Link href={nextPath ? { pathname: `/onboarding/${role}`, query: { next: nextPath } } : `/onboarding/${role}`}>
          Lanjut sebagai {role === "worker" ? "pekerja" : "pemberi kerja"}
          <ArrowRight className="group-hover/button:translate-x-0.5" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
