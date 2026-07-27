import { notFound } from "next/navigation";
import { Check, Clock3, FileCheck2, KeyRound, ShieldCheck, UserRound } from "lucide-react";

import {
  GenerateCheckInCodeButton,
  VerifyCompletionButton,
} from "@/components/rintara/work-actions";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { ReportProblem } from "@/components/rintara/report-problem";
import { WorkEvidenceView } from "@/components/rintara/work-evidence-view";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { ApplicationError } from "@/server/errors/application-error";
import { getWorkView, type WorkView } from "@/server/queries/work/get-work-session";

type SessionStatus = WorkView["session"]["status"];

const steps: Array<{ label: string; statuses: SessionStatus[] }> = [
  { label: "Kesepakatan aktif", statuses: ["scheduled", "checked_in", "checked_out", "verified"] },
  { label: "Check-in", statuses: ["checked_in", "checked_out", "verified"] },
  { label: "Check-out", statuses: ["checked_out", "verified"] },
  { label: "Verifikasi", statuses: ["verified"] },
];

function formatDateTime(value: string | null) {
  if (!value) return "Belum tercatat";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function durationBetween(start: string | null, end: string | null) {
  if (!start || !end) return "Belum lengkap";
  const minutes = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours > 0 ? `${hours} jam ${remaining} menit` : `${minutes} menit`;
}

function stepState(work: WorkView, index: number) {
  const complete = steps[index]!.statuses.includes(work.session.status);
  const nextIncomplete = steps.findIndex((step) => !step.statuses.includes(work.session.status));
  return { complete, active: nextIncomplete === index };
}

export default async function EmployerWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboardPageRole(
    "employer",
    `/employer/work/${encodeURIComponent(id)}`,
  );

  let work: WorkView;
  try {
    work = await getWorkView(id);
  } catch (error) {
    if (
      error instanceof ApplicationError &&
      (error.code === "NOT_FOUND" || error.code === "VALIDATION_FAILED")
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        title={work.title}
        description="Kelola kode check-in, kehadiran, dan verifikasi penyelesaian."
      />

      <ol
        className="grid border-y border-border/75 sm:grid-cols-4"
        aria-label="Tahapan pekerjaan"
      >
        {steps.map((step, index) => {
          const state = stepState(work, index);
          return (
            <li
              key={step.label}
              className={`relative flex items-center gap-3 py-4 sm:px-4 ${
                index > 0 ? "border-t border-border/70 sm:border-l sm:border-t-0" : ""
              } ${state.active ? "bg-primary/6" : ""}`}
              aria-current={state.active ? "step" : undefined}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                  state.complete
                    ? "border-success bg-success text-success-foreground"
                    : state.active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {state.complete ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className="text-sm font-semibold">{step.label}</span>
            </li>
          );
        })}
      </ol>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-7">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <header className="flex flex-col gap-4 border-b border-border/70 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Catatan kehadiran
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {durationBetween(work.session.checkedInAt, work.session.checkedOutAt)}
                </h2>
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="size-4 text-primary" aria-hidden="true" />
                {work.workerDisplayName}
              </p>
            </header>

            <div className="p-5 sm:p-6">
              <ol className="grid gap-5">
                {[
                  {
                    label: "Check-in",
                    value: formatDateTime(work.session.checkedInAt),
                    description: "Dicatat setelah kode yang sah digunakan.",
                    icon: KeyRound,
                  },
                  {
                    label: "Check-out",
                    value: formatDateTime(work.session.checkedOutAt),
                    description: "Dicatat setelah pekerja menyelesaikan sesi.",
                    icon: Clock3,
                  },
                ].map((event) => {
                  const Icon = event.icon;
                  return (
                    <li key={event.label} className="grid grid-cols-[2.4rem_1fr] gap-4">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium text-muted-foreground">{event.label}</p>
                        <p className="mt-1 font-semibold">{event.value}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          <section className="grid gap-3 border-y border-border/70 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
            <div>
              <p className="text-sm font-semibold text-primary">
                Catatan pekerja
              </p>
              <FileCheck2 className="mt-3 size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <blockquote className="leading-7 text-foreground/85">
              {work.session.completionNote || "Belum ada catatan penyelesaian."}
            </blockquote>
          </section>

          {work.session.evidence ? (
            <WorkEvidenceView evidence={work.session.evidence} />
          ) : null}

          <section className="grid gap-4 border-y border-border/70 py-4 sm:grid-cols-[auto_1fr]">
            <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
              <KeyRound className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">Kode check-in privat</h2>
              <p className="mt-1 text-base leading-7 text-muted-foreground">
                Kode enam digit hanya tampil saat dibuat. Kode baru mengganti
                kode lama selama sesi belum check-in.
              </p>
            </div>
          </section>
        </div>

        <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Tindakan berikutnya
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">
            {work.allowedActions.generateCheckInCode
              ? "Buat kode check-in"
              : work.allowedActions.verifyCompletion
                ? "Verifikasi penyelesaian"
                : "Menunggu status berikutnya"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {work.allowedActions.generateCheckInCode
              ? "Berikan kode hanya kepada pekerja yang diterima ketika siap mulai."
              : work.allowedActions.verifyCompletion
                ? "Tinjau foto hasil dan catatan pekerja. Verifikasi menerbitkan satu Bukti Kerja."
                : "Pekerja harus mengunggah foto hasil sebelum check-out."}
          </p>
          <div className="mt-5 border-t border-border/75 pt-5">
            {work.allowedActions.generateCheckInCode ? (
              <GenerateCheckInCodeButton agreementId={work.agreementId} />
            ) : work.allowedActions.verifyCompletion ? (
              <VerifyCompletionButton agreementId={work.agreementId} />
            ) : (
              <Button type="button" className="w-full" disabled>
                Tidak ada aksi
              </Button>
            )}
          </div>

          <div className="mt-6 border-t border-border/75 pt-5">
            <p className="text-xs leading-5 text-muted-foreground">
              Laporan aktif akan menjeda verifikasi penyelesaian.
            </p>
            <div className="mt-3 [&>button]:w-full">
              <ReportProblem agreementId={work.agreementId} jobId={work.jobId} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
