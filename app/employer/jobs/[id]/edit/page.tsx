import { notFound } from "next/navigation";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { requireActiveUser } from "@/server/auth/identity";
import { getJobReferenceData } from "@/server/queries/jobs/reference-data";
import { getEmployerJob } from "@/server/queries/jobs/get-employer-job";
import { JobForm } from "@/features/employer/components/job-form";

export default async function EditJobPage({
  params,
}: {
  params: { id: string };
}) {
  await requireDashboardPageRole("employer", `/employer/jobs/${params.id}/edit`);
  const context = await requireActiveUser();
  
  let jobData;
  try {
    jobData = await getEmployerJob(params.id, context.userId);
  } catch {
    return notFound();
  }

  if (jobData.status !== "draft") {
    // Only draft jobs can be edited via the form
    return notFound();
  }

  const referenceData = await getJobReferenceData();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Edit Draft Pekerjaan"
        description="Perbarui informasi pekerjaan Anda."
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
        jobId={params.id} 
      />
    </div>
  );
}
