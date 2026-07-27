import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const requiredPages = [
  "app/page.tsx",
  "app/for-workers/page.tsx",
  "app/for-employers/page.tsx",
  "app/categories/page.tsx",
  "app/why-rintara/page.tsx",
  "app/jobs/page.tsx",
  "app/jobs/[id]/page.tsx",
  "app/(public-auth)/sign-in/page.tsx",
  "app/(public-auth)/register/page.tsx",
  "app/(public-auth)/forgot-password/page.tsx",
  "app/(public-auth)/reset-password/page.tsx",
  "app/onboarding/role/page.tsx",
  "app/onboarding/worker/page.tsx",
  "app/onboarding/employer/page.tsx",
  "app/worker/dashboard/page.tsx",
  "app/worker/profile/page.tsx",
  "app/worker/applications/page.tsx",
  "app/worker/agreements/[id]/page.tsx",
  "app/worker/work/[id]/page.tsx",
  "app/worker/passport/page.tsx",
  "app/worker/notifications/page.tsx",
  "app/worker/reports/page.tsx",
  "app/employer/dashboard/page.tsx",
  "app/employer/jobs/page.tsx",
  "app/employer/jobs/new/page.tsx",
  "app/employer/jobs/[id]/page.tsx",
  "app/employer/jobs/[id]/applicants/page.tsx",
  "app/employer/agreements/[id]/page.tsx",
  "app/employer/work/[id]/page.tsx",
  "app/employer/opportunity-credits/page.tsx",
  "app/employer/notifications/page.tsx",
  "app/employer/reports/page.tsx",
  "app/admin/page.tsx",
  "app/admin/reports/page.tsx",
  "app/admin/jobs/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/wage-guidelines/page.tsx",
  "app/admin/audit-logs/page.tsx",
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
    for (const page of [
      "app/jobs/page.tsx",
      "app/jobs/[id]/page.tsx",
      "components/rintara/job-card.tsx",
    ]) {
      expect(await Bun.file(page).text()).not.toContain("Jl. Contoh");
    }
  });

  test("motion remains lightweight and provides a reduced-motion path", async () => {
    const packageJson = JSON.parse(await Bun.file("package.json").text()) as {
      dependencies?: Record<string, string>;
    };
    expect(packageJson.dependencies?.["framer-motion"]).toBeUndefined();
    expect(packageJson.dependencies?.motion).toBeUndefined();
    expect(packageJson.dependencies?.gsap).toBeUndefined();
    expect(packageJson.dependencies?.lenis).toBeUndefined();

    const css = await Bun.file("app/globals.css").text();
    const publicShell = await Bun.file(
      "components/rintara/public-shell.tsx",
    ).text();
    const dashboardShell = await Bun.file(
      "features/dashboard/components/dashboard-shell.tsx",
    ).text();

    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).not.toContain(".hero-media-enter");
    expect(css).not.toContain("@keyframes hero-media-enter");
    expect(css).not.toContain(".auth-form-enter");
    expect(css).toContain("animation-duration: 0.01ms");
    expect(css).not.toContain(".scroll-progress");
    expect(css).not.toContain(".reveal-on-scroll");
    expect(css).not.toContain("animation-iteration-count: infinite");
    expect(existsSync("components/rintara/scroll-reveal-manager.tsx")).toBe(
      false,
    );
    expect(publicShell).not.toContain("ScrollReveal");
    expect(publicShell).not.toContain("data-scroll-flow");
    expect(dashboardShell).not.toContain("ScrollReveal");
    expect(dashboardShell).not.toContain("data-dashboard-flow");
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

  test("removes expensive decorative ambience from product surfaces", async () => {
    const home = await Bun.file("app/page.tsx").text();
    const css = await Bun.file("app/globals.css").text();

    for (const path of [
      "components/rintara/ambient-backdrop.tsx",
      "components/rintara/pointer-particle-field.tsx",
      "components/rintara/responsive-particle-field.tsx",
    ]) {
      expect(existsSync(path), path).toBe(false);
    }
    expect(existsSync("public/visuals/rintara-local-work-v2.webp")).toBe(true);
    expect(home).toContain('from "next/image"');
    expect(home).toContain("/visuals/rintara-local-work-v2.webp");
    expect(home).toContain('loading="eager"');
    expect(home).toContain('fetchPriority="high"');
    expect(home).toContain('sizes="(max-width: 1023px) 100vw, 55vw"');
    expect(home).toContain(
      'alt="Pekerja menyiapkan perlengkapan untuk pekerjaan lokal"',
    );
    expect(home).not.toContain("listPublishedJobs");
    expect(home).toContain("getPublicJobReferenceData");
    expect(home).toContain('name="location"');
    expect(home).not.toContain("AmbientBackdrop");
    expect(css).not.toContain("rintara-path-atmosphere.webp");
    expect(css).not.toContain("ambient-static-particles");
    expect(css).not.toContain("particle");
    expect(css).not.toContain("canvas");
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
      expect(source, `${page} contains a static route vector`).not.toContain(
        "strokeDasharray",
      );
    }
  });

  test("keeps role dashboards dense, truthful, and singly addressable", async () => {
    const shell = await Bun.file(
      "features/dashboard/components/dashboard-shell.tsx",
    ).text();
    const pageHeader = await Bun.file(
      "features/dashboard/components/page-header.tsx",
    ).text();
    const workerDashboard = await Bun.file(
      "app/worker/dashboard/page.tsx",
    ).text();
    const employerDashboard = await Bun.file(
      "app/employer/dashboard/page.tsx",
    ).text();
    const creditQuery = await Bun.file(
      "server/queries/rewards/employer-credits.ts",
    ).text();
    const jobForm = await Bun.file(
      "features/employer/components/job-form.tsx",
    ).text();
    const newJobPage = await Bun.file(
      "app/employer/jobs/new/page.tsx",
    ).text();
    const editJobPage = await Bun.file(
      "app/employer/jobs/[id]/edit/page.tsx",
    ).text();

    expect(shell).toContain("resolveDashboardActiveHref");
    expect(shell).toContain("const active = item.href === activeHref");
    expect(shell).toContain("<DashboardAccountMenu");
    expect(shell).toContain('aria-label={`Buka menu akun');
    expect(shell).toContain("role !== \"admin\"");
    expect(shell).toContain('className="size-11 rounded-full');
    expect(shell).not.toContain(
      'role === "admin" ? "/admin/reports" : `/${role}/notifications`',
    );
    expect(pageHeader).not.toContain("border-b border-border");

    expect(workerDashboard).toContain("Promise.all");
    expect(workerDashboard).toContain("listMyApplications({ limit: 3 })");
    expect(workerDashboard).toContain("Buka Mini Agreement");
    expect(workerDashboard).toContain("Aktivitas lamaran");

    expect(employerDashboard).toContain("getMyCreditDashboardSummary");
    expect(employerDashboard).toContain("Perlu ditindak");
    expect(employerDashboard).toContain("Tinjau pelamar");
    expect(employerDashboard).not.toContain("divide-y divide-border");
    expect(employerDashboard).not.toContain("border-y border-border");
    expect(creditQuery).toContain(
      "export async function getMyCreditDashboardSummary",
    );
    expect(creditQuery).toContain(
      "eq(opportunityCredits.employerId, actor.userId)",
    );
    expect(creditQuery).toContain("eq(jobs.employerId, actor.userId)");

    expect(jobForm).toContain(
      "xl:grid-cols-[minmax(0,1fr)_20rem]",
    );
    expect(jobForm).not.toContain("lg:grid-cols-[1fr_360px]");
    expect(jobForm).not.toContain('className="mt-12');
    expect(jobForm).not.toContain('className="min-h-6');
    expect(newJobPage).not.toContain("px-4 py-12");
    expect(editJobPage).not.toContain("px-4 py-12");
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

  test("provides a non-enumerating password recovery path", async () => {
    const signInForm = await Bun.file(
      "features/auth/components/sign-in-form.tsx",
    ).text();
    const recoveryForm = await Bun.file(
      "features/auth/components/forgot-password-form.tsx",
    ).text();
    const resetPage = await Bun.file(
      "app/(public-auth)/reset-password/page.tsx",
    ).text();
    const callback = await Bun.file("app/auth/callback/route.ts").text();

    expect(signInForm).toContain('href="/forgot-password"');
    expect(recoveryForm).toContain("Jika email tersebut terdaftar");
    expect(resetPage).toContain("supabase.auth.getUser()");
    expect(callback).toContain('next === "/reset-password"');
    expect(callback).toContain('new URL("/forgot-password", request.url)');
  });

  test("keeps one persistent authentication frame across both entry routes", async () => {
    const shell = await Bun.file(
      "features/auth/components/auth-shell.tsx",
    ).text();
    const layout = await Bun.file(
      "app/(public-auth)/layout.tsx",
    ).text();
    const signInPage = await Bun.file(
      "app/(public-auth)/sign-in/page.tsx",
    ).text();
    const registerPage = await Bun.file(
      "app/(public-auth)/register/page.tsx",
    ).text();
    const switcher = await Bun.file(
      "features/auth/components/auth-route-switch.tsx",
    ).text();
    const surfaceState = await Bun.file(
      "features/auth/components/auth-surface-state.tsx",
    ).text();
    const header = await Bun.file(
      "components/rintara/public-header.tsx",
    ).text();
    const accountMenu = await Bun.file(
      "components/rintara/public-account-menu.tsx",
    ).text();

    expect(shell.match(/prefetch=\{false\}/g)?.length).toBeGreaterThanOrEqual(
      4,
    );
    expect(existsSync("public/visuals/rintara-auth-work-v1.webp")).toBe(true);
    expect(shell).toContain('from "next/image"');
    expect(shell).toContain("/visuals/rintara-auth-work-v1.webp");
    expect(shell).toContain('sizes="(max-width: 1023px) 100vw, 42vw"');
    expect(shell.match(/<Image/g)?.length).toBe(1);
    expect(layout).toContain("<AuthVisualFrame>");
    expect(layout).toContain("<AuthSurfaceProvider>");
    expect(signInPage).toContain("<AuthPanel");
    expect(registerPage).toContain("<AuthPanel");
    expect(signInPage).toContain('active="sign-in"');
    expect(registerPage).toContain('active="register"');
    expect(signInPage).toContain("safeApplicationPath");
    expect(registerPage).toContain("safeApplicationPath");
    expect(switcher).toContain('label: "Masuk"');
    expect(switcher).toContain('label: "Daftar"');
    expect(switcher).toContain("grid-cols-2");
    expect(switcher).toContain('aria-current={selected ? "page"');
    expect(switcher).toContain("(busy || switching) && !selected");
    expect(switcher).toContain("data-auth-mode-slider");
    expect(switcher).toContain('selectedMode === "register"');
    expect(switcher).toContain("translate-x-full");
    expect(switcher).toContain("cubic-bezier(0.16,1,0.3,1)");
    expect(switcher).toContain("navigationDelay = reducedMotion ? 0 : 220");
    expect(switcher).toContain("router.push(href)");
    expect(switcher).not.toContain("Belum punya akun?");
    expect(switcher).not.toContain("Sudah punya akun?");
    expect(surfaceState).toContain("signInPassword");
    expect(surfaceState).toContain("registerPassword");
    expect(surfaceState).toContain("termsAccepted");
    expect(surfaceState).toContain("visualMode");
    expect(header).toContain("checkingAccount");
    expect(header).toContain('aria-label="Memeriksa status akun"');
    expect(header).toContain("usePublicAccountState");
    expect(header).toContain("<PublicAccountMenu");
    expect(header).toContain("data-public-nav-cluster");
    expect(header).toContain('label: "Untuk pekerja"');
    expect(header).toContain('label: "Untuk pemberi kerja"');
    expect(header).toContain("Kategori kerja");
    expect(header).toContain("Cara kerja");
    expect(header).toContain("Mengapa Rintara");
    expect(header).toContain("DropdownMenuTrigger");
    expect(header).toContain("DropdownMenuContent");
    expect(header).toContain("data-public-audience-trigger");
    expect(header).toContain("data-mobile-audience-menu");
    expect(header).toContain('href: "/jobs?opportunity=first"');
    expect(header).toContain('href: "/for-workers#alur-bukti-kerja"');
    expect(header).toContain('href: "/for-employers#alur-pekerjaan"');
    expect(header).toContain('href: "/for-employers#ketentuan-privasi"');
    expect(header).toContain('href: "/for-employers#kredit-kesempatan"');
    expect(header).not.toContain('label: "Pasang pekerjaan"');
    expect(header).not.toContain('href: "/first-opportunity"');
    expect(header).toContain('href="/sign-in"');
    expect(header).toContain('href="/register"');
    expect(header).not.toContain("Ruang kerja");
    expect(accountMenu).toContain("rounded-full");
    expect(accountMenu).toContain("Buka menu akun");
    expect(accountMenu).toContain('href: "/worker/dashboard"');
    expect(accountMenu).toContain('href: "/worker/applications"');
    expect(accountMenu).toContain('href: "/worker/passport"');
    expect(accountMenu).toContain('href: "/worker/profile"');
    expect(accountMenu).toContain('href: "/employer/dashboard"');
    expect(accountMenu).toContain('href: "/employer/jobs/new"');
    expect(accountMenu).toContain('href: "/employer/jobs"');
    expect(accountMenu).toContain(
      'href: "/employer/opportunity-credits"',
    );
    expect(accountMenu).toContain(
      'href: "/employer/settings/profile"',
    );
    expect(accountMenu).toContain('href: "/admin"');
    expect(accountMenu).toContain(
      'accountState.kind === "ready"',
    );
    expect(accountMenu).toContain(
      'accountState.kind === "onboarding"',
    );
    expect(accountMenu).toContain(
      'accountState.kind === "inactive"',
    );
    expect(accountMenu).toContain(
      'accountState.kind === "unavailable"',
    );
    expect(accountMenu).toContain("signingOutRef");
    expect(accountMenu).toContain("if (signingOutRef.current) return");
    expect(accountMenu).toContain('primePublicAuthState("anonymous")');
    expect(accountMenu).toContain("Koneksi terputus saat keluar");
    expect(accountMenu).toContain('role="alert"');
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

    expect(register).toContain('pathname: "/sign-in"');
    expect(register).toContain("query: { next: onboardingPath }");
    expect(applyAction).toContain("usePublicAccountState");
    expect(applyAction).not.toContain("supabase.auth");
    expect(applyAction).not.toContain("@/lib/supabase/client");
    expect(applyAction).toContain("<JobApplicationForm jobId={jobId} />");
    expect(applyAction).toContain("query: { next: `/jobs/${jobId}` }");
    expect(authState).toContain('fetch("/auth/status"');
    expect(authState).toContain("AUTH_STATE_CACHE_MS = 15_000");
    expect(authState).toContain("pendingRequest");
    expect(authStatus).toContain(
      'request.headers.get("x-rintara-verified-session")',
    );
    expect(authStatus).toContain(
      '"Cache-Control": "private, no-store, max-age=0"',
    );
    expect(jobDetail).toContain("<JobApplyAuthAction jobId={job.id} />");
  });

  test("keeps the interface light-only without a runtime theme switch", async () => {
    const packageJson = JSON.parse(await Bun.file("package.json").text()) as {
      dependencies?: Record<string, string>;
    };
    const layout = await Bun.file("app/layout.tsx").text();
    const css = await Bun.file("app/globals.css").text();
    const header = await Bun.file(
      "components/rintara/public-header.tsx",
    ).text();
    const authShell = await Bun.file(
      "features/auth/components/auth-shell.tsx",
    ).text();
    const dashboardShell = await Bun.file(
      "features/dashboard/components/dashboard-shell.tsx",
    ).text();

    expect(packageJson.dependencies?.["next-themes"]).toBeUndefined();
    expect(layout).not.toContain("ThemeProvider");
    expect(layout).not.toContain("suppressHydrationWarning");
    expect(css).toContain("color-scheme: light");
    expect(css).not.toContain("@custom-variant dark");
    expect(css).not.toContain(".dark {");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(existsSync("components/rintara/theme-toggle.tsx")).toBe(false);
    expect(existsSync("components/rintara/theme-provider.tsx")).toBe(false);
    expect(header).not.toContain("ThemeToggle");
    expect(authShell).not.toContain("ThemeToggle");
    expect(dashboardShell).not.toContain("ThemeToggle");

    for (const path of [
      ...sourceFiles("app"),
      ...sourceFiles("components"),
      ...sourceFiles("features"),
    ]) {
      expect(
        readFileSync(path, "utf8"),
        `${path} contains dead dark styles`,
      ).not.toContain("dark:");
    }
  });

  test("shows the typing cursor only on editable controls", async () => {
    const css = await Bun.file("app/globals.css").text();

    expect(css).toContain("caret-color: transparent");
    expect(css).toContain('input[type="text"]');
    expect(css).toContain('input[type="search"]');
    expect(css).toContain("textarea,");
    expect(css).toContain('[contenteditable="true"]');
    expect(css).toContain("cursor: text");
    expect(css).toContain("caret-color: var(--primary)");
    expect(css).toContain("cursor: pointer");
    expect(css).toContain("cursor: not-allowed");
  });

  test("keeps public navigation aligned and makes job discovery primary", async () => {
    const header = await Bun.file(
      "components/rintara/public-header.tsx",
    ).text();
    const home = await Bun.file("app/page.tsx").text();
    const footer = await Bun.file(
      "components/rintara/public-footer.tsx",
    ).text();
    const firstOpportunity = await Bun.file(
      "app/first-opportunity/page.tsx",
    ).text();

    expect(header).toContain("data-public-nav-cluster");
    expect(header).toContain('href: "/for-workers"');
    expect(header).toContain('href: "/for-employers"');
    expect(header).toContain('href: "/categories"');
    expect(header).toContain('href: "/how-it-works"');
    expect(header).toContain('href: "/why-rintara"');
    expect(header).not.toContain('href: "/?role=');
    expect(header).not.toContain('href="/#');
    expect(header).toContain("DropdownMenu");
    expect(header).toContain("publicAudienceNavGroups");
    expect(header).toContain("group-open:rotate-180");
    expect(header).toContain("aria-current=");
    expect(header).toContain("Kategori kerja");
    expect(header).toContain("Mengapa Rintara");
    expect(header).not.toContain('label: "Pasang pekerjaan"');
    expect(home).toContain('role="search"');
    expect(home).toContain('name="q"');
    expect(home).toContain('name="location"');
    expect(home).toContain("getPublicJobReferenceData");
    expect(home).toContain('from "next/image"');
    expect(home).not.toContain("<JobCard");
    expect(home).toContain("referenceData.categories.slice(0, 8)");
    expect(home).toContain("referenceData.areas.slice(0, 6)");
    expect(home).toContain("data-home-search-panel");
    expect(home).toContain("data-home-hero-image");
    expect(home).toContain("lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]");
    expect(home).not.toContain("-mt-9");
    expect(home).toContain("query: { category: category.id }");
    expect(home).toContain("query: { location: area.id }");
    expect(home).toContain("data-home-category-grid");
    expect(home).toContain("data-home-category-card");
    expect(home).toContain("xl:grid-cols-5");
    expect(home).toContain("hover:border-primary");
    expect(home).toContain("focus-visible:border-primary");
    expect(home).toContain("Dari ketentuan menjadi Bukti Kerja");
    expect(home).toContain(
      "lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.94fr)_minmax(0,0.94fr)]",
    );
    expect(home).not.toContain("lg:grid-rows-2");
    expect(home).not.toContain("lg:row-span-2");
    expect(home).not.toContain("lg:justify-end");
    expect(home).toContain("Masuk sesuai kebutuhanmu");
    expect(home).toContain('id="mengapa-rintara"');
    expect(home).toContain('href="/for-workers"');
    expect(home).toContain('href="/for-employers"');
    expect(home).not.toContain("<HomeRolePaths");
    expect(existsSync("components/rintara/home-role-paths.tsx")).toBe(false);
    expect(home).not.toContain("Mulai cepat");
    expect(home).not.toContain("quickCategories");
    expect(footer).toContain("/for-workers");
    expect(footer).toContain("/for-employers");
    expect(footer).toContain("/categories");
    expect(footer).toContain("/why-rintara");
    expect(footer).not.toContain("/?role=");
    expect(footer).not.toContain("/#");
    expect(firstOpportunity).toContain('redirect("/jobs?opportunity=first")');
    expect(home).not.toContain("hero-eyebrow");
    expect(home).not.toContain("data-hero-proof-row");
  });

  test("keeps every public navigation destination useful and self-contained", async () => {
    const workerGuide = await Bun.file("app/for-workers/page.tsx").text();
    const employerGuide = await Bun.file("app/for-employers/page.tsx").text();
    const categories = await Bun.file("app/categories/page.tsx").text();
    const categoriesLoading = await Bun.file(
      "app/categories/loading.tsx",
    ).text();
    const categoriesError = await Bun.file("app/categories/error.tsx").text();
    const whyRintara = await Bun.file("app/why-rintara/page.tsx").text();

    expect(workerGuide).toContain(
      "Kesempatan Pertama tetap pekerjaan berbayar",
    );
    expect(workerGuide).toContain(
      "kelayakan untuk kategori pekerjaan tersebut dari Bukti Kerja",
    );
    expect(workerGuide).toContain('href="/jobs?opportunity=first"');
    expect(workerGuide).toContain('id="alur-bukti-kerja"');
    expect(workerGuide).toContain("Alamat tetap privat");
    expect(workerGuide).toContain("Lamaran tidak digunakan untuk menawar upah");

    expect(employerGuide).toContain("<EmployerPublishAction");
    expect(employerGuide).toContain('id="alur-pekerjaan"');
    expect(employerGuide).toContain('id="ketentuan-privasi"');
    expect(employerGuide).toContain('id="kredit-kesempatan"');
    expect(employerGuide).toContain("Terima satu pekerja");
    expect(employerGuide).toContain("Kredit bukan uang");
    expect(employerGuide).toContain(
      "pembayaran dilakukan langsung di luar platform",
    );

    expect(categories).toContain("getPublicJobReferenceData");
    expect(categories).toContain('pathname: "/jobs"');
    expect(categories).toContain("query: { category: category.id }");
    expect(categories).toContain("query: { location: area.id }");
    expect(categories).not.toContain("jumlah pekerjaan");
    expect(categoriesLoading).toContain('aria-busy="true"');
    expect(categoriesError).toContain("onClick={reset}");
    expect(categoriesError).toContain("Buka daftar pekerjaan");

    expect(whyRintara).toContain("Upah ditetapkan pada pekerjaan");
    expect(whyRintara).toContain(
      "Alamat lengkap tidak masuk ke informasi publik",
    );
    expect(whyRintara).toContain("Satu pekerjaan menerima tepat satu pekerja");
    expect(whyRintara).toContain("Pembayaran tetap dilakukan di luar Rintara");
  });

  test("condenses public navigation progressively with one frame-throttled listener", async () => {
    const shell = await Bun.file("components/rintara/public-shell.tsx").text();
    const header = await Bun.file(
      "components/rintara/public-header.tsx",
    ).text();

    expect(shell).not.toContain("data-public-header-sentinel");
    expect(header).not.toContain("IntersectionObserver");
    expect(header).toContain("data-condensed");
    expect(header).toContain("CONDENSE_DISTANCE = 220");
    expect(header).toContain("EXPANDED_MAX_WIDTH = 80 * 16");
    expect(header).toContain("CONDENSED_MAX_WIDTH = 64 * 16");
    expect(header).toContain("window.scrollY / CONDENSE_DISTANCE");
    expect(header).toContain("smoothStep(rawProgress)");
    expect(header).toContain("surface.style.backgroundColor");
    expect(header).toContain("interpolate(68, 88, progress)");
    expect(header).toContain("interpolate(34, 70, progress)");
    expect(header).toContain("interpolate(12, 24, progress)");
    expect(header).toContain("surface.style.backdropFilter = backdropFilter");
    expect(header).toContain(
      'surface.style.setProperty("-webkit-backdrop-filter", backdropFilter)',
    );
    expect(header).toContain("window.requestAnimationFrame(updateHeader)");
    expect(header).toContain(
      'window.addEventListener("scroll", scheduleUpdate, { passive: true })',
    );
    expect(header).toContain("window.cancelAnimationFrame(animationFrame)");
    expect(header).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    expect(header).not.toContain("scale-[0.92]");
  });

  test("keeps the documented registration stages and profile fields visible", async () => {
    const shell = await Bun.file(
      "features/auth/components/auth-shell.tsx",
    ).text();
    const workerPage = await Bun.file("app/onboarding/worker/page.tsx").text();
    const employerPage = await Bun.file(
      "app/onboarding/employer/page.tsx",
    ).text();
    const roleSelection = await Bun.file(
      "features/onboarding/components/role-selection.tsx",
    ).text();
    const worker = await Bun.file(
      "features/onboarding/components/worker-onboarding-form.tsx",
    ).text();
    const employer = await Bun.file(
      "features/onboarding/components/employer-onboarding-form.tsx",
    ).text();

    expect(shell).toContain('["Akun", "Peran", "Profil"]');
    expect(shell).not.toContain("JourneyStory");
    expect(roleSelection).toContain("useState<Role | null>(null)");
    expect(roleSelection).toContain("{role ? (");
    expect(roleSelection).toContain('type="button" className="h-12" disabled');
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

  test("completes the acceptance and two-party Mini Agreement interface", async () => {
    const agreementView = await Bun.file(
      "components/rintara/agreement-confirmation-view.tsx",
    ).text();
    const confirmationButton = await Bun.file(
      "components/rintara/confirm-agreement-button.tsx",
    ).text();
    const acceptanceButton = await Bun.file(
      "components/rintara/accept-application-button.tsx",
    ).text();
    const agreementAction = await Bun.file(
      "server/domain/agreements/actions.ts",
    ).text();
    const acceptanceAction = await Bun.file(
      "server/domain/applications/actions.ts",
    ).text();
    const employerDashboard = await Bun.file(
      "app/employer/dashboard/page.tsx",
    ).text();
    const employerJobQuery = await Bun.file(
      "server/queries/jobs/get-employer-job.ts",
    ).text();

    for (const path of [
      "app/worker/agreements/[id]/page.tsx",
      "app/employer/agreements/[id]/page.tsx",
    ]) {
      const page = await Bun.file(path).text();
      expect(page, path).toContain('export const dynamic = "force-dynamic"');
      expect(page, path).toContain("getAgreement(id)");
      expect(page, path).toContain("<AgreementConfirmationView");
    }

    expect(acceptanceButton).toContain("acceptApplication(applicationId)");
    expect(acceptanceButton).toContain("lamaran lain yang masih menunggu");
    expect(acceptanceButton).toContain("snapshot Mini Agreement");
    expect(acceptanceButton).toContain(
      "router.push(`/employer/agreements/${result.agreementId}`)",
    );

    for (const snapshotField of [
      "taskScope",
      "generalArea",
      "fullAddress",
      "arrivalInstructions",
      "startsAt",
      "estimatedMinutes",
      "wageAmount",
      "wageStatus",
      "paymentMethod",
      "paymentTiming",
      "toolsProvided",
      "toolsRequired",
      "cancellationWording",
      "isFirstOpportunity",
    ]) {
      expect(agreementView, snapshotField).toContain(
        `agreement.snapshot.${snapshotField}`,
      );
    }
    expect(agreementView).toContain("workerConfirmedAt");
    expect(agreementView).toContain("employerConfirmedAt");
    expect(agreementView).toContain("Kesepakatan aktif");
    expect(agreementView).toContain("Pekerjaan selesai");
    expect(agreementView).toContain("Kesepakatan dibatalkan");
    expect(agreementView).toContain("agreement.cancellation.reason");
    expect(agreementView).not.toContain("<input");
    expect(agreementView).not.toContain("<textarea");

    expect(confirmationButton).toContain("confirmAgreement(agreementId)");
    expect(confirmationButton).toContain("submissionLockRef.current");
    expect(confirmationButton).toContain("aria-busy={isPending}");
    expect(confirmationButton).toContain(
      'errorCodeFor(caughtError) === "INVALID_STATE_TRANSITION"',
    );
    expect(confirmationButton).toContain("if (!isPending) setOpen(nextOpen)");
    expect(confirmationButton).toContain(
      "Setelah kedua pihak setuju, langkah kerja akan aktif.",
    );

    expect(agreementAction).toContain(
      'revalidatePath("/worker/notifications")',
    );
    expect(agreementAction).toContain(
      'revalidatePath("/employer/notifications")',
    );
    expect(agreementAction).toContain(
      "revalidatePath(`/worker/work/${outcome.result.agreementId}`)",
    );
    expect(acceptanceAction).toContain(
      'revalidatePath("/worker/dashboard")',
    );
    expect(acceptanceAction).toContain(
      'revalidatePath("/worker/notifications")',
    );

    expect(employerJobQuery).toContain(
      ".leftJoin(agreements, eq(agreements.jobId, jobs.id))",
    );
    expect(employerDashboard).toContain(
      "`/employer/agreements/${job.agreementId}`",
    );
    expect(employerDashboard).toContain("Buka kesepakatan");
  });

  test("wires the worker profile screen to private data and validated updates", async () => {
    const page = await Bun.file("app/worker/profile/page.tsx").text();
    const form = await Bun.file(
      "features/onboarding/components/worker-onboarding-form.tsx",
    ).text();

    expect(page).toContain("getMyProfile");
    expect(page).toContain("getOnboardingReferenceData");
    expect(page).toContain("<WorkerProfileForm");
    expect(page).toContain("profile.displayName");
    expect(page).toContain("profile.areaName");
    expect(page).not.toContain("Ayu Pratama");
    expect(page).not.toContain("Bandung");
    expect(page).not.toContain('type="tel"');
    expect(page).not.toContain('type="button"');

    expect(form).toContain("updateWorkerProfile");
    expect(form).toContain("initialProfile");
    expect(form).toContain("submittingRef.current");
    expect(form).toContain("aria-busy={isPending}");
    expect(form).toContain("Profil belum tersimpan");
    expect(form).toContain("Profil diperbarui");
    expect(form).toContain("fieldErrors");
    expect(form).toMatch(/<fieldset[^>]*>\s*<legend/);
    expect(form).toContain("verifiedCategoryIds");
    expect(form).toContain("Belum ada Bukti Kerja terverifikasi");
    expect(form).not.toContain(".reset()");
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
      expect(source, path).not.toContain(".reset()");
      if (!path.includes("worker-onboarding-form")) {
        expect(source, path).not.toContain("router.refresh()");
      }
    }

    for (const path of [
      "components/rintara/accept-application-button.tsx",
      "components/rintara/cancel-job-button.tsx",
      "components/rintara/confirm-agreement-button.tsx",
      "components/rintara/withdraw-application-button.tsx",
      "components/rintara/report-problem.tsx",
      "components/rintara/work-actions.tsx",
      "components/rintara/admin-report-actions.tsx",
      "components/rintara/redeem-credit-form.tsx",
    ]) {
      const source = await Bun.file(path).text();
      expect(source, path).toContain("submissionLockRef");
      expect(source, path).toContain("submissionLockRef.current");
      expect(source, path).toContain("useRef(false)");
    }

    const workerProfileForm = await Bun.file(
      "features/onboarding/components/worker-onboarding-form.tsx",
    ).text();
    expect(workerProfileForm).toContain("if (initialProfile)");
    expect(workerProfileForm).toContain("router.refresh()");
    expect(workerProfileForm).toContain(
      'router.replace(nextPath ?? "/worker/dashboard")',
    );

    const dashboardShell = await Bun.file(
      "features/dashboard/components/dashboard-shell.tsx",
    ).text();
    expect(dashboardShell).toContain("signingOutRef");
    expect(dashboardShell).toContain("if (signingOutRef.current) return");
    expect(dashboardShell).toContain("Koneksi terputus saat keluar");
    expect(dashboardShell).not.toContain("router.refresh()");

    const jobForm = await Bun.file(
      "features/employer/components/job-form.tsx",
    ).text();
    expect(jobForm).toContain("const persistedJobIdRef = useRef(jobId)");
    expect(jobForm).toContain("let currentJobId = persistedJobIdRef.current");
    expect(jobForm).toMatch(
      /const res = await createJobDraft\(payload\);\s*currentJobId = res\.jobId;\s*persistedJobIdRef\.current = currentJobId;\s*}\s*await publishJob\(currentJobId!\);/,
    );
  });

  test("keeps admin list controls truthful and report selection addressable", async () => {
    const reports = await Bun.file("app/admin/reports/page.tsx").text();
    const adminDashboard = await Bun.file("app/admin/page.tsx").text();
    expect(reports).toContain(
      "searchParams: Promise<{ report?: string | string[] }>",
    );
    expect(reports).toContain(
      "reports.find((report) => report.id === selectedReportId)",
    );
    expect(reports).toContain(
      "href={`/admin/reports?report=${encodeURIComponent(report.id)}`}",
    );
    expect(reports).toContain("key={`${selected.id}:${selected.status}`}");
    expect(adminDashboard).toContain(
      "href={`/admin/reports?report=${encodeURIComponent(report.id)}`}",
    );

    const unsupportedControls = [
      ["app/admin/jobs/page.tsx", "Filter status"],
      ["app/admin/jobs/page.tsx", "Tinjau"],
      ["app/admin/users/page.tsx", "Cari pengguna"],
      ["app/admin/users/page.tsx", "Tinjau akun"],
      ["app/admin/audit-logs/page.tsx", "Filter waktu"],
      ["app/admin/audit-logs/page.tsx", "Cari audit log"],
    ] as const;

    for (const [path, label] of unsupportedControls) {
      const source = await Bun.file(path).text();
      expect(
        source,
        `${path} exposes unsupported control "${label}"`,
      ).not.toContain(label);
    }

    for (const [path, emptyCopy] of [
      ["app/admin/jobs/page.tsx", "Belum ada pekerjaan untuk ditinjau."],
      ["app/admin/users/page.tsx", "Belum ada akun untuk ditampilkan."],
      ["app/admin/audit-logs/page.tsx", "Belum ada jejak operasi."],
    ] as const) {
      expect(await Bun.file(path).text(), path).toContain(emptyCopy);
    }
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
    const jobFilters = await Bun.file(
      "components/rintara/job-filters.tsx",
    ).text();
    const withdrawButton = await Bun.file(
      "components/rintara/withdraw-application-button.tsx",
    ).text();
    const marketplaceForms = await Bun.file(
      "features/admin/components/marketplace-config-forms.tsx",
    ).text();
    const wageGuidelines = await Bun.file(
      "app/admin/wage-guidelines/page.tsx",
    ).text();
    expect(jobFilters).toContain("inline-flex min-h-11");
    expect(withdrawButton).toContain('className="h-11"');
    expect(marketplaceForms).toContain('className="min-h-11"');
    expect(wageGuidelines.match(/className="min-h-11"/g)?.length).toBe(3);
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
