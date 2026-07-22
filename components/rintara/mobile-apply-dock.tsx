"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileApplyDock({ wage }: { wage: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const targets = [document.querySelector("#apply"), document.querySelector("footer")].filter(
      (target): target is Element => target !== null,
    );

    if (targets.length === 0) return;

    const intersecting = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersecting.set(entry.target, entry.isIntersecting && entry.intersectionRatio > 0.08);
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
        "fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-border/80 bg-card/90 p-3 shadow-[0_20px_55px_-28px_rgb(15_23_42/0.55)] backdrop-blur-2xl transition-[opacity,translate] duration-500 lg:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+1rem)] opacity-0",
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
        <Button className="rounded-full" asChild>
          <Link href="#apply">Lamar sekarang</Link>
        </Button>
      </div>
    </div>
  );
}
