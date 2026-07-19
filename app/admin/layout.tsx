import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await requireDashboardPageRole("admin", "/admin");

  return <DashboardShell role="admin" displayName={account.displayName}>{children}</DashboardShell>;
}
