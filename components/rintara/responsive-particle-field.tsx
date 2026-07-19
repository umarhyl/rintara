"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

type ParticleFieldVariant = "hero" | "auth";

type PerformanceNavigator = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

const DESKTOP_QUERY = "(min-width: 64rem)";
const INTERACTIVE_POINTER_QUERY =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const LazyPointerParticleField = dynamic(
  () =>
    import("@/components/rintara/pointer-particle-field").then(
      (module) => module.PointerParticleField,
    ),
  { ssr: false },
);

function subscribeToDesktopViewport(onChange: () => void) {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getServerDesktopSnapshot() {
  return false;
}

function subscribeToCanvasCapability(onChange: () => void) {
  const mediaQuery = window.matchMedia(INTERACTIVE_POINTER_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getCanvasCapabilitySnapshot() {
  const performanceNavigator = navigator as PerformanceNavigator;
  const memory = performanceNavigator.deviceMemory;
  const processors = performanceNavigator.hardwareConcurrency || 8;

  return (
    window.matchMedia(INTERACTIVE_POINTER_QUERY).matches &&
    performanceNavigator.connection?.saveData !== true &&
    processors > 2 &&
    (memory === undefined || memory > 2)
  );
}

function getServerCanvasCapabilitySnapshot() {
  return false;
}

export function ResponsiveParticleField({
  variant,
}: {
  variant: ParticleFieldVariant;
}) {
  const desktopViewport = useSyncExternalStore(
    subscribeToDesktopViewport,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  );
  const canvasCapable = useSyncExternalStore(
    subscribeToCanvasCapability,
    getCanvasCapabilitySnapshot,
    getServerCanvasCapabilitySnapshot,
  );

  if (!canvasCapable || (variant === "auth" && !desktopViewport)) {
    return (
      <span
        className="ambient-static-particles absolute inset-0"
        aria-hidden="true"
      />
    );
  }

  return <LazyPointerParticleField variant={variant} />;
}
