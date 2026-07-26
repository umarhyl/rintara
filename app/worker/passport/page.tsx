import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export default async function PassportPage() {
  await requireDashboardPageRole("worker", "/worker/passport");

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Paspor Rintara"
        description="Riwayat Bukti Kerja yang diterbitkan setelah pekerjaan diverifikasi."
      />

      <section
        className="flex gap-3 border-y border-border/75 py-4 text-sm leading-6 text-muted-foreground"
        aria-labelledby="passport-summary"
      >
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
        <p id="passport-summary">
          Bukti Kerja dibuat otomatis oleh sistem, tidak dapat diedit, dan hanya
          terbit setelah penyelesaian diverifikasi pemberi kerja.
        </p>
      </section>

      <section aria-labelledby="proof-history">
        <div className="border-b border-border/75 pb-4">
          <h2 id="proof-history" className="text-xl font-semibold tracking-tight">
            Riwayat Bukti Kerja
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bukti terbaru akan tampil lebih dahulu.
          </p>
        </div>

        <div className="mt-6">
          <EmptyState
            title="Belum ada Bukti Kerja"
            description="Bukti Kerja pertamamu akan muncul setelah pekerjaan diselesaikan dan diverifikasi oleh pemberi kerja."
            actionLabel="Cari pekerjaan"
            actionHref="/jobs"
          />
        </div>
      </section>
    </div>
  );
}
