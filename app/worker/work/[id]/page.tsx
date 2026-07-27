import { notFound } from "next/navigation";
import { Check, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  CheckInForm,
  CheckOutButton,
  WorkEvidenceUpload,
} from "@/components/rintara/work-actions";
import { WorkEvidenceView } from "@/components/rintara/work-evidence-view";
import { ReportProblem } from "@/components/rintara/report-problem";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { ApplicationError } from "@/server/errors/application-error";
import { getWorkView, type WorkView } from "@/server/queries/work/get-work-session";

type SessionStatus = WorkView["session"]["status"];

const steps: Array<{ label: string; statuses: SessionStatus[] }> = [
  { label: "Kesepakatan aktif", statuses: ["scheduled", "checked_in", "checked_out", "verified"] },
  { label: "Check-in", statuses: ["checked_in", "checked_out", "verified"] },
  { label: "Check-out", statuses: ["checked_out", "verified"] },
  { label: "Terverifikasi", statuses: ["verified"] },
];

function formatDateTime(value: string | null) {
  if (!value) return "Belum tercatat";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours} jam ${remaining} menit` : `${hours} jam`;
}

function stepState(work: WorkView, index: number) {
  const complete = steps[index]!.statuses.includes(work.session.status);
  const nextIncomplete = steps.findIndex((step) => !step.statuses.includes(work.session.status));
  return {
    complete,
    active: nextIncomplete === index,
  };
}

export default async function WorkerWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboardPageRole("worker", `/worker/work/${encodeURIComponent(id)}`);

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
        description="Kelola check-in dan check-out sesuai status pekerjaan."
      />

      <ol className="grid border-y border-border/75 sm:grid-cols-4" aria-label="Tahapan pekerjaan">
        {steps.map((step, index) => {
          const state = stepState(work, index);

          return (
            <li
              key={step.label}
              className="relative flex min-h-20 items-center gap-3 border-b border-border/70 py-4 last:border-b-0 sm:border-b-0 sm:border-l sm:px-5 sm:first:border-l-0"
              aria-current={state.active ? "step" : undefined}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                  state.complete
                    ? "border-success bg-success text-success-foreground"
                    : state.active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {state.complete ? <Check className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <div>
                <p className={`text-sm font-semibold ${state.active ? "text-primary" : state.complete ? "text-success" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                {state.active ? <p className="mt-0.5 text-xs text-muted-foreground">Sedang aktif</p> : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)] lg:items-start">
        <section
          className="rounded-xl border border-border bg-card p-5 sm:p-6"
          aria-labelledby="worker-action-title"
        >
          <div className="max-w-xl">
            <h2 id="worker-action-title" className="text-2xl font-semibold tracking-tight">
              {work.allowedActions.checkIn
                ? "Masukkan kode check-in"
                : work.allowedActions.checkOut
                  ? "Unggah foto lalu check-out"
                  : work.session.status === "verified"
                    ? "Pekerjaan terverifikasi"
                    : "Menunggu langkah berikutnya"}
            </h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              {work.allowedActions.checkIn
                ? "Minta kode enam digit langsung dari pemberi kerja. Kode berlaku selama 15 menit."
                : work.allowedActions.checkOut
                  ? "Unggah satu foto hasil pekerjaan. Setelah tersimpan, tambahkan catatan jika perlu lalu check-out."
                  : "Tidak ada aksi pekerja yang tersedia pada status ini."}
            </p>

            <div className="mt-6 border-t border-border/75 pt-5">
              {work.allowedActions.checkIn ? (
                <CheckInForm agreementId={work.agreementId} />
              ) : work.allowedActions.checkOut ? (
                <div className="grid gap-4">
                  <WorkEvidenceUpload
                    agreementId={work.agreementId}
                    hasEvidence={work.session.evidence !== null}
                  />
                  <CheckOutButton
                    agreementId={work.agreementId}
                    disabled={work.session.evidence === null}
                  />
                </div>
              ) : (
                <Button type="button" className="w-full" disabled>
                  Menunggu
                </Button>
              )}
            </div>

            <div className="mt-5 flex gap-3 border-t border-border/75 pt-5 text-sm leading-6 text-muted-foreground">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                Foto dinormalisasi untuk membuang metadata lokasi, disimpan
                privat, dan terkunci setelah check-out. Kode check-in tidak
                pernah ditampilkan ulang.
              </p>
            </div>
          </div>
        </section>

        <aside className="grid gap-6 border-y border-border/75 py-7 lg:border-l lg:border-y-0 lg:pl-8">
          <section aria-labelledby="work-summary">
            <h2 id="work-summary" className="text-xl font-semibold">Ringkasan kerja</h2>
            <dl className="mt-4 divide-y divide-border/70 border-y border-border/70">
              <div className="grid gap-1 py-4">
                <dt className="text-sm text-muted-foreground">Pemberi kerja</dt>
                <dd className="font-medium">{work.employerDisplayName}</dd>
              </div>
              <div className="grid gap-1 py-4">
                <dt className="text-sm text-muted-foreground">Alamat lengkap</dt>
                <dd className="font-medium">{work.snapshot.fullAddress}</dd>
              </div>
              <div className="grid gap-1 py-4">
                <dt className="text-sm text-muted-foreground">Jadwal</dt>
                <dd className="font-medium">{formatDateTime(work.snapshot.startsAt)}</dd>
              </div>
              <div className="grid gap-1 py-4">
                <dt className="text-sm text-muted-foreground">Durasi rencana</dt>
                <dd className="font-medium">{formatDuration(work.snapshot.estimatedMinutes)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="attendance-log">
            <h2 id="attendance-log" className="flex items-center gap-2 text-xl font-semibold">
              <Clock3 className="size-5 text-primary" aria-hidden="true" />
              Kehadiran
            </h2>
            <dl className="mt-4 grid gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <dt className="text-sm text-muted-foreground">Check-in</dt>
                <dd className="mt-1 font-medium">{formatDateTime(work.session.checkedInAt)}</dd>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <dt className="text-sm text-muted-foreground">Check-out</dt>
                <dd className="mt-1 font-medium">{formatDateTime(work.session.checkedOutAt)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      {work.session.evidence ? (
        <WorkEvidenceView evidence={work.session.evidence} />
      ) : null}

      <aside className="flex flex-col gap-4 border-y border-border/75 py-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="privacy-note-title">
        <div className="flex max-w-3xl gap-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <h2 id="privacy-note-title" className="font-semibold">Privasi dijaga</h2>
            <p className="mt-1 text-base leading-7 text-muted-foreground">
              Bukti Kerja diterbitkan setelah penyelesaian diverifikasi pemberi kerja.
            </p>
          </div>
        </div>
        <ReportProblem agreementId={work.agreementId} jobId={work.jobId} />
      </aside>
    </div>
  );
}
