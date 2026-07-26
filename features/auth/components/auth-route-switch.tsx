"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type AuthMode,
  useAuthSurfaceState,
} from "@/features/auth/components/auth-surface-state";
import { cn } from "@/lib/utils";

export function AuthRouteSwitch({
  active,
  nextPath,
}: {
  active: AuthMode;
  nextPath?: string;
}) {
  const router = useRouter();
  const { busy, visualMode, setVisualMode } = useAuthSurfaceState();
  const navigationTimerRef = useRef<number | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<AuthMode | null>(
    null,
  );
  const switching =
    navigationTarget !== null && navigationTarget !== active;
  const selectedMode = visualMode ?? active;
  const options = [
    { value: "sign-in", label: "Masuk" },
    { value: "register", label: "Daftar" },
  ] as const;

  useEffect(() => {
    setVisualMode(active);
  }, [active, setVisualMode]);

  useEffect(
    () => () => {
      if (navigationTimerRef.current !== null) {
        window.clearTimeout(navigationTimerRef.current);
      }
    },
    [],
  );

  return (
    <nav
      className="relative isolate grid grid-cols-2 rounded-xl bg-muted p-1"
      aria-label="Pilih masuk atau daftar"
    >
      <span
        data-auth-mode-slider
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 z-0 w-[calc(50%_-_0.25rem)] rounded-lg bg-card shadow-[0_8px_20px_-16px_rgb(27_81_45/0.9)] transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          selectedMode === "register" && "translate-x-full",
        )}
        aria-hidden="true"
      />
      {options.map((option) => {
        const selected = active === option.value;
        const visuallySelected = selectedMode === option.value;
        const disabled = (busy || switching) && !selected;
        const query = nextPath
          ? `?${new URLSearchParams({ next: nextPath }).toString()}`
          : "";
        const href = `/${option.value}${query}`;

        return (
          <Link
            key={option.value}
            href={href}
            aria-current={selected ? "page" : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
            onClick={(event) => {
              if (disabled) {
                event.preventDefault();
                return;
              }

              if (switching) {
                event.preventDefault();
                return;
              }

              if (
                event.button === 0 &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                if (selected) {
                  event.preventDefault();
                  return;
                }

                event.preventDefault();
                setNavigationTarget(option.value);
                setVisualMode(option.value);
                const reducedMotion = window.matchMedia(
                  "(prefers-reduced-motion: reduce)",
                ).matches;
                const navigationDelay = reducedMotion ? 0 : 220;

                navigationTimerRef.current = window.setTimeout(() => {
                  navigationTimerRef.current = null;
                  router.push(href);
                }, navigationDelay);
              }
            }}
            className={cn(
              "relative z-10 flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25",
              visuallySelected && "text-foreground",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
