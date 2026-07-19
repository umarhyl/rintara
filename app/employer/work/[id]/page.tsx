import {
  Check,
  Clock3,
  FileCheck2,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { ConfirmAction } from "@/components/rintara/confirm-action";
import { PageHeader } from "@/components/rintara/page-header";
import { ReportProblem } from "@/components/rintara/report-problem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const workSteps = [
  { label: "Kesepakatan aktif", state: "done" },
  { label: "Check-in", state: "done" },
  { label: "Check-out", state: "done" },
  { label: "Verifikasi", state: "current" },
] as const;

const attendance = [
  {
    label: "Check-in",
    value: "19 Juli 2026 · 08.02 WIB",
    description: "Dicatat otomatis setelah kode yang sah digunakan.",
    icon: KeyRound,
  },
  {
    label: "Check-out",
    value: "19 Juli 2026 · 11.06 WIB",
    description: "Pekerja menyelesaikan sesi satu kali.",
    icon: Clock3,
  },
];

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
  if (id !== "sesi-pekerjaan") notFound();

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Bantuan Bersih Ruang Pertemuan"
        title="Satu pemeriksaan sebelum Bukti Kerja"
        description="Ayu Pratama telah check-out. Periksa waktu kehadiran dan catatan penyelesaian sebelum memverifikasi pekerjaan."
      />

      <ol
        className="grid gap-0 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/65 sm:grid-cols-4"
        aria-label="Tahapan pekerjaan"
      >
        {workSteps.map((step, index) => {
          const done = step.state === "done";
          return (
            <li
              key={step.label}
              className={`relative flex items-center gap-3 px-4 py-4 ${
                index > 0 ? "border-t border-border/70 sm:border-l sm:border-t-0" : ""
              } ${step.state === "current" ? "bg-primary/6" : ""}`}
              aria-current={step.state === "current" ? "step" : undefined}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                  done
                    ? "border-success bg-success text-success-foreground"
                    : "border-primary bg-primary text-primary-foreground"
                }`}
              >
                {done ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className="text-sm font-semibold">{step.label}</span>
            </li>
          );
        })}
      </ol>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="grid gap-7">
          <section className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/75 backdrop-blur-sm">
            <header className="flex flex-col gap-4 border-b border-border/70 px-6 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                  Catatan kehadiran
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  3 jam 4 menit di lokasi kerja
                </h2>
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="size-4 text-primary" aria-hidden="true" />
                Ayu Pratama
              </p>
            </header>

            <div className="px-6 py-8 sm:px-8">
              <ol className="relative grid gap-8 before:absolute before:bottom-5 before:left-[1.18rem] before:top-5 before:w-px before:bg-border before:content-['']">
                {attendance.map((event) => {
                  const Icon = event.icon;
                  return (
                    <li
                      key={event.label}
                      className="relative grid grid-cols-[2.4rem_1fr] gap-4"
                    >
                      <span className="relative z-10 grid size-10 place-items-center rounded-full border border-primary/25 bg-card text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium text-muted-foreground">
                          {event.label}
                        </p>
                        <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">
                          {event.value}
                        </p>
                        <p className="mt-1 text-base leading-7 text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          <section className="grid gap-6 border-y border-border/70 py-7 sm:grid-cols-[11rem_1fr] sm:gap-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                Catatan pekerja
              </p>
              <FileCheck2 className="mt-4 size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <blockquote className="text-lg leading-8 tracking-[-0.01em] text-foreground/85">
              “Seluruh ruang sudah dibersihkan dan kursi telah dirapikan.”
            </blockquote>
          </section>

          <section className="grid gap-5 rounded-[1.5rem] border border-border/70 bg-muted/35 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
            <span className="grid size-10 place-items-center rounded-full bg-card text-muted-foreground">
              <KeyRound className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">Kode check-in sudah digunakan</h2>
              <p className="mt-1 text-base leading-7 text-muted-foreground">
                Kode enam digit tidak dapat ditampilkan kembali. Kode baru hanya
                tersedia pada tahap check-in untuk kesepakatan yang aktif.
              </p>
            </div>
          </section>
        </div>

        <aside className="rounded-[1.75rem] bg-foreground p-6 text-background shadow-[0_28px_70px_-44px_rgb(15_23_42/0.7)] lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-background/70 uppercase">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Tindakan berikutnya
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
            Verifikasi penyelesaian
          </h2>
          <p className="mt-2 text-base leading-7 text-background/65">
            Tindakan ini menyelesaikan sesi, kesepakatan, dan pekerjaan, lalu
            menerbitkan satu Bukti Kerja. Kredit Kesempatan dapat diterbitkan jika
            seluruh syarat terpenuhi dan batas kredit aktif belum tercapai.
          </p>
          <div className="mt-6 [&>button]:w-full">
            <ConfirmAction
              triggerLabel="Verifikasi pekerjaan"
              title="Pekerjaan benar-benar selesai?"
              description="Sesi, kesepakatan, dan pekerjaan akan diselesaikan bersama. Satu Bukti Kerja diterbitkan dan Kredit Kesempatan dapat ditambahkan jika memenuhi syarat."
              confirmLabel="Ya, verifikasi"
            />
          </div>

          <div className="mt-7 border-t border-background/15 pt-5">
            <Alert className="border-amber-300/25 bg-amber-300/10 text-background">
              <Clock3 aria-hidden="true" />
              <AlertTitle>Ada masalah?</AlertTitle>
              <AlertDescription className="text-background/65">
                Ajukan laporan faktual. Laporan aktif akan menjeda verifikasi.
              </AlertDescription>
            </Alert>
            <div className="mt-3 [&>button]:w-full [&>button]:border-background/20 [&>button]:bg-transparent [&>button]:text-background [&>button:hover]:bg-background/10">
              <ReportProblem />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
