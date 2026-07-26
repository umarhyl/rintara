import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { getJobReferenceData } from "@/server/queries/jobs/reference-data";
import { JobForm } from "@/features/employer/components/job-form";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  await requireDashboardPageRole("employer", "/employer/jobs/new");

  const referenceData = await getJobReferenceData();

  return (
    <div className="mx-auto grid max-w-[70rem] gap-7">
      <PageHeader
        title="Buat pekerjaan baru"
        description="Isi ketentuan yang akan dilihat pekerja. Alamat lengkap hanya dibuka kepada pekerja yang diterima."
      />
      <JobForm referenceData={referenceData} />
    </div>
  );
}
