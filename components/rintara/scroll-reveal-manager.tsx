"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR = [
  ".reveal-on-scroll",
  "[data-scroll-flow] > [data-scroll-section]:not(:has([data-reveal-list]))",
  "[data-reveal-list] > *",
].join(",");

export function ScrollRevealManager() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canObserve = "IntersectionObserver" in window;

    if (reducedMotion || !canObserve) {
      return;
    }

    const managedTargets = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.dataset.revealed = "true";
          observer.unobserve(target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );

    function prepareTarget(target: HTMLElement, bounds: DOMRect) {
      if (managedTargets.has(target)) return;
      managedTargets.add(target);

      if (target.parentElement?.matches("[data-reveal-list]")) {
        const index = [...target.parentElement.children].indexOf(target);
        target.style.setProperty(
          "--reveal-delay",
          `${Math.min(Math.max(index, 0), 3) * 90}ms`,
        );
      }

      if (
        target.dataset.revealed === "true" ||
        bounds.top <= window.innerHeight * 0.92 ||
        bounds.bottom <= 0
      ) {
        target.dataset.revealed = "true";
        target.dataset.revealSkip = "true";
        return;
      }

      observer.observe(target);
    }

    function prepareTree(node: Node) {
      if (!(node instanceof Element)) return;
      const targets: HTMLElement[] = [];
      if (node.matches(REVEAL_SELECTOR) && node instanceof HTMLElement) {
        targets.push(node);
      }
      for (const target of node.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)) {
        targets.push(target);
      }
      const bounds = targets.map((target) => target.getBoundingClientRect());
      targets.forEach((target, index) => prepareTarget(target, bounds[index]!));
    }

    const initialTargets = [
      ...document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
    ];
    const initialBounds = initialTargets.map((target) =>
      target.getBoundingClientRect(),
    );
    initialTargets.forEach((target, index) =>
      prepareTarget(target, initialBounds[index]!),
    );

    root.classList.add("reveal-observer-ready");

    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) prepareTree(node);
      }
    });
    const contentRoot =
      document.querySelector<HTMLElement>(
        "[data-scroll-flow], [data-dashboard-flow]",
      ) ?? document.body;
    mutationObserver.observe(contentRoot, { childList: true, subtree: true });

    function revealFocusedContent(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>(REVEAL_SELECTOR);
      if (!target) return;
      target.dataset.revealed = "true";
      target.dataset.revealSkip = "true";
      target.style.setProperty("--reveal-delay", "0ms");
      observer.unobserve(target);
    }

    document.addEventListener("focusin", revealFocusedContent);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener("focusin", revealFocusedContent);
      root.classList.remove("reveal-observer-ready");
      for (const target of managedTargets) {
        target.style.removeProperty("--reveal-delay");
      }
    };
  }, [pathname]);

  return null;
}
