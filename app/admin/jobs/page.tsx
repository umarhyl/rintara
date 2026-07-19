import { ArrowUpRight, BriefcaseBusiness, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/rintara/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const jobs = [
  { title: "Kru Acara Akhir Pekan", owner: "Sinar Event Studio", status: "published", label: "Terbit" },
  { title: "Bantuan Bersih Ruang Pertemuan", owner: "Ruang Bersama", status: "in_progress", label: "Berjalan" },
  { title: "Input Data Inventaris", owner: "Toko Rintis Bersama", status: "filled", label: "Terisi" },
];

function jobTone(status: string) {
  return status === "published" ? "success" : "info";
}

export default async function AdminJobsPage() {
  await requireDashboardPageRole("admin", "/admin/jobs");

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Moderasi konten"
        title="Pekerjaan"
        description="Pantau status terbit dan visibilitas moderasi. Alamat lengkap tidak pernah ditampilkan pada daftar ini."
      />

      <section aria-label="Pencarian dan filter pekerjaan" className="grid gap-4 border-y border-border/70 py-5 lg:grid-cols-[minmax(18rem,1fr)_auto_auto] lg:items-center">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Cari pekerjaan" placeholder="Cari judul atau pemberi kerja" className="h-12 rounded-full bg-card/75 pl-11" />
        </div>
        <Button variant="outline" type="button" className="rounded-full">
          <SlidersHorizontal aria-hidden="true" />
          Filter status
        </Button>
        <p className="text-sm text-muted-foreground lg:pl-2">
          <span className="font-semibold text-foreground">3</span> dari 18 pekerjaan
        </p>
      </section>

      <section aria-labelledby="jobs-list-title" className="overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/72 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Daftar aktif</p>
            <h2 id="jobs-list-title" className="mt-1 text-lg font-semibold">Pekerjaan terbaru</h2>
          </div>
          <BriefcaseBusiness className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>

        <div className="divide-y divide-border/70 md:hidden">
          {jobs.map((job, index) => (
            <article key={job.title} className="grid gap-5 px-5 py-5">
              <div className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="grid size-9 place-items-center rounded-full border border-border font-mono text-xs text-muted-foreground" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-6">{job.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{job.owner}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 pl-[3.25rem]">
                <StatusBadge status={jobTone(job.status)}>
                  {job.status} · {job.label}
                </StatusBadge>
                <Button variant="ghost" type="button" className="h-11">
                  Tinjau
                  <ArrowUpRight aria-hidden="true" />
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/35">
                <TableHead className="pl-6">Pekerjaan</TableHead>
                <TableHead>Pemberi kerja</TableHead>
                <TableHead>Status internal</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.title} className="h-18">
                  <TableCell className="pl-6 font-medium">{job.title}</TableCell>
                  <TableCell className="text-muted-foreground">{job.owner}</TableCell>
                  <TableCell>
                    <StatusBadge status={jobTone(job.status)}>
                      {job.status} · {job.label}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button variant="ghost" type="button" className="h-11">
                      Tinjau
                      <ArrowUpRight aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <p className="flex items-start gap-3 text-base leading-7 text-muted-foreground">
        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        Daftar ini hanya memuat informasi yang diperlukan untuk moderasi. Detail privat dibuka melalui konteks yang berwenang.
      </p>
    </div>
  );
}
