import { describe, expect, test } from "bun:test";

const employerPages = [
  "app/employer/dashboard/page.tsx",
  "app/employer/jobs/new/page.tsx",
  "app/employer/jobs/[id]/page.tsx",
  "app/employer/jobs/[id]/applicants/page.tsx",
  "app/employer/agreements/[id]/page.tsx",
  "app/employer/work/[id]/page.tsx",
  "app/employer/opportunity-credits/page.tsx",
  "app/employer/notifications/page.tsx",
] as const;

describe("employer page access", () => {
  for (const page of employerPages) {
    test(`${page} guards its own render`, async () => {
      const source = await Bun.file(page).text();
      const pageExportIndex = source.indexOf("export default async function");

      expect(source).toContain(
        'import { requireDashboardPageRole } from "@/server/auth/page-access";',
      );
      expect(pageExportIndex).toBeGreaterThan(-1);

      const pageSource = source.slice(pageExportIndex);
      const guardIndex = pageSource.indexOf(
        'await requireDashboardPageRole(',
      );
      const renderIndex = pageSource.indexOf("return (");

      expect(guardIndex).toBeGreaterThan(-1);
      expect(pageSource.slice(guardIndex, renderIndex)).toContain('"employer"');
      expect(renderIndex).toBeGreaterThan(guardIndex);
    });
  }
});
