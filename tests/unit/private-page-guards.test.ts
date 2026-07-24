import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const staticGuardedPages = [
  ["app/worker/dashboard/page.tsx", "worker", "/worker/dashboard"],
  ["app/worker/profile/page.tsx", "worker", "/worker/profile"],
  ["app/worker/applications/page.tsx", "worker", "/worker/applications"],
  ["app/worker/passport/page.tsx", "worker", "/worker/passport"],
  ["app/worker/notifications/page.tsx", "worker", "/worker/notifications"],
  ["app/employer/jobs/page.tsx", "employer", "/employer/jobs"],
  [
    "app/employer/settings/profile/page.tsx",
    "employer",
    "/employer/settings/profile",
  ],
  ["app/admin/page.tsx", "admin", "/admin"],
  ["app/admin/reports/page.tsx", "admin", "/admin/reports"],
  ["app/admin/jobs/page.tsx", "admin", "/admin/jobs"],
  ["app/admin/users/page.tsx", "admin", "/admin/users"],
  ["app/admin/wage-guidelines/page.tsx", "admin", "/admin/wage-guidelines"],
  ["app/admin/audit-logs/page.tsx", "admin", "/admin/audit-logs"],
] as const;

const demoRecordGuardedPages = [
  [
    "app/worker/agreements/[id]/page.tsx",
    "worker",
    "/worker/agreements/${encodeURIComponent(id)}",
    "kesepakatan-kru-acara",
  ],
  [
    "app/worker/work/[id]/page.tsx",
    "worker",
    "/worker/work/${encodeURIComponent(id)}",
    "sesi-pekerjaan",
  ],
  [
    "app/employer/agreements/[id]/page.tsx",
    "employer",
    "/employer/agreements/${encodeURIComponent(id)}",
    "kesepakatan-kru-acara",
  ],
  [
    "app/employer/work/[id]/page.tsx",
    "employer",
    "/employer/work/${encodeURIComponent(id)}",
    "sesi-pekerjaan",
  ],
] as const;

const backendRecordGuardedPages = [
  [
    "app/employer/jobs/[id]/page.tsx",
    "employer",
    "/employer/jobs/${encodeURIComponent(id)}",
    "loadEmployerJob(id)",
    "JOB_NOT_FOUND",
  ],
  [
    "app/employer/jobs/[id]/applicants/page.tsx",
    "employer",
    "/employer/jobs/${encodeURIComponent(id)}/applicants",
    "getEmployerJob(id)",
    "JOB_NOT_FOUND",
  ],
  [
    "app/employer/jobs/[id]/applicants/[applicationId]/passport/page.tsx",
    "employer",
    "${returnPath}/${encodeURIComponent(applicationId)}/passport",
    "getApplicantPassport(id, applicationId, {",
    "NOT_FOUND",
  ],
] as const;

