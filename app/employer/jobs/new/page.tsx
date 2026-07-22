import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { getJobReferenceData } from "@/server/queries/jobs/reference-data";
import { JobForm } from "@/features/employer/components/job-form";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  await requireDashboardPageRole("employer", "/employer/jobs/new");

  const referenceData = await getJobReferenceData();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Buat Pekerjaan Baru"
        description="Pekerjaan akan ditinjau terlebih dahulu. Informasi alamat lengkap dirahasiakan sampai pelamar diterima."
      />
      <JobForm referenceData={referenceData} />
    </div>
  );
}
