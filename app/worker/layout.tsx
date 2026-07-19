import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export const dynamic = "force-dynamic";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const account = await requireDashboardPageRole("worker", "/worker/dashboard");

  return <DashboardShell role="worker" displayName={account.displayName}>{children}</DashboardShell>;
}