describe("private page authorization boundaries", () => {
  test("proxy rejects anonymous protected routes before React rendering", () => {
    const source = readFileSync("lib/supabase/proxy.ts", "utf8");
    const matcher = readFileSync("proxy.ts", "utf8");

    for (const prefix of [
      '"/worker"',
      '"/employer"',
      '"/admin"',
      '"/onboarding"',
      '"/account/continue"',
    ]) {
      expect(source).toContain(prefix);
    }

    expect(source).toContain("await supabase.auth.getClaims()");
    expect(source).toContain("NextResponse.redirect(signInUrl)");
    expect(source).toContain('signInUrl.searchParams.set("next", nextPath)');
    expect(matcher).toContain('"/worker/:path*"');
    expect(matcher).toContain('"/auth/status"');
    expect(matcher).not.toContain("((?!");
  });

  test("public auth presentation state accepts only a proxy-verified header", () => {
    const proxySource = readFileSync("lib/supabase/proxy.ts", "utf8");
    const statusRoute = readFileSync("app/auth/status/route.ts", "utf8");
    const deleteIndex = proxySource.indexOf(
      "requestHeaders.delete(verifiedSessionHeader)",
    );
    const claimsIndex = proxySource.indexOf("await supabase.auth.getClaims()");
    const verifiedSetIndex = proxySource.indexOf(
      "requestHeaders.set(\n    verifiedSessionHeader",
    );

    expect(deleteIndex).toBeGreaterThan(-1);
    expect(claimsIndex).toBeGreaterThan(deleteIndex);
    expect(verifiedSetIndex).toBeGreaterThan(claimsIndex);
    expect(proxySource).toContain(
      "request.nextUrl.pathname !== publicAuthStatusPath",
    );
    expect(statusRoute).toContain(
      'request.headers.get("x-rintara-verified-session") === "authenticated"',
    );
    expect(statusRoute).not.toContain("createServerClient");
    expect(statusRoute).not.toContain("getClaims()");
    expect(statusRoute).toContain('Vary: "Cookie"');
  });

  test("onboarding has its own authenticated incomplete-profile guard", () => {
    const source = readFileSync("app/onboarding/layout.tsx", "utf8");

    expect(source).toContain(
      'import { requireOnboardingPage } from "@/server/auth/page-access";',
    );
    expect(source).toContain("await requireOnboardingPage();");
  });

  test.each(staticGuardedPages)(
    "%s awaits its role guard before rendering",
    (path, role, nextPath) => {
      const source = readFileSync(path, "utf8");
      const pageExportIndex = source.indexOf("export default async function");
      const pageSource = source.slice(pageExportIndex);
      const guardIndex = pageSource.indexOf("await requireDashboardPageRole");
      const renderIndex = pageSource.indexOf("return (");

      expect(source).toContain(
        'import { requireDashboardPageRole } from "@/server/auth/page-access";',
      );
      expect(pageExportIndex).toBeGreaterThan(-1);
      expect(guardIndex).toBeGreaterThan(-1);
      expect(pageSource.slice(guardIndex, renderIndex)).toContain(`"${role}"`);
      expect(pageSource.slice(guardIndex, renderIndex)).toContain(`"${nextPath}"`);
      expect(renderIndex).toBeGreaterThan(guardIndex);
    },
  );

  test.each(demoRecordGuardedPages)(
    "%s guards the requested resource path before resolving its demo record",
    (path, role, routeExpression, knownId) => {
      const source = readFileSync(path, "utf8");
      const guardIndex = source.indexOf("await requireDashboardPageRole");
      const notFoundIndex = source.indexOf("notFound();");
      const renderIndex = source.indexOf("return (", notFoundIndex);

      expect(source).toContain(
        'import { requireDashboardPageRole } from "@/server/auth/page-access";',
      );
      expect(source).toMatch(
        new RegExp(`requireDashboardPageRole\\(\\s*"${role}"`),
      );
      expect(source).toContain(routeExpression);
      expect(source).toContain(`if (id !== "${knownId}") notFound();`);
      expect(guardIndex).toBeGreaterThan(-1);
      expect(notFoundIndex).toBeGreaterThan(guardIndex);
      expect(renderIndex).toBeGreaterThan(notFoundIndex);
    },
  );

  test.each(backendRecordGuardedPages)(
    "%s guards the requested resource path before resolving its backend record",
    (path, role, routeExpression, resourceLookup, notFoundCode) => {
      const source = readFileSync(path, "utf8");
      const guardIndex = source.indexOf("await requireDashboardPageRole");
      const lookupIndex = source.indexOf(resourceLookup);
      const notFoundIndex = source.indexOf("notFound();");
      const renderIndex = source.indexOf("return (", lookupIndex);

      expect(source).toContain(
        'import { requireDashboardPageRole } from "@/server/auth/page-access";',
      );
      expect(source).toMatch(
        new RegExp(`requireDashboardPageRole\\(\\s*"${role}"`),
      );
      expect(source).toContain(routeExpression);
      expect(source).toContain(resourceLookup);
      expect(source).toContain(`error.code === "${notFoundCode}"`);
      expect(guardIndex).toBeGreaterThan(-1);
      expect(lookupIndex).toBeGreaterThan(guardIndex);
      expect(notFoundIndex).toBeGreaterThan(-1);
      expect(renderIndex).toBeGreaterThan(lookupIndex);
    },
  );
});
