"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthPasswordFieldProps = Omit<React.ComponentProps<"input">, "type">;

export function AuthPasswordField({ className, disabled, ...props }: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input type={visible ? "text" : "password"} className={cn("h-12 pl-11 pr-14", className)} disabled={disabled} {...props} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-0.5 top-0.5 grid size-11 place-items-center rounded-[0.7rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
      </button>
    </div>
  );
}
