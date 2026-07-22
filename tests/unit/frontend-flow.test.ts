import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const requiredPages = [
  "app/page.tsx", "app/jobs/page.tsx", "app/jobs/[id]/page.tsx", "app/sign-in/page.tsx", "app/register/page.tsx",
  "app/onboarding/role/page.tsx", "app/onboarding/worker/page.tsx", "app/onboarding/employer/page.tsx",
  "app/worker/dashboard/page.tsx", "app/worker/profile/page.tsx", "app/worker/applications/page.tsx", "app/worker/agreements/[id]/page.tsx", "app/worker/work/[id]/page.tsx", "app/worker/passport/page.tsx", "app/worker/notifications/page.tsx",
  "app/employer/dashboard/page.tsx", "app/employer/jobs/new/page.tsx", "app/employer/jobs/[id]/page.tsx", "app/employer/jobs/[id]/applicants/page.tsx", "app/employer/agreements/[id]/page.tsx", "app/employer/work/[id]/page.tsx", "app/employer/opportunity-credits/page.tsx", "app/employer/notifications/page.tsx",
  "app/admin/page.tsx", "app/admin/reports/page.tsx", "app/admin/jobs/page.tsx", "app/admin/users/page.tsx", "app/admin/wage-guidelines/page.tsx", "app/admin/audit-logs/page.tsx",
  "app/account/continue/page.tsx",
] as const;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

