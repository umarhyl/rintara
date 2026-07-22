import {
  RefreshCcw,
} from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApplicationError } from "@/server/errors/application-error";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { getEmployerJob } from "@/server/queries/jobs/get-employer-job";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await requireDashboardPageRole(
    "employer",
    `/employer/jobs/${encodeURIComponent(id)}/applicants`,
  );
  let job;

  try {
    job = await getEmployerJob(id, account.userId);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "JOB_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow={job.title}
        title="Pelamar pekerjaan"
        description="Data contoh sudah disembunyikan. Daftar pelamar nyata akan muncul setelah query lamaran pekerjaan tersambung ke backend."
        action={
          <div className="text-left sm:text-right">
            <p className="text-3xl font-semibold tracking-[-0.04em]">00</p>
            <p className="text-sm text-muted-foreground">pelamar aktif</p>
          </div>
        }
      />

      <EmptyState
        title="Belum ada pelamar dari backend"
        description="Halaman ini sudah membaca pekerjaan milik employer dari database. Daftar pelamar akan ditampilkan setelah query aplikasi tersedia."
        actionLabel="Lihat pekerjaan"
        actionHref={`/employer/jobs/${job.id}`}
      />

      <Alert className="border-primary/20 bg-primary/5">
        <RefreshCcw className="text-primary" aria-hidden="true" />
        <AlertTitle>Status dapat berubah saat ditinjau</AlertTitle>
        <AlertDescription>
          Jika pekerja lain telah lebih dulu diterima, muat ulang halaman untuk
          melihat hasil terbaru. Tidak ada penerimaan sebagian yang disimpan.
        </AlertDescription>
      </Alert>
    </div>
  );
}
