import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { JobApplyAuthAction } from "@/components/rintara/job-apply-auth-action";
import { MobileApplyDock } from "@/components/rintara/mobile-apply-dock";
import { PublicShell } from "@/components/rintara/public-shell";
import { StatusBadge } from "@/components/rintara/status-badge";
import { ApplicationError } from "@/server/errors/application-error";
import {
  getPublishedJob,
  type PublicJobDetail,
} from "@/server/queries/jobs/public-jobs";

function formatWage(amount: number, unit: PublicJobDetail["wageUnit"]) {
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
    ? `Sekitar ${hours} jam ${remainingMinutes} menit`
    : `Sekitar ${hours} jam`;
}

function taskItems(taskScope: string) {
  return taskScope
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadPublicJob(id: string) {
  try {
    return await getPublishedJob(id);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "JOB_NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await loadPublicJob(id);

  return {
    title: job.title,
    description: `${job.description} ${job.publicLocationLabel}.`,
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await loadPublicJob(id);
  const wage = formatWage(job.wageAmount, job.wageUnit);
  const deadline = formatDate(job.applicationDeadline);
  const tasks = taskItems(job.taskScope);

  const facts = [
    { label: "Area umum", value: job.publicLocationLabel, icon: MapPin },
    { label: "Jadwal", value: formatDate(job.startsAt), icon: CalendarDays },
    {
      label: "Perkiraan durasi",
      value: formatDuration(job.estimatedMinutes),
      icon: Clock3,
    },
  ] as const;

  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden border-b border-border/70">
        <AmbientBackdrop variant="page" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 lg:px-8">
          <Link
            href="/jobs"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke daftar pekerjaan
          </Link>

          <div className="mt-8 flex flex-wrap gap-2">
            {job.isFirstOpportunity ? (
              <StatusBadge tone="warning">Kesempatan Pertama</StatusBadge>
            ) : null}
            {job.activeBoost ? (
              <StatusBadge tone="info">Prioritas 24 jam</StatusBadge>
            ) : null}
            <StatusBadge tone="success">Menerima lamaran</StatusBadge>
          </div>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-medium text-primary">{job.categoryName}</p>
              <h1 className="mt-3 max-w-4xl text-balance text-[3rem] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl">
                {job.title}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground">
                {job.employerDisplayName}
              </p>
            </div>
            <div className="border-l border-border pl-5 lg:min-w-64">
              <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground">
                UPAH TETAP
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                {wage}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Batas lamaran {deadline}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-28 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_23rem] lg:px-8 lg:pb-20" data-scroll-section>
        <article className="min-w-0" data-reveal-list>
          <dl className="grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {facts.map((fact) => {
              const Icon = fact.icon;
              return (
                <div
                  key={fact.label}
                  className="grid grid-cols-[2rem_1fr] gap-3 py-5 sm:px-5 sm:first:pl-0"
                >
                  <Icon className="mt-0.5 size-4.5 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                    <dd className="mt-1 text-sm font-semibold leading-6">
                      {fact.value}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>

          <section className="grid gap-5 border-b border-border py-10 sm:grid-cols-[7rem_1fr] sm:py-12" aria-labelledby="job-about">
            <p className="font-mono text-sm text-muted-foreground">01 / RINGKASAN</p>
            <div>
              <h2 id="job-about" className="text-2xl font-semibold tracking-[-0.03em]">
                Tentang pekerjaan
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                {job.description}
              </p>
            </div>
          </section>

          <section className="grid gap-5 border-b border-border py-10 sm:grid-cols-[7rem_1fr] sm:py-12" aria-labelledby="job-tasks">
            <p className="font-mono text-sm text-muted-foreground">02 / TUGAS</p>
            <div>
              <h2 id="job-tasks" className="text-2xl font-semibold tracking-[-0.03em]">
                Yang akan kamu lakukan
              </h2>
              <ul className="mt-5 divide-y divide-border border-y border-border">
                {(tasks.length > 0 ? tasks : [job.taskScope]).map((task, index) => (
                  <li key={task} className="grid grid-cols-[2rem_1fr] gap-3 py-4 leading-7">
                    <span className="font-mono text-xs text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="grid gap-5 border-b border-border py-10 sm:grid-cols-[7rem_1fr] sm:py-12" aria-labelledby="job-privacy">
            <p className="font-mono text-sm text-muted-foreground">03 / PRIVASI</p>
            <div className="border-l-2 border-primary bg-secondary/60 px-5 py-5 sm:px-6">
              <h2 id="job-privacy" className="flex items-center gap-3 text-lg font-semibold">
                <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                Alamat lengkap tetap privat
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Lokasi lengkap hanya dibuka kepada pekerja yang diterima melalui konteks kesepakatan. Halaman publik hanya menampilkan area umum.
              </p>
            </div>
          </section>

          <section className="grid gap-5 py-10 sm:grid-cols-[7rem_1fr] sm:py-12" aria-labelledby="job-employer">
            <p className="font-mono text-sm text-muted-foreground">04 / PEMBERI</p>
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-primary/20 bg-secondary font-semibold text-primary">
                SE
              </span>
              <div>
                <h2 id="job-employer" className="font-semibold">
                  {job.employerDisplayName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pemberi kerja di {job.areaName}
                </p>
              </div>
            </div>
          </section>
        </article>

        <aside id="apply" className="h-fit scroll-mt-24 overflow-hidden rounded-[2rem] bg-[#0a1c3f] text-white shadow-[0_28px_75px_-42px_rgb(15_42_104/0.85)] lg:sticky lg:top-24">
          <div className="relative overflow-hidden border-b border-white/10 px-6 py-7">
            <span className="absolute -right-12 -top-16 size-44 rounded-full bg-blue-400/15 blur-2xl" aria-hidden="true" />
            <ReceiptText className="relative size-5 text-blue-300" aria-hidden="true" />
            <h2 className="relative mt-5 text-2xl font-semibold tracking-[-0.035em]">
              Lamar pekerjaan ini
            </h2>
            <p className="relative mt-3 text-base leading-7 text-blue-100/70">
              Upah sudah ditetapkan dan tidak ditawar melalui catatan lamaran.
            </p>
            <div className="relative mt-6 border-y border-white/15 py-5">
              <p className="text-xs text-blue-200/65">Upah yang disepakati</p>
              <p className="mt-1 text-2xl font-semibold">{wage}</p>
              <p className="mt-2 text-xs text-blue-100/60">Batas lamaran {deadline}</p>
            </div>
          </div>

          <div className="px-6 py-7">
            <JobApplyAuthAction jobId={job.id} />
          </div>
        </aside>
      </div>

      <MobileApplyDock wage={wage} />
    </PublicShell>
  );
}
