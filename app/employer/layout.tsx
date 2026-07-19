import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export const dynamic = "force-dynamic";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const account = await requireDashboardPageRole("employer", "/employer/dashboard");

  return <DashboardShell role="employer" displayName={account.displayName}>{children}</DashboardShell>;
}
