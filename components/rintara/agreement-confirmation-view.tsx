import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  Clock3,
  LockKeyhole,
  MapPin,
  UsersRound,
} from "lucide-react";
import { ConfirmAgreementButton } from "@/components/rintara/confirm-agreement-button";
import { DetailList } from "@/components/rintara/detail-list";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { ReportProblem } from "@/components/rintara/report-problem";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import type { AgreementView } from "@/server/queries/agreements/get-agreement";

type AgreementRole = "worker" | "employer";

const statusLabels: Record<AgreementView["status"], string> = {
  pending_confirmation: "Menunggu konfirmasi",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const statusTones: Record<
  AgreementView["status"],
  "neutral" | "info" | "success" | "warning" | "danger"
> = {
  pending_confirmation: "warning",
  active: "success",
  completed: "info",
  cancelled: "danger",
};

const wageStatusLabels: Record<
  AgreementView["snapshot"]["wageStatus"],
  string
> = {
  compliant: "Sesuai panduan upah",
  below: "Di bawah panduan upah",
  unavailable: "Panduan upah belum tersedia",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatConfirmation(value: string | null) {
  return value ? `Dikonfirmasi ${formatDateTime(value)}` : "Belum dikonfirmasi";
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `Sekitar ${hours} jam ${remainingMinutes} menit`
    : `Sekitar ${hours} jam`;
}

function formatWage(amount: string, unit: AgreementView["snapshot"]["wageUnit"]) {
  const unitLabel = unit === "hour" ? "jam" : unit === "day" ? "hari" : "pekerjaan";
  return `${new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount))} / ${unitLabel}`;
}

function confirmationHeading(
  status: AgreementView["status"],
  ownConfirmed: boolean,
) {
  if (status === "active") return "Kesepakatan aktif";
  if (status === "completed") return "Pekerjaan selesai";
  if (status === "cancelled") return "Kesepakatan dibatalkan";
  return ownConfirmed ? "Menunggu pihak lain" : "Konfirmasi ketentuan";
}

function ConfirmationItem({
  label,
  confirmedAt,
  currentParty,
}: {
  label: string;
  confirmedAt: string | null;
  currentParty: boolean;
}) {
  const confirmed = Boolean(confirmedAt);

  return (
    <li className="relative grid grid-cols-[1rem_1fr] gap-3">
      <span
        className={`mt-1 grid size-4 place-items-center rounded-full ring-4 ring-background ${
          confirmed
            ? "bg-success text-success-foreground"
            : "border border-border bg-background"
        }`}
        aria-hidden="true"
      >
        {confirmed ? <Check className="size-2.5" /> : null}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">{label}</p>
          <span
            className={`text-sm font-medium ${
              confirmed ? "text-success" : "text-muted-foreground"
            }`}
          >
            {confirmed ? "Sudah setuju" : currentParty ? "Menunggu kamu" : "Menunggu pihak lain"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatConfirmation(confirmedAt)}
        </p>
      </div>
    </li>
  );
}

export function AgreementConfirmationView({
  agreement,
  role,
}: {
  agreement: AgreementView;
  role: AgreementRole;
}) {
  const ownConfirmed =
    role === "worker"
      ? agreement.confirmations.workerConfirmedAt !== null
      : agreement.confirmations.employerConfirmedAt !== null;
  const partyName =
    role === "worker"
      ? agreement.parties.workerDisplayName
      : agreement.parties.employerDisplayName;
  const otherPartyName =
    role === "worker"
      ? agreement.parties.employerDisplayName
      : agreement.parties.workerDisplayName;
  const canConfirm = agreement.allowedActions.confirm;

  const partyItems = [
    { label: "Pemberi kerja", value: agreement.parties.employerDisplayName },
    { label: "Pekerja", value: agreement.parties.workerDisplayName },
    {
      label: "Jenis",
      value: agreement.snapshot.isFirstOpportunity
        ? `Kesempatan Pertama · ${agreement.snapshot.categoryName}`
        : agreement.snapshot.categoryName,
    },
  ];
  const workItems = [
    { label: "Ruang lingkup", value: agreement.snapshot.taskScope },
    { label: "Area umum", value: agreement.snapshot.generalArea },
    { label: "Alamat lengkap", value: agreement.snapshot.fullAddress },
    {
      label: "Instruksi tiba",
      value: agreement.snapshot.arrivalInstructions || "Tidak ada instruksi khusus.",
    },
    {
      label: "Peralatan disediakan",
      value: agreement.snapshot.toolsProvided || "Tidak disebutkan.",
    },
    {
      label: "Peralatan pekerja",
      value: agreement.snapshot.toolsRequired || "Tidak disebutkan.",
    },
  ];
  const scheduleItems = [
    { label: "Jadwal", value: formatDateTime(agreement.snapshot.startsAt) },
    { label: "Durasi", value: formatDuration(agreement.snapshot.estimatedMinutes) },
  ];
  const paymentItems = [
    {
      label: "Upah",
      value: formatWage(agreement.snapshot.wageAmount, agreement.snapshot.wageUnit),
    },
    {
      label: "Status upah",
      value: wageStatusLabels[agreement.snapshot.wageStatus],
    },
    { label: "Metode bayar", value: agreement.snapshot.paymentMethod },
    { label: "Waktu bayar", value: agreement.snapshot.paymentTiming },
    { label: "Pembatalan", value: agreement.snapshot.cancellationWording },
  ];

  return (
    <div className="grid gap-7">
      <PageHeader
        title={agreement.snapshot.title}
        description={`Ketentuan tetap antara ${otherPartyName} dan ${partyName}.`}
        action={
          <StatusBadge tone={statusTones[agreement.status]}>
            {statusLabels[agreement.status]}
          </StatusBadge>
        }
      />

      {agreement.cancellation ? (
        <section
          aria-labelledby="agreement-cancellation-title"
          className="flex gap-3 rounded-xl bg-destructive/10 p-4 text-foreground sm:p-5"
        >
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2
              id="agreement-cancellation-title"
              className="font-semibold text-destructive"
            >
              Kesepakatan dibatalkan
            </h2>
            <p className="mt-1 break-words text-base leading-6">
              {agreement.cancellation.reason}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dicatat {formatDateTime(agreement.cancellation.cancelledAt)}
            </p>
          </div>
        </section>
      ) : null}

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="overflow-hidden rounded-xl border border-border bg-card">
          <header className="flex flex-col gap-3 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="text-sm font-semibold text-muted-foreground">
              Versi {agreement.snapshot.version}
            </p>
            <p className="flex max-w-sm items-center gap-2 text-sm leading-6 text-muted-foreground">
              <LockKeyhole className="size-4 shrink-0 text-primary" aria-hidden="true" />
              Alamat lengkap hanya tampil di Mini Agreement privat.
            </p>
          </header>

          <section className="grid gap-4 border-b border-border/70 p-5 sm:p-6 lg:grid-cols-[10rem_1fr] lg:gap-8">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <UsersRound className="size-4" aria-hidden="true" />
                Para pihak
              </h2>
            </div>
            <DetailList items={partyItems} className="border-y border-border/70" />
          </section>

          <section className="grid gap-4 border-b border-border/70 p-5 sm:p-6 lg:grid-cols-[10rem_1fr] lg:gap-8">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <BriefcaseBusiness className="size-4" aria-hidden="true" />
                Pekerjaan dan lokasi
              </h2>
            </div>
            <DetailList items={workItems} className="border-y border-border/70" />
          </section>

          <section className="grid gap-4 border-b border-border/70 p-5 sm:p-6 lg:grid-cols-[10rem_1fr] lg:gap-8">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CalendarClock className="size-4" aria-hidden="true" />
                Waktu
              </h2>
            </div>
            <DetailList items={scheduleItems} className="border-y border-border/70" />
          </section>

          <section className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[10rem_1fr] lg:gap-8">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Banknote className="size-4" aria-hidden="true" />
                Upah dan ketentuan
              </h2>
            </div>
            <DetailList items={paymentItems} className="border-y border-border/70" />
          </section>
        </article>

        <aside className="rounded-xl border border-border bg-card p-5 xl:sticky xl:top-24">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Clock3 className="size-4" aria-hidden="true" />
            Status konfirmasi
          </p>
          <h2 className="mt-3 text-xl font-semibold">
            {confirmationHeading(agreement.status, ownConfirmed)}
          </h2>

          <ol className="mt-6 grid gap-6">
            <ConfirmationItem
              label={agreement.parties.employerDisplayName}
              confirmedAt={agreement.confirmations.employerConfirmedAt}
              currentParty={role === "employer"}
            />
            <ConfirmationItem
              label={agreement.parties.workerDisplayName}
              confirmedAt={agreement.confirmations.workerConfirmedAt}
              currentParty={role === "worker"}
            />
          </ol>

          <div className="mt-6 border-t border-border/70 pt-5">
            {canConfirm ? (
              <ConfirmAgreementButton agreementId={agreement.id} />
            ) : agreement.status === "active" ||
              agreement.status === "completed" ? (
              <Button className="h-11 w-full" asChild>
                <Link href={`/${role}/work/${agreement.id}`}>
                  {agreement.status === "active" ? (
                    <MapPin aria-hidden="true" />
                  ) : (
                    <Check aria-hidden="true" />
                  )}
                  {agreement.status === "active"
                    ? "Buka langkah kerja"
                    : "Lihat hasil pekerjaan"}
                </Link>
              </Button>
            ) : (
              <Button type="button" className="h-11 w-full" disabled>
                <Check aria-hidden="true" />
                {ownConfirmed ? "Sudah dikonfirmasi" : statusLabels[agreement.status]}
              </Button>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            <div className="flex gap-3 border-t border-amber-300/60 pt-4 text-sm leading-6 text-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
              <p>
                Jika ada ketentuan yang salah, jangan konfirmasi. Gunakan alur
                pembatalan atau laporkan masalah.
              </p>
            </div>
            <ReportProblem
              agreementId={agreement.id}
              jobId={agreement.snapshot.jobId}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
