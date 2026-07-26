export type DashboardNavigationRole = "worker" | "employer" | "admin";

function normalizeDashboardPath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function resolveDashboardActiveHref(
  role: DashboardNavigationRole,
  pathname: string,
  itemHrefs: readonly string[],
) {
  const normalizedPath = normalizeDashboardPath(pathname);
  const exact = itemHrefs.find((href) => href === normalizedPath);

  if (exact) return exact;

  const workflowParent =
    role === "worker" &&
    (normalizedPath.startsWith("/worker/agreements/") ||
      normalizedPath.startsWith("/worker/work/"))
      ? "/worker/applications"
      : role === "employer" &&
          (normalizedPath.startsWith("/employer/agreements/") ||
            normalizedPath.startsWith("/employer/work/"))
        ? "/employer/jobs"
        : undefined;

  if (workflowParent && itemHrefs.includes(workflowParent)) {
    return workflowParent;
  }

  return itemHrefs
    .filter(
      (href) =>
        href !== "/admin" && normalizedPath.startsWith(`${href}/`),
    )
    .sort((left, right) => right.length - left.length)[0];
}
