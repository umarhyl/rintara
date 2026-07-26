"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileApplyDock({ wage }: { wage: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const targets = [
      document.querySelector("#apply"),
      document.querySelector("footer"),
    ].filter((target): target is Element => target !== null);

    if (targets.length === 0) return;

    const intersecting = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersecting.set(
            entry.target,
            entry.isIntersecting && entry.intersectionRatio > 0.08,
          );
        }
        setVisible(![...intersecting.values()].some(Boolean));
      },
      { threshold: [0, 0.08, 0.2] },
    );

    for (const target of targets) {
      intersecting.set(target, false);
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-20px_rgb(16_37_27/0.6)] transition-[opacity,translate] duration-200 lg:hidden",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-[calc(100%+1rem)] opacity-0",
      )}
      aria-hidden={!visible}
      inert={!visible}
      data-job-apply-dock
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">Upah tetap</p>
          <p className="truncate font-semibold">{wage}</p>
        </div>
        <Button className="h-11 shrink-0" asChild>
          <Link href="#apply">Lamar</Link>
        </Button>
      </div>
    </div>
  );
}
