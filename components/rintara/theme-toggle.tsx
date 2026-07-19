"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

type PerformanceNavigator = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle({ className }: { className?: string }) {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const { resolvedTheme, setTheme } = useTheme();
  const [transitioning, setTransitioning] = useState(false);
  const transitionLockRef = useRef(false);
  const dark = mounted && resolvedTheme === "dark";

  function toggleTheme(event: React.MouseEvent<HTMLButtonElement>) {
    if (!mounted || transitionLockRef.current) return;
    const root = document.documentElement;
    const nextTheme = root.classList.contains("dark") ? "light" : "dark";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slowUpdate = window.matchMedia("(update: slow)").matches;
    const performanceNavigator = navigator as PerformanceNavigator;
    const lowPower =
      (performanceNavigator.hardwareConcurrency || 8) <= 4 ||
      (performanceNavigator.deviceMemory !== undefined &&
        performanceNavigator.deviceMemory <= 4);
    const simpleTransition =
      reducedMotion ||
      slowUpdate ||
      performanceNavigator.connection?.saveData === true ||
      lowPower;
    const transitionDocument = document as ViewTransitionDocument;

    root.style.setProperty("--theme-toggle-x", `${event.clientX}px`);
    root.style.setProperty("--theme-toggle-y", `${event.clientY}px`);
    transitionLockRef.current = true;
    setTransitioning(true);

    let released = false;
    const releaseTransition = () => {
      if (released) return;
      released = true;
      transitionLockRef.current = false;
      setTransitioning(false);
    };

    if (!transitionDocument.startViewTransition || simpleTransition) {
      setTheme(nextTheme);
      window.requestAnimationFrame(releaseTransition);
      return;
    }

    try {
      const transition = transitionDocument.startViewTransition(() => {
        flushSync(() => setTheme(nextTheme));
      });
      const safetyTimer = window.setTimeout(releaseTransition, 1_400);

      void transition.finished
        .catch(() => undefined)
        .finally(() => {
          window.clearTimeout(safetyTimer);
          releaseTransition();
        });
    } catch {
      setTheme(nextTheme);
      window.requestAnimationFrame(releaseTransition);
    }
  }

  const targetLabel = dark ? "terang" : "gelap";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!mounted || transitioning}
      aria-label={`Aktifkan mode ${targetLabel}`}
      aria-pressed={dark}
      aria-busy={transitioning}
      title={`Aktifkan mode ${targetLabel}`}
      className={cn(
        "group/theme relative flex h-11 w-[5.25rem] shrink-0 items-center justify-between overflow-hidden rounded-full border border-border bg-muted/85 px-[0.875rem] text-muted-foreground shadow-inner transition-[background-color,border-color,color] duration-500 hover:border-primary/45 disabled:cursor-wait disabled:opacity-100",
        className,
      )}
    >
      <span
        className="theme-toggle-knob absolute left-1 top-1 size-9 rounded-full border border-border/70 bg-card shadow-[0_5px_14px_-7px_rgb(15_23_42/0.7)] transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
        aria-hidden="true"
      />
      <Sun className="theme-toggle-sun relative z-10 size-4 transition-[transform,color,opacity] duration-500" aria-hidden="true" />
      <Moon className="theme-toggle-moon relative z-10 size-4 transition-[transform,color,opacity] duration-500" aria-hidden="true" />
    </button>
  );
}
