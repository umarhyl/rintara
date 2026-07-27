import { MyReportsView } from "@/components/rintara/my-reports-view";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { listMyReports } from "@/server/queries/reports/my-reports";

export default async function EmployerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  await requireDashboardPageRole("employer", "/employer/reports");
  const { cursor } = await searchParams;
  const reportPage = await listMyReports({
    cursor: typeof cursor === "string" ? cursor : undefined,
  });

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Laporan saya"
        description="Pantau status laporan tanpa membuka catatan internal moderator."
      />
      <MyReportsView reportPage={reportPage} nextBasePath="/employer/reports" />
    </div>
  );
}
