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
    { label: "Metode bayar", value: agreement.snapshot.paymentMethod },
    { label: "Waktu bayar", value: agreement.snapshot.paymentTiming },
    { label: "Pembatalan", value: agreement.snapshot.cancellationWording },
  ];

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Mini Agreement"
        title={agreement.snapshot.title}
        description={`Ketentuan ini adalah snapshot tetap saat ${otherPartyName} dan ${partyName} terhubung melalui penerimaan lamaran.`}
        action={
          <StatusBadge tone={statusTones[agreement.status]}>
            {statusLabels[agreement.status]}
          </StatusBadge>
        }
      />

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/80 shadow-[0_24px_70px_-56px_rgb(15_23_42/0.5)] backdrop-blur-sm">
          <header className="grid gap-5 border-b border-border/70 px-5 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Snapshot versi {agreement.snapshot.version}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Ketentuan diterima
              </h2>
            </div>
            <p className="flex max-w-xs items-center gap-2 text-base leading-7 text-muted-foreground">
              <LockKeyhole className="size-4 shrink-0 text-primary" aria-hidden="true" />
              Alamat lengkap hanya tampil di tampilan agreement privat ini.
            </p>
          </header>

          <section className="grid gap-4 border-b border-border/70 px-5 py-7 sm:px-8 lg:grid-cols-[10rem_1fr] lg:gap-10">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <UsersRound className="size-4" aria-hidden="true" />
                01
              </p>
              <h2 className="mt-3 text-lg font-semibold">Para pihak</h2>
            </div>
            <DetailList items={partyItems} className="border-y border-border/70" />
          </section>

          <section className="grid gap-4 border-b border-border/70 px-5 py-7 sm:px-8 lg:grid-cols-[10rem_1fr] lg:gap-10">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <BriefcaseBusiness className="size-4" aria-hidden="true" />
                02
              </p>
              <h2 className="mt-3 text-lg font-semibold">Pekerjaan & lokasi</h2>
            </div>
            <DetailList items={workItems} className="border-y border-border/70" />
          </section>

          <section className="grid gap-4 border-b border-border/70 px-5 py-7 sm:px-8 lg:grid-cols-[10rem_1fr] lg:gap-10">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <CalendarClock className="size-4" aria-hidden="true" />
                03
              </p>
              <h2 className="mt-3 text-lg font-semibold">Waktu</h2>
            </div>
            <DetailList items={scheduleItems} className="border-y border-border/70" />
          </section>

          <section className="grid gap-4 px-5 py-7 sm:px-8 lg:grid-cols-[10rem_1fr] lg:gap-10">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <Banknote className="size-4" aria-hidden="true" />
                04
              </p>
              <h2 className="mt-3 text-lg font-semibold">Upah & ketentuan</h2>
            </div>
            <DetailList items={paymentItems} className="border-y border-border/70" />
          </section>
        </article>

        <aside className="rounded-[1.5rem] border border-border/75 bg-card p-6 shadow-[0_24px_70px_-56px_rgb(15_23_42/0.5)] xl:sticky xl:top-24">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Clock3 className="size-4" aria-hidden="true" />
            Status konfirmasi
          </p>
          <h2 className="mt-3 text-xl font-semibold">
            {agreement.status === "active"
              ? "Kesepakatan aktif"
              : ownConfirmed
                ? "Menunggu pihak lain"
                : "Konfirmasi ketentuan"}
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
            ) : agreement.status === "active" ? (
              <Button className="h-11 w-full" asChild>
                <Link href={`/${role}/work/${agreement.id}`}>
                  <MapPin aria-hidden="true" />
                  Buka langkah kerja
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
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
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
