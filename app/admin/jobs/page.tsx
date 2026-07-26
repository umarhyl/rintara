import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { adminListJobs } from "@/server/queries/admin/moderation";

function jobTone(status: string, visibility: string) {
  if (visibility === "hidden") return "warning";
  return status === "published" ? "success" : "info";
}

const jobStatusLabels: Record<string, string> = {
  draft: "Draf",
  published: "Terbit",
  filled: "Terisi",
  in_progress: "Sedang berjalan",
  completed: "Selesai",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
};

const visibilityLabels: Record<string, string> = {
  visible: "Terlihat",
  hidden: "Disembunyikan",
};

function jobStateLabel(status: string, visibility: string) {
  return `${jobStatusLabels[status] ?? "Status lain"} · ${
    visibilityLabels[visibility] ?? "Visibilitas lain"
  }`;
}

export default async function AdminJobsPage() {
  await requireDashboardPageRole("admin", "/admin/jobs");
  const jobs = await adminListJobs();

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Pekerjaan"
        description="Pantau status terbit dan visibilitas. Alamat lengkap tidak ditampilkan."
      />

      <section aria-label="Ringkasan daftar pekerjaan" className="border-y border-border/70 py-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{jobs.length}</span> pekerjaan
        </p>
      </section>

      <section aria-labelledby="jobs-list-title" className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
          <h2 id="jobs-list-title" className="text-lg font-semibold">
            Daftar pekerjaan
          </h2>
        </div>

        <div className="divide-y divide-border/70 md:hidden">
          {jobs.map((job, index) => (
            <article key={job.id} className="grid gap-5 px-5 py-5">
              <div className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="grid size-9 place-items-center rounded-xl border border-border font-mono text-xs text-muted-foreground" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-6">{job.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{job.employerDisplayName}</p>
                </div>
              </div>
              <div className="pl-[3.25rem]">
                <StatusBadge status={jobTone(job.status, job.visibility)}>
                  {jobStateLabel(job.status, job.visibility)}
                </StatusBadge>
              </div>
            </article>
          ))}
          {jobs.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              Belum ada pekerjaan untuk ditinjau.
            </p>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/35">
                <TableHead className="pl-6">Pekerjaan</TableHead>
                <TableHead>Pemberi kerja</TableHead>
                <TableHead>Status internal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id} className="h-18">
                  <TableCell className="pl-6 font-medium">{job.title}</TableCell>
                  <TableCell className="text-muted-foreground">{job.employerDisplayName}</TableCell>
                  <TableCell>
                    <StatusBadge status={jobTone(job.status, job.visibility)}>
                      {jobStateLabel(job.status, job.visibility)}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Belum ada pekerjaan untuk ditinjau.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
