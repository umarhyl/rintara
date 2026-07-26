import { describe, expect, test } from "bun:test";

import { resolveDashboardActiveHref } from "@/features/dashboard/navigation";

const workerRoutes = [
  "/worker/dashboard",
  "/jobs",
  "/worker/applications",
  "/worker/passport",
] as const;

const employerRoutes = [
  "/employer/dashboard",
  "/employer/jobs/new",
  "/employer/jobs",
  "/employer/opportunity-credits",
] as const;

const adminRoutes = [
  "/admin",
  "/admin/reports",
  "/admin/jobs",
  "/admin/users",
  "/admin/wage-guidelines",
  "/admin/audit-logs",
] as const;

describe("dashboard active navigation", () => {
  test("selects one exact or longest parent destination", () => {
    const cases = [
      ["employer", "/employer/jobs/new", employerRoutes, "/employer/jobs/new"],
      ["employer", "/employer/jobs/job-1", employerRoutes, "/employer/jobs"],
      [
        "employer",
        "/employer/jobs/job-1/applicants",
        employerRoutes,
        "/employer/jobs",
      ],
      [
        "employer",
        "/employer/agreements/agreement-1",
        employerRoutes,
        "/employer/jobs",
      ],
      [
        "employer",
        "/employer/work/session-1",
        employerRoutes,
        "/employer/jobs",
      ],
      [
        "worker",
        "/worker/agreements/agreement-1",
        workerRoutes,
        "/worker/applications",
      ],
      [
        "worker",
        "/worker/work/session-1",
        workerRoutes,
        "/worker/applications",
      ],
      ["admin", "/admin", adminRoutes, "/admin"],
      ["admin", "/admin/reports/report-1", adminRoutes, "/admin/reports"],
    ] as const;

    for (const [role, pathname, routes, expected] of cases) {
      expect(resolveDashboardActiveHref(role, pathname, routes)).toBe(
        expected,
      );
    }
  });

  test("normalizes trailing slashes and rejects another role's route", () => {
    expect(
      resolveDashboardActiveHref(
        "employer",
        "/employer/jobs/new/",
        employerRoutes,
      ),
    ).toBe("/employer/jobs/new");
    expect(
      resolveDashboardActiveHref(
        "employer",
        "/worker/applications",
        employerRoutes,
      ),
    ).toBeUndefined();
  });
});
