import { Check, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/rintara/confirm-action";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const workSteps = ["Kesepakatan aktif", "Check-in", "Check-out", "Terverifikasi"] as const;

export default async function WorkerWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireDashboardPageRole("worker", `/worker/work/${encodeURIComponent(id)}`);
  if (id !== "sesi-pekerjaan") notFound();

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Bantuan Bersih Ruang Pertemuan"
        title="Langkah pekerjaan"
        description="Selesaikan aksi yang tersedia pada status saat ini."
      />

      <ol className="grid border-y border-border/75 sm:grid-cols-4" aria-label="Tahapan pekerjaan">
        {workSteps.map((step, index) => {
          const done = index === 0;
          const active = index === 1;

          return (
            <li
              key={step}
              className="relative flex min-h-20 items-center gap-3 border-b border-border/70 py-4 last:border-b-0 sm:border-b-0 sm:border-l sm:px-5 sm:first:border-l-0"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                  done
                    ? "border-success bg-success text-success-foreground"
                    : active
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_5px_rgb(30_79_214/0.1)]"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <div>
                <p className={`text-sm font-semibold ${active ? "text-primary" : done ? "text-success" : "text-muted-foreground"}`}>
                  {step}
                </p>
                {active ? <p className="mt-0.5 text-xs text-muted-foreground">Sedang aktif</p> : null}
              </div>
              {active ? <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-primary sm:inset-x-5" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:items-start">
        <section
          className="relative isolate overflow-hidden rounded-[2rem] bg-[#0a1c3f] p-6 text-white shadow-[0_30px_78px_-44px_rgb(15_42_104/0.92)] sm:p-8"
          aria-labelledby="check-in-title"
        >
          <div className="pointer-events-none absolute -right-28 -top-28 -z-10 size-80 rounded-full bg-blue-500/15 blur-3xl" aria-hidden="true" />

          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-200/70">
              <span className="soft-pulse size-2 rounded-full bg-amber-400" aria-hidden="true" />
              Aksi tersedia
            </p>
            <h2 id="check-in-title" className="mt-6 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Masukkan kode check-in
            </h2>
            <p className="mt-3 text-base leading-7 text-blue-100/75">
              Minta kode enam digit langsung dari pemberi kerja. Kode berlaku selama 15 menit.
            </p>

            <div className="mt-8 grid gap-3">
              <Label htmlFor="code" className="text-blue-100">Kode check-in</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                aria-describedby="check-in-code-help"
                placeholder="000000"
                className="theme-static-light h-16 rounded-2xl border-white/20 bg-white text-center font-mono text-2xl tracking-[0.35em] text-slate-950 shadow-[0_20px_45px_-28px_rgb(0_0_0/0.8)] dark:bg-white dark:text-slate-950"
              />
            </div>

            <div className="mt-5 flex gap-3 border-t border-white/15 pt-5 text-base leading-7 text-blue-100/70">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-blue-300" aria-hidden="true" />
              <div>
                <p className="font-medium text-blue-50">Jaga kode tetap privat</p>
                <p id="check-in-code-help" className="mt-1">Gunakan tepat enam digit. Kode lama tidak dapat digunakan setelah diganti, kedaluwarsa, atau berhasil dipakai.</p>
              </div>
            </div>

            <Button type="button" className="theme-static-light mt-7 h-12 w-full rounded-full bg-white text-slate-950 shadow-none hover:bg-blue-50 sm:w-auto sm:px-8">
              Check-in
            </Button>
          </div>
        </section>

        <section className="border-t border-border/75 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-3" aria-labelledby="check-out-title">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Setelah check-in</p>
          <h2 id="check-out-title" className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Check-out setelah selesai</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Aksi ini akan tersedia setelah check-in berhasil.
          </p>

          <div className="mt-7 grid gap-5 opacity-65">
            <div className="grid gap-2">
              <Label htmlFor="note">
                Catatan penyelesaian <span className="font-normal text-muted-foreground">(opsional)</span>
              </Label>
              <Textarea id="note" disabled placeholder="Contoh: seluruh tugas selesai sesuai arahan" className="min-h-28" />
            </div>
            <div className="[&>button]:w-full [&>button]:rounded-full">
              <ConfirmAction
                disabled
                triggerLabel="Check-out"
                title="Selesaikan pekerjaan?"
                description="Waktu check-out akan dicatat dan pemberi kerja diminta memverifikasi penyelesaian."
                confirmLabel="Ya, check-out"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3 border-t border-border/75 pt-6">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-base leading-7 text-muted-foreground">
              Setelah check-out, pemberi kerja akan diminta memverifikasi penyelesaian.
            </p>
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4 border-y border-border/75 py-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="privacy-note-title">
        <div className="flex max-w-3xl gap-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <h2 id="privacy-note-title" className="font-semibold">Tanpa pelacakan lokasi</h2>
            <p className="mt-1 text-base leading-7 text-muted-foreground">
              Rintara tidak mengumpulkan GPS berkelanjutan atau foto bukti kerja. Bukti Kerja diterbitkan setelah penyelesaian diverifikasi pemberi kerja.
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-success">Privasi dijaga</span>
      </aside>
    </div>
  );
}
