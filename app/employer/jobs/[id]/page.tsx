import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  MapPin,
  Pencil,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { CancelJobButton } from "@/components/rintara/cancel-job-button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { ApplicationError } from "@/server/errors/application-error";
import {
  getEmployerJobDetail,
  type EmployerJobDetail,
} from "@/server/queries/jobs/get-employer-job";

function formatWage(amount: number, unit: EmployerJobDetail["wageUnit"]) {
  const unitLabel = unit === "hour" ? "jam" : unit === "day" ? "hari" : "pekerjaan";
  return `${new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)} / ${unitLabel}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} jam ${remainingMinutes} menit`
    : `${hours} jam`;
}

function statusLabel(status: EmployerJobDetail["status"]) {
  if (status === "draft") return "Draft";
  if (status === "published") return "Menerima lamaran";
  if (status === "filled") return "Terisi";
  if (status === "in_progress") return "Berjalan";
  if (status === "completed") return "Selesai";
  if (status === "expired") return "Kedaluwarsa";
  return "Dibatalkan";
}

function statusTone(status: EmployerJobDetail["status"]) {
  if (status === "published") return "success";
  if (status === "draft") return "neutral";
  if (status === "cancelled" || status === "expired") return "warning";
  return "info";
}

function taskItems(taskScope: string) {
  return taskScope
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadEmployerJob(jobId: string) {
  try {
    return await getEmployerJobDetail(jobId);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "JOB_NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export default async function EmployerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboardPageRole(
    "employer",
    `/employer/jobs/${encodeURIComponent(id)}`,
  );
  const job = await loadEmployerJob(id);
  const tasks = taskItems(job.taskScope);
  const canCancel = job.status === "draft" || job.status === "published";

  const facts = [
    {
      label: "Pelamar aktif",
      value: `${job.submittedApplicationCount} orang`,
      detail: job.isFirstOpportunity
        ? "Kelayakan kategori dihitung server"
        : "Lamaran tanpa penawaran upah",
      icon: UsersRound,
    },
    {
      label: "Batas lamaran",
      value: formatDate(job.applicationDeadline),
      detail: job.applicationDeadline > new Date() ? "Masih terbuka" : "Sudah lewat",
      icon: CalendarDays,
    },
    {
      label: "Area publik",
      value: job.publicLocationLabel,
      detail: "Alamat lengkap hanya di ruang employer",
      icon: MapPin,
    },
  ] as const;

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Manajemen pekerjaan"
        title={job.title}
        description="Kelola pekerjaan milikmu tanpa membuka alamat lengkap ke halaman publik."
        action={
          <StatusBadge tone={statusTone(job.status)}>
            {statusLabel(job.status)}
          </StatusBadge>
        }
      />

      <section
        aria-label="Ringkasan pekerjaan"
        className="grid border-y border-border/70 sm:grid-cols-3"
      >
        {facts.map((fact, index) => {
          const Icon = fact.icon;
          return (
            <div
              key={fact.label}
              className={`grid grid-cols-[auto_1fr] gap-4 py-5 sm:px-6 ${
                index > 0 ? "border-t border-border/70 sm:border-l sm:border-t-0" : ""
              } ${index === 0 ? "sm:pl-0" : ""}`}
            >
              <Icon className="mt-1 size-4 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {fact.label}
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">
                  {fact.value}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{fact.detail}</p>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <article className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/75 backdrop-blur-sm">
          <div className="grid gap-6 border-b border-border/70 px-6 py-7 sm:grid-cols-[1fr_auto] sm:items-end sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Upah tetap
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                {formatWage(job.wageAmount, job.wageUnit)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Status panduan upah: {job.wageStatus}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              Ketentuan terkunci setelah diterbitkan
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[0.78fr_1.22fr]">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Waktu & kategori
              </p>
              <dl className="mt-4 divide-y divide-border/70 border-y border-border/70">
                <div className="py-4">
                  <dt className="text-sm text-muted-foreground">Jadwal</dt>
                  <dd className="mt-1 font-medium">
                    {formatDate(job.startsAt)}
                    <span className="block text-sm font-normal text-muted-foreground">
                      Durasi {formatDuration(job.estimatedMinutes)}
                    </span>
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm text-muted-foreground">Kategori</dt>
                  <dd className="mt-1 font-medium">{job.categoryName}</dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm text-muted-foreground">Jenis kesempatan</dt>
                  <dd className="mt-1 font-medium">
                    {job.isFirstOpportunity ? "Kesempatan Pertama" : "Umum"}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm text-muted-foreground">Alamat privat</dt>
                  <dd className="mt-1 font-medium">{job.fullAddress}</dd>
                </div>
              </dl>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Ruang lingkup
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Tugas yang disepakati
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                {job.description}
              </p>
              <ol className="mt-6 border-l border-primary/25 pl-6">
                {(tasks.length > 0 ? tasks : [job.taskScope]).map((task, index) => (
                  <li key={`${task}-${index}`} className="relative pb-6 last:pb-0">
                    <span
                      className="absolute -left-[1.78rem] top-1.5 size-2.5 rounded-full border-2 border-card bg-primary"
                      aria-hidden="true"
                    />
                    <span className="mr-3 text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-7">{task}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </article>

        <aside className="rounded-[1.75rem] bg-foreground p-6 text-background shadow-[0_28px_70px_-44px_rgb(15_23_42/0.7)] lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-background/70">
            <Eye className="size-4" aria-hidden="true" />
            Tindakan utama
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
            Kelola pekerjaan
          </h2>
          <p className="mt-2 text-base leading-7 text-background/65">
            Tinjau lamaran, lihat halaman publik, atau batalkan pekerjaan yang
            belum terisi.
          </p>
          {job.status === "draft" ? (
            <Button
              className="mt-6 w-full bg-background text-foreground shadow-none hover:bg-background/90"
              asChild
            >
              <Link href={`/employer/jobs/${job.id}/edit`}>
                Edit draft <Pencil aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button
              className="mt-6 w-full bg-background text-foreground shadow-none hover:bg-background/90"
              asChild
            >
              <Link href={`/employer/jobs/${job.id}/applicants`}>
                Tinjau pelamar <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )}
          {job.status === "published" ? (
            <Button
              variant="outline"
              className="mt-3 w-full border-background/20 bg-transparent text-background hover:border-background/35 hover:bg-background/10 hover:text-background"
              asChild
            >
              <Link href={`/jobs/${job.id}`}>Lihat halaman publik</Link>
            </Button>
          ) : null}

          <div className="mt-7 border-t border-background/15 pt-5">
            <p className="text-xs leading-5 text-background/70">
              Membatalkan pekerjaan akan menutup lamaran yang masih aktif.
            </p>
            <div className="mt-3 [&>button]:w-full">
              <CancelJobButton jobId={job.id} disabled={!canCancel} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