describe("frontend flow surface", () => {
  test("implements every documented MVP page", () => {
    for (const page of requiredPages) expect(existsSync(page), page).toBe(true);
    expect(existsSync("app/onboarding/loading.tsx")).toBe(true);
  });

  test("public job screens do not contain the private demo street address", async () => {
    for (const page of ["app/jobs/page.tsx", "app/jobs/[id]/page.tsx", "components/rintara/job-card.tsx"]) {
      expect(await Bun.file(page).text()).not.toContain("Jl. Contoh");
    }
  });

  test("motion remains lightweight and provides a reduced-motion path", async () => {
    const packageJson = JSON.parse(await Bun.file("package.json").text()) as { dependencies?: Record<string, string> };
    expect(packageJson.dependencies?.["framer-motion"]).toBeUndefined();
    expect(packageJson.dependencies?.motion).toBeUndefined();
    expect(packageJson.dependencies?.gsap).toBeUndefined();
    expect(packageJson.dependencies?.lenis).toBeUndefined();

    const css = await Bun.file("app/globals.css").text();
    const manager = await Bun.file(
      "components/rintara/scroll-reveal-manager.tsx",
    ).text();
    const publicShell = await Bun.file(
      "components/rintara/public-shell.tsx",
    ).text();
    const dashboardShell = await Bun.file(
      "features/dashboard/components/dashboard-shell.tsx",
    ).text();

    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(".scroll-progress");
    expect(css).toContain(".reveal-on-scroll");
    expect(css).toContain(".reveal-observer-ready");
    expect(css).toContain("reveal-on-scroll-once");
    expect(css).toContain("760ms");
    expect(css).not.toContain(".page-enter");
    expect(manager).toContain("IntersectionObserver");
    expect(manager).toContain("MutationObserver");
    expect(manager).toContain('"IntersectionObserver" in window');
    expect(manager).toContain("observer.unobserve(target)");
    expect(manager).toContain('document.addEventListener("focusin"');
    expect(manager).toContain("prefers-reduced-motion: reduce");
    expect(manager).toContain('"[data-scroll-flow], [data-dashboard-flow]"');
    expect(manager).not.toContain('mutationObserver.observe(document.body');
    expect(manager).not.toContain('"[data-dashboard-flow] >');
    expect(publicShell).toContain("data-scroll-flow");
    expect(dashboardShell).toContain("data-dashboard-flow");
    expect(publicShell).not.toContain("page-enter");
    expect(dashboardShell).not.toContain("page-enter");
  });

  test("keeps implementation-stage language out of user-facing source", () => {
    const forbiddenPhrases = [
      "Pratinjau frontend",
      "Mode demo",
      "kompetisi",
      "Data sintetis",
      "selama MVP",
    ];

    for (const path of [
      ...sourceFiles("app"),
      ...sourceFiles("components"),
      ...sourceFiles("features"),
    ]) {
      const source = readFileSync(path, "utf8");
      for (const phrase of forbiddenPhrases) {
        expect(source, `${path} contains \"${phrase}\"`).not.toContain(phrase);
      }
    }
  });

  test("keeps the interactive particle field lightweight and motion-safe", async () => {
    const field = await Bun.file("components/rintara/pointer-particle-field.tsx").text();
    const responsiveField = await Bun.file(
      "components/rintara/responsive-particle-field.tsx",
    ).text();
    const backdrop = await Bun.file("components/rintara/ambient-backdrop.tsx").text();
    const css = await Bun.file("app/globals.css").text();

    expect(field).toContain("requestAnimationFrame");
    expect(field).toContain("cancelAnimationFrame");
    expect(field).toContain("ResizeObserver");
    expect(field).toContain("IntersectionObserver");
    expect(field).toContain("visibilitychange");
    expect(field).toContain("prefers-reduced-motion: reduce");
    expect(field).toContain("(hover: hover) and (pointer: fine)");
    expect(field).toContain("saveData");
    expect(field).toContain("deviceMemory");
    expect(field).toContain("hardwareConcurrency");
    expect(field).toContain("reducedQuality ? 24 : 30");
    expect(field).toContain("reducedQuality ? 1.15 : 1.25");
    expect(field).toMatch(/\? 160\s+: 120/);
    expect(field).toContain("compactViewport || veryLowPower ? 1");
    expect(field).toContain("removePointerListeners");
    expect(field).toContain("visible && pageVisible && width > 0 && height > 0");
    expect(field).not.toContain("canvas.dataset.");
    expect(backdrop).toContain("<ResponsiveParticleField");
    expect(backdrop).toContain('variant === "hero" || variant === "auth"');
    expect(backdrop).not.toContain("ambient-artwork");
    expect(backdrop).not.toContain("ambient-route");
    expect(backdrop).not.toContain("<svg");
    expect(responsiveField).toContain("dynamic(");
    expect(responsiveField).toContain("INTERACTIVE_POINTER_QUERY");
    expect(responsiveField).toContain("saveData");
    expect(responsiveField).toContain("hardwareConcurrency");
    expect(responsiveField).toContain("ambient-static-particles");
    expect(responsiveField).toContain('variant === "auth" && !desktopViewport');
    expect(css).not.toContain("rintara-path-atmosphere.webp");
    expect(css).not.toContain(".ambient-route");
    expect(css).toContain(".ambient-static-particles");
    expect(css).toContain("@media (min-width: 64rem) and (update: fast)");
    expect(css).toContain("@media (update: slow)");
  });

  test("keeps static decorative route vectors out of application surfaces", async () => {
    const routeDecoratedPages = [
      "app/employer/dashboard/page.tsx",
      "app/worker/dashboard/page.tsx",
      "app/worker/passport/page.tsx",
      "app/worker/profile/page.tsx",
      "app/worker/agreements/[id]/page.tsx",
      "app/worker/work/[id]/page.tsx",
    ];

    for (const page of routeDecoratedPages) {
      const source = await Bun.file(page).text();
      expect(source, `${page} contains a static route vector`).not.toContain("strokeDasharray");
    }
  });

  test("returns failed authentication callbacks to the active sign-in route", async () => {
    const callback = await Bun.file("app/auth/callback/route.ts").text();
    expect(callback).toContain('new URL("/sign-in", request.url)');
    expect(callback).toContain(
      'signInUrl.searchParams.set("error", "authentication_failed")',
    );
    expect(callback).toContain('signInUrl.searchParams.set("next", next)');
    expect(callback).not.toContain('new URL("/login');
  });

  test("avoids speculative loading of alternate authentication screens", async () => {
    const shell = await Bun.file("features/auth/components/auth-shell.tsx").text();
    const switcher = await Bun.file(
      "features/auth/components/auth-route-switch.tsx",
    ).text();
    const header = await Bun.file(
      "components/rintara/public-header.tsx",
    ).text();

    expect(shell.match(/prefetch=\{false\}/g)?.length).toBeGreaterThanOrEqual(4);
    expect(switcher.match(/prefetch=\{false\}/g)?.length).toBe(2);
    expect(header).toContain("checkingAuth");
    expect(header).toContain('aria-label="Memeriksa status akun"');
    expect(header).toContain("min-w-80");
  });

  test("preserves the originating job across authentication UI states", async () => {
    const register = await Bun.file(
      "features/auth/components/register-form.tsx",
    ).text();
    const applyAction = await Bun.file(
      "components/rintara/job-apply-auth-action.tsx",
    ).text();
    const jobDetail = await Bun.file("app/jobs/[id]/page.tsx").text();
    const authState = await Bun.file(
      "features/auth/use-public-auth-state.ts",
    ).text();
    const authStatus = await Bun.file("app/auth/status/route.ts").text();

    expect(register).toContain("const signInHref = nextPath");
    expect(register).toContain("<Link href={signInHref}");
    expect(applyAction).toContain("usePublicAuthState");
    expect(applyAction).not.toContain("supabase.auth");
    expect(applyAction).not.toContain("@/lib/supabase/client");
    expect(applyAction).toContain("<JobApplicationForm jobId={jobId} />");
    expect(applyAction).toContain("query: { next: `/jobs/${jobId}` }");
    expect(authState).toContain('fetch("/auth/status"');
    expect(authState).toContain("AUTH_STATE_CACHE_MS = 15_000");
    expect(authState).toContain("pendingRequest");
    expect(authStatus).toContain('request.headers.get("x-rintara-verified-session")');
    expect(authStatus).toContain('"Cache-Control": "private, no-store, max-age=0"');
    expect(jobDetail).toContain("<JobApplyAuthAction jobId={job.id} />");
  });

  test("provides a persistent accessible light and dark theme", async () => {
    const packageJson = JSON.parse(await Bun.file("package.json").text()) as { dependencies?: Record<string, string> };
    const layout = await Bun.file("app/layout.tsx").text();
    const css = await Bun.file("app/globals.css").text();
    const toggle = await Bun.file("components/rintara/theme-toggle.tsx").text();

    expect(packageJson.dependencies?.["next-themes"]).toBeDefined();
    expect(layout).toContain("suppressHydrationWarning");
    expect(layout).toContain("<ThemeProvider>");
    expect(css).toContain(".dark {");
    expect(css).toContain("@keyframes theme-reveal");
    expect(toggle).toContain("startViewTransition");
    expect(toggle).toContain("transitioning");
    expect(toggle).toContain("transitionLockRef");
    expect(toggle).toContain("prefers-reduced-motion: reduce");
    expect(toggle).toContain("simpleTransition");
    expect(toggle).toContain("(update: slow)");
    expect(toggle).toContain("saveData");
    expect(toggle).toContain("deviceMemory");
    expect(toggle).toContain("theme-toggle-knob");
    expect(toggle).not.toContain('dark && "translate-x-10"');
    expect(css).toContain(".dark .theme-toggle-knob");
    expect(toggle).toContain("aria-label={`Aktifkan mode ${targetLabel}`}");
    expect(toggle.match(/<Sun\b/g)?.length).toBe(1);
    expect(toggle.match(/<Moon\b/g)?.length).toBe(1);
  });

  test("keeps the public navigation and hero proof artifacts intentionally aligned", async () => {
    const header = await Bun.file("components/rintara/public-header.tsx").text();
    const home = await Bun.file("app/page.tsx").text();

    expect(header).toContain("data-public-nav-cluster");
    expect(home).toContain("hero-eyebrow");
    expect(home).toContain("data-hero-proof-row");
    expect(home).toContain("grid-cols-2");
    expect(home).not.toContain("border-b border-opportunity/45");
  });

  test("keeps the documented registration stages and profile fields visible", async () => {
    const shell = await Bun.file("features/auth/components/auth-shell.tsx").text();
    const workerPage = await Bun.file("app/onboarding/worker/page.tsx").text();
    const employerPage = await Bun.file("app/onboarding/employer/page.tsx").text();
    const worker = await Bun.file("features/onboarding/components/worker-onboarding-form.tsx").text();
    const employer = await Bun.file("features/onboarding/components/employer-onboarding-form.tsx").text();

    expect(shell).toContain('["Akun", "Peran", "Profil"]');
    expect(shell).toContain("Kesempatan");
    expect(shell).toContain("Kesepakatan");
    expect(shell).toContain("Bukti Kerja");
    expect(worker).toContain("Bio singkat");
    expect(worker).toContain("Ketersediaan");
    expect(worker).toContain("Kategori yang diminati");
    expect(employer).toContain("Jenis pemberi kerja");
    expect(employer).toContain("Deskripsi singkat");
    expect(workerPage).toContain("getOnboardingReferenceData");
    expect(employerPage).toContain("getOnboardingAreaOptions");
    expect(employerPage).not.toContain("getOnboardingReferenceData");
    expect(worker).toContain("submitWorkerOnboarding");
    expect(employer).toContain("submitEmployerOnboarding");
  });

  test("prevents same-tick duplicate submissions without clearing valid input", async () => {
    const guardedForms = [
      "features/auth/components/sign-in-form.tsx",
      "features/auth/components/register-form.tsx",
      "features/onboarding/components/worker-onboarding-form.tsx",
      "features/onboarding/components/employer-onboarding-form.tsx",
    ];

    for (const path of guardedForms) {
      const source = await Bun.file(path).text();
      expect(source, path).toContain("submittingRef");
      expect(source, path).toContain("submittingRef.current");
      expect(source, path).not.toContain("router.refresh()");
      expect(source, path).not.toContain(".reset()");
    }

    const dashboardShell = await Bun.file(
      "features/dashboard/components/dashboard-shell.tsx",
    ).text();
    expect(dashboardShell).toContain("signingOutRef");
    expect(dashboardShell).toContain("if (signingOutRef.current) return");
    expect(dashboardShell).toContain("Koneksi terputus saat keluar");
    expect(dashboardShell).not.toContain("router.refresh()");
  });

  test("keeps role selection, category grouping, and shared controls accessible", async () => {
    const roleSelection = await Bun.file(
      "features/onboarding/components/role-selection.tsx",
    ).text();
    const workerForm = await Bun.file(
      "features/onboarding/components/worker-onboarding-form.tsx",
    ).text();
    const button = await Bun.file("components/ui/button.tsx").text();
    const input = await Bun.file("components/ui/input.tsx").text();
    const select = await Bun.file("components/ui/select.tsx").text();

    expect(roleSelection).toContain('aria-label="Pilih peran aktif Rintara"');
    expect(workerForm).toMatch(/<fieldset[^>]*>\s*<legend/);
    expect(button).toContain('default:\n          "h-11');
    expect(button).toContain('icon: "size-11"');
    expect(input).toContain('"h-11 w-full');
    expect(select).toContain('size === "default" ? "h-11"');
    expect(select).toContain('"relative flex min-h-11');
    for (const primitive of [
      "components/ui/alert.tsx",
      "components/rintara/status-badge.tsx",
    ]) {
      expect(existsSync(primitive), primitive).toBe(true);
    }
  });

  test("does not ship an unused second font or global tooltip client provider", async () => {
    const layout = await Bun.file("app/layout.tsx").text();
    const css = await Bun.file("app/globals.css").text();

    expect(layout).not.toContain("Geist_Mono");
    expect(layout).not.toContain("TooltipProvider");
    expect(css).toContain("--font-mono: ui-monospace");
  });
});
