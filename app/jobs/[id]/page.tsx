import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  MapPin,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Wrench,
} from "lucide-react";
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
  const unitLabel =
    unit === "hour" ? "jam" : unit === "day" ? "hari" : "pekerjaan";
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
  const taskList = tasks.length > 0 ? tasks : [job.taskScope];

  const facts = [
    { label: "Area umum", value: job.publicLocationLabel, icon: MapPin },
    { label: "Jadwal", value: formatDate(job.startsAt), icon: CalendarDays },
    {
      label: "Perkiraan durasi",
      value: formatDuration(job.estimatedMinutes),
      icon: Clock3,
    },
  ] as const;
  const terms = [
    {
      label: "Cara pembayaran",
      value: job.paymentMethod,
      icon: ReceiptText,
    },
    {
      label: "Waktu pembayaran",
      value: job.paymentTiming,
      icon: CalendarDays,
    },
    ...(job.toolsProvided
      ? [
          {
            label: "Disediakan pemberi kerja",
            value: job.toolsProvided,
            icon: PackageCheck,
          },
        ]
      : []),
    ...(job.toolsRequired
      ? [
          {
            label: "Perlu dibawa pekerja",
            value: job.toolsRequired,
            icon: Wrench,
          },
        ]
      : []),
  ];

  return (
    <PublicShell>
      <header className="bg-secondary/30">
        <div className="mx-auto max-w-[80rem] px-4 pb-7 pt-4 sm:px-6 sm:pb-8 lg:px-8">
          <Link
            href="/jobs"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke daftar pekerjaan
          </Link>

          <div className="mt-3 flex flex-wrap gap-2">
            {job.isFirstOpportunity ? (
              <StatusBadge tone="warning">Kesempatan Pertama</StatusBadge>
            ) : null}
            {job.activeBoost ? (
              <StatusBadge tone="info">Diprioritaskan 24 jam</StatusBadge>
            ) : null}
            <StatusBadge tone="success">Menerima lamaran</StatusBadge>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {job.categoryName}
              </p>
              <h1 className="mt-2 max-w-4xl text-balance text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]">
                {job.title}
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {job.employerDisplayName}
              </p>

              <div className="mt-5 rounded-xl bg-white/65 p-4">
                <p className="text-base font-semibold">Ringkasan tugas</p>
                <ul className="mt-2 grid gap-2 md:grid-cols-2">
                  {taskList.slice(0, 2).map((task) => (
                    <li
                      key={task}
                      className="grid grid-cols-[1.25rem_1fr] gap-2 text-base leading-6 text-muted-foreground"
                    >
                      <BadgeCheck
                        className="mt-1 size-4 text-primary"
                        aria-hidden="true"
                      />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
                {taskList.length > 2 ? (
                  <p className="mt-2 text-base font-medium text-primary">
                    {taskList.length - 2} tugas lainnya dijelaskan di bawah.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl bg-card p-5 shadow-[0_18px_48px_-42px_rgb(27_81_45/0.7)]">
              <p className="text-sm font-medium text-muted-foreground">
                Upah tetap
              </p>
              <p className="tabular mt-1 text-2xl font-bold tracking-[-0.025em] text-foreground">
                {wage}
              </p>
              <dl className="mt-4 rounded-lg bg-muted p-4">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Batas lamaran
                  </dt>
                  <dd className="mt-1 text-base font-semibold leading-6">
                    {deadline}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 md:grid-cols-3">
            {facts.map((fact) => {
              const Icon = fact.icon;
              return (
                <div
                  key={fact.label}
                  className="grid grid-cols-[1.75rem_1fr] gap-2 rounded-lg bg-white/65 p-4"
                >
                  <Icon
                    className="mt-0.5 size-4 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      {fact.label}
                    </dt>
                    <dd className="mt-1 text-base font-semibold leading-6">
                      {fact.value}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </header>

      <div className="mx-auto grid max-w-[80rem] gap-8 px-4 pb-28 pt-7 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_21.5rem] lg:px-8 lg:pb-14">
        <article className="grid min-w-0 gap-5">
          <section
            className="rounded-xl bg-card p-6 sm:p-8"
            aria-labelledby="job-tasks"
          >
            <h2
              id="job-tasks"
              className="text-2xl font-semibold tracking-[-0.02em]"
            >
              Yang akan kamu lakukan
            </h2>
            <ul className="mt-4 grid gap-3">
              {taskList.map((task) => (
                <li
                  key={task}
                  className="grid grid-cols-[1.5rem_1fr] gap-3 text-base leading-7"
                >
                  <BadgeCheck
                    className="mt-1 size-4 text-primary"
                    aria-hidden="true"
                  />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="rounded-xl bg-[#eef4ef] p-6 sm:p-8"
            aria-labelledby="job-about"
          >
            <h2
              id="job-about"
              className="text-2xl font-semibold tracking-[-0.02em]"
            >
              Tentang pekerjaan
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
              {job.description}
            </p>
          </section>

          <section
            className="rounded-xl bg-card p-6 sm:p-8"
            aria-labelledby="job-terms"
          >
            <h2
              id="job-terms"
              className="text-2xl font-semibold tracking-[-0.02em]"
            >
              Pembayaran dan alat kerja
            </h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {terms.map((term) => {
                const Icon = term.icon;
                return (
                  <div key={term.label} className="rounded-lg bg-muted p-4 sm:p-5">
                    <dt className="flex items-center gap-2 text-base font-semibold">
                      <Icon
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      {term.label}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-muted-foreground">
                      {term.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section
            className="rounded-xl bg-secondary/70 p-6 sm:p-8"
            aria-labelledby="job-privacy"
          >
            <div className="grid grid-cols-[2rem_1fr] gap-3">
              <ShieldCheck
                className="mt-0.5 size-5 text-primary"
                aria-hidden="true"
              />
              <div>
                <h2
                  id="job-privacy"
                  className="text-lg font-semibold"
                >
                  Alamat lengkap tetap privat
                </h2>
                <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
                  Lokasi lengkap hanya dibuka kepada pekerja yang diterima
                  melalui konteks kesepakatan. Halaman publik hanya menampilkan
                area umum.
              </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-card p-6 sm:p-8" aria-labelledby="job-employer">
            <h2
              id="job-employer"
              className="text-2xl font-semibold tracking-[-0.02em]"
            >
              Pemberi kerja
            </h2>
            <div className="mt-5 flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary font-semibold text-secondary-foreground">
                {job.employerDisplayName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
              <div>
                <p className="font-semibold">{job.employerDisplayName}</p>
                <p className="mt-1 text-base text-muted-foreground">
                  Pemberi kerja di {job.areaName}
                </p>
              </div>
            </div>
          </section>
        </article>

        <aside
          id="apply"
          className="h-fit scroll-mt-24 overflow-hidden rounded-xl bg-[#153e26] text-white lg:sticky lg:top-24"
        >
          <div className="px-5 py-5 sm:px-6">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Lamar pekerjaan
            </h2>
            <p className="mt-2 text-base leading-6 text-[#c9d8cd]">
              Tulis ketersediaan dan alasan kamu cocok. Upah mengikuti
              ketentuan pekerjaan.
            </p>
            <div className="mt-4 rounded-lg bg-white/10 p-4">
              <p className="text-sm text-[#c9d8cd]">Upah tetap</p>
              <p className="tabular mt-1 text-xl font-bold">{wage}</p>
              <p className="mt-1 text-sm leading-5 text-[#c9d8cd]">
                Batas lamaran {deadline}
              </p>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <JobApplyAuthAction jobId={job.id} />
          </div>
        </aside>
      </div>

      <MobileApplyDock wage={wage} />
    </PublicShell>
  );
}
