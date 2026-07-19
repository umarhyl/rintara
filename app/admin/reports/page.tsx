import { AlertTriangle, CheckCircle2, Clock3, FileWarning, ShieldCheck } from "lucide-react";
import { ConfirmAction } from "@/components/rintara/confirm-action";
import { DetailList } from "@/components/rintara/detail-list";
import { PageHeader } from "@/components/rintara/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const reportQueue = [
  {
    id: "RPT-1042",
    reason: "Ketentuan tidak sesuai",
    target: "Kru Acara Akhir Pekan",
    status: "Terbuka",
    tone: "warning" as const,
    active: true,
  },
  {
    id: "RPT-1041",
    reason: "Masalah kehadiran",
    target: "Bantuan Bersih Ruang Pertemuan",
    status: "Ditinjau",
    tone: "info" as const,
    active: false,
  },
];

const moderationActions = [
  "Sembunyikan pekerjaan",
  "Batalkan alur belum selesai",
  "Tangguhkan akun",
  "Tidak ada tindakan tambahan",
];

export default async function ReportsPage() {
  await requireDashboardPageRole("admin", "/admin/reports");

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Kepercayaan & keamanan"
        title="Moderasi laporan"
        description="Tinjau hubungan pihak, konteks pekerjaan, dan jejak tindakan sebelum membuat keputusan."
      />

      <div className="grid gap-7 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="h-fit overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/70 backdrop-blur-sm">
          <div className="border-b border-border/70 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Antrean</p>
                <h2 className="mt-1 text-lg font-semibold">2 laporan aktif</h2>
              </div>
              <FileWarning className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
          <nav aria-label="Daftar laporan" className="divide-y divide-border/70">
            {reportQueue.map((report) => (
              <button
                key={report.id}
                type="button"
                aria-current={report.active ? "true" : undefined}
                className="group relative w-full px-5 py-5 text-left outline-none transition-colors duration-500 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                {report.active ? (
                  <span className="absolute inset-y-4 left-0 w-0.5 rounded-r-full bg-primary" aria-hidden="true" />
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-muted-foreground">{report.id}</span>
                  <StatusBadge status={report.tone}>{report.status}</StatusBadge>
                </div>
                <span className="mt-3 block font-medium leading-6">{report.reason}</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">{report.target}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-7">
          <section aria-labelledby="selected-report" className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/82">
            <div className="flex flex-col gap-5 border-b border-border/70 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-7">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="font-mono text-xs font-semibold tracking-wide text-muted-foreground">RPT-1042</p>
                  <StatusBadge status="warning">Terbuka</StatusBadge>
                </div>
                <h2 id="selected-report" className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
                  Ketentuan pekerjaan
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="size-4" aria-hidden="true" />
                  Dibuat 19 Juli 2026 · 10.14 WIB
                </p>
              </div>
              <Button type="button" variant="outline">Mulai tinjau</Button>
            </div>
            <div className="px-5 sm:px-7">
              <DetailList
                items={[
                  { label: "Target", value: "Kru Acara Akhir Pekan" },
                  { label: "Pelapor", value: "Ayu Pratama · pihak kesepakatan" },
                  { label: "Status alur", value: "Kesepakatan Kerja menunggu konfirmasi" },
                  { label: "Alasan", value: "Alamat yang disampaikan berbeda dari konteks awal." },
                  { label: "Dampak", value: "Penyelesaian pekerjaan terkait dijeda selama laporan aktif." },
                ]}
              />
            </div>
          </section>

          <Alert className="border-amber-300/70 bg-amber-50/80 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Catatan privat moderator</AlertTitle>
            <AlertDescription className="dark:text-amber-200/75">
              Catatan internal tidak boleh disertakan dalam notifikasi kepada pihak terkait.
            </AlertDescription>
          </Alert>

          <section aria-labelledby="decision-title" className="rounded-[1.75rem] border border-border/75 bg-card/72 p-5 backdrop-blur-sm sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(18rem,1.15fr)] lg:gap-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Tahap keputusan</p>
                <h2 id="decision-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Tindakan yang dapat diterapkan
                </h2>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  Pilih hanya tindakan yang didukung bukti. Setiap perubahan akan ditambahkan ke jejak audit.
                </p>
              </div>

              <div className="divide-y divide-border/70 border-y border-border/70">
                {moderationActions.map((item, index) => (
                  <div key={item} className="flex min-h-14 items-center gap-3 py-3">
                    <Checkbox id={`action-${index}`} />
                    <Label htmlFor={`action-${index}`} className="cursor-pointer font-normal leading-6">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 grid gap-2 border-t border-border/70 pt-7">
              <Label htmlFor="note">Catatan keputusan faktual</Label>
              <Textarea
                id="note"
                className="min-h-32 resize-y bg-background/70"
                placeholder="Ringkas bukti dan alasan keputusan tanpa data yang tidak relevan"
              />
              <p className="text-xs leading-5 text-muted-foreground">Catatan ini hanya dapat dilihat oleh moderator yang berwenang.</p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ConfirmAction
                triggerLabel="Tolak laporan"
                title="Tolak laporan ini?"
                description="Laporan ditolak setelah alasan faktual dicatat. Tidak ada bukti atau riwayat yang dihapus."
                confirmLabel="Tolak laporan"
                destructive
              />
              <ConfirmAction
                triggerLabel="Selesaikan laporan"
                title="Terapkan keputusan laporan?"
                description="Laporan ditandai selesai, tindakan terpilih diterapkan, jejak audit dicatat, dan pihak menerima notifikasi yang aman."
                confirmLabel="Terapkan dan selesaikan"
              />
            </div>
          </section>

          <section aria-labelledby="related-audit" className="grid gap-5 border-t border-border/70 pt-7 sm:grid-cols-[15rem_1fr]">
            <div>
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <h2 id="related-audit" className="mt-3 text-lg font-semibold">Audit terkait</h2>
              <p className="mt-2 text-base leading-7 text-muted-foreground">Identitas ditampilkan dalam bentuk aman.</p>
            </div>
            <ol className="relative grid gap-6 before:absolute before:bottom-2 before:left-[0.3rem] before:top-2 before:w-px before:bg-border">
              <li className="relative grid grid-cols-[1.1rem_1fr] gap-4">
                <span className="mt-1 size-2.5 rounded-full bg-primary ring-4 ring-background" aria-hidden="true" />
                <div>
                  <p className="font-medium">Laporan dibuat</p>
                  <p className="mt-1 text-sm text-muted-foreground">10.14 · Identitas pelaku disamarkan</p>
                </div>
              </li>
              <li className="relative grid grid-cols-[1.1rem_1fr] gap-4">
                <span className="mt-1 size-2.5 rounded-full bg-success ring-4 ring-background" aria-hidden="true" />
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    Blok penyelesaian diterapkan
                    <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">10.15 · Alur terkait dijeda</p>
                </div>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
