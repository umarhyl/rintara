import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Clock3,
  LockKeyhole,
} from "lucide-react";
import { ConfirmAction } from "@/components/rintara/confirm-action";
import { DetailList } from "@/components/rintara/detail-list";
import { PageHeader } from "@/components/rintara/page-header";
import { ReportProblem } from "@/components/rintara/report-problem";
import { StatusBadge } from "@/components/rintara/status-badge";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const agreementDetails = [
  { label: "Pihak", value: "Ayu Pratama · Sinar Event Studio" },
  { label: "Tugas", value: "Menata area registrasi, tanda arah, dan membantu peserta." },
  {
    label: "Akses lokasi",
    value:
      "Alamat lengkap ditampilkan setelah hubungan kesepakatan terverifikasi.",
  },
  { label: "Jadwal", value: "30 Juli 2026 · 09.00–13.00 WIB" },
  { label: "Upah", value: "Rp200.000 / pekerjaan" },
  { label: "Pembayaran", value: "Transfer bank, maksimal 1 hari setelah pekerjaan diverifikasi" },
  { label: "Peralatan", value: "Disediakan pemberi kerja" },
  {
    label: "Pembatalan",
    value: "Hubungi pihak lain secepatnya dan gunakan alur pembatalan atau laporan.",
  },
];

export default async function WorkerAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireDashboardPageRole("worker", `/worker/agreements/${encodeURIComponent(id)}`);
  if (id !== "kesepakatan-kru-acara") notFound();

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Mini Agreement"
        title="Kru Acara Akhir Pekan"
        description="Baca seluruh ketentuan sebelum menyetujuinya. Isi kesepakatan tetap setelah pekerja diterima."
      />

      <div className="flex flex-col gap-4 border-y border-border/75 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-medium">Detail privat untuk kedua pihak</p>
            <p className="mt-1 text-base leading-7 text-muted-foreground">
              Hanya pihak kesepakatan dan admin berwenang yang dapat membukanya.
            </p>
          </div>
        </div>
        <StatusBadge status="warning">Menunggu konfirmasi kamu</StatusBadge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0">
          <section aria-labelledby="agreement-summary">
            <div className="flex items-end justify-between gap-4 border-b border-border/75 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Ketentuan tetap</p>
                <h2 id="agreement-summary" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                  Ringkasan kesepakatan
                </h2>
              </div>
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">01 / 02</span>
            </div>
            <DetailList items={agreementDetails} className="[&>div]:py-5" />
          </section>

          <section className="mt-10 border-t border-border/75 pt-8" aria-labelledby="confirmation-history">
            <div className="grid gap-4 sm:grid-cols-[13rem_1fr] sm:gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Status pihak</p>
                <h2 id="confirmation-history" className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                  Riwayat konfirmasi
                </h2>
              </div>
              <ol className="border-l border-border pl-6">
                <li className="relative pb-7">
                  <span className="absolute -left-[2.05rem] top-0 grid size-4 place-items-center rounded-full bg-success text-success-foreground ring-4 ring-background">
                    <Check className="size-2.5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">Sinar Event Studio</p>
                      <p className="mt-1 text-sm text-muted-foreground">Dikonfirmasi 19 Juli 2026 · 09.10 WIB</p>
                    </div>
                    <span className="text-sm font-medium text-success">Sudah setuju</span>
                  </div>
                </li>
                <li className="relative">
                  <span className="absolute -left-[1.87rem] top-1 size-2.5 rounded-full bg-opportunity ring-4 ring-background" aria-hidden="true" />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">Ayu Pratama</p>
                      <p className="mt-1 text-sm text-muted-foreground">Belum dikonfirmasi</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-opportunity">
                      <Clock3 className="size-3.5" aria-hidden="true" /> Menunggu kamu
                    </span>
                  </div>
                </li>
              </ol>
            </div>
          </section>
        </div>

        <aside className="relative isolate overflow-hidden rounded-[2rem] bg-[#0a1c3f] p-6 text-white shadow-[0_28px_70px_-42px_rgb(15_42_104/0.9)] lg:sticky lg:top-24 lg:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/70">Langkah berikutnya</p>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">Konfirmasi ketentuan</h2>
          <p className="mt-3 text-base leading-7 text-blue-100/75">
            Pastikan tugas, jadwal, lokasi, upah, dan cara pembayaran sudah sesuai.
          </p>

          <div className="mt-7 [&>button]:w-full [&>button]:rounded-full">
            <ConfirmAction
              triggerLabel="Saya setuju dengan ketentuan"
              title="Konfirmasi kesepakatan?"
              description="Konfirmasi dicatat dan tidak mengubah isi kesepakatan. Setelah kedua pihak setuju, langkah kerja akan aktif."
              confirmLabel="Ya, saya setuju"
            />
          </div>

          <div className="mt-7 border-t border-white/15 pt-5">
            <div className="flex gap-3 text-base leading-7 text-amber-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
              <p>Jika ada ketentuan yang salah, jangan konfirmasi. Gunakan pembatalan atau laporkan masalah.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <p className="rounded-2xl border border-white/15 bg-white/[0.055] px-4 py-3 text-sm leading-6 text-blue-100/75">
              Langkah kerja terbuka otomatis setelah kedua pihak mengonfirmasi.
            </p>
            <div className="[&>button]:w-full [&>button]:rounded-full [&>button]:border-white/15 [&>button]:bg-white/5 [&>button]:text-white [&>button]:shadow-none [&>button]:hover:bg-white/10 [&>button]:hover:text-white">
              <ReportProblem />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
