import { notFound } from "next/navigation";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { getJobReferenceData } from "@/server/queries/jobs/reference-data";
import { getEmployerJob } from "@/server/queries/jobs/get-employer-job";
import { JobForm } from "@/features/employer/components/job-form";

export const dynamic = "force-dynamic";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboardPageRole(
    "employer",
    `/employer/jobs/${encodeURIComponent(id)}/edit`,
  );
  let jobData;
  try {
    jobData = await getEmployerJob(id);
  } catch {
    return notFound();
  }

  if (jobData.status !== "draft") {
    // Only draft jobs can be edited via the form
    return notFound();
  }

  const referenceData = await getJobReferenceData();

  return (
    <div className="mx-auto grid max-w-[70rem] gap-7">
      <PageHeader
        title="Edit draf pekerjaan"
        description="Perbarui ketentuan sebelum pekerjaan diterbitkan."
      />
      <JobForm
        referenceData={referenceData}
        initialData={{
          ...jobData,
          wageAmount: Number(jobData.wageAmount),
          startsAt: jobData.startsAt?.toISOString() || "",
          applicationDeadline: jobData.applicationDeadline?.toISOString() || "",
          toolsProvided: jobData.toolsProvided || undefined,
          toolsRequired: jobData.toolsRequired || undefined,
        }}
        jobId={id}
      />
    </div>
  );
}
