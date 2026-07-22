import { BellRing, CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export default async function WorkerNotificationsPage() {
  await requireDashboardPageRole("worker", "/worker/notifications");

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Kabar perjalanan"
        title="Notifikasi"
        description="Pembaruan penting tentang lamaran, kesepakatan, pekerjaan, dan Bukti Kerja."
        action={
          <Button variant="outline" type="button" className="rounded-full px-5" disabled>
            <CheckCheck aria-hidden="true" /> Tandai semua dibaca
          </Button>
        }
      />

      <div className="grid gap-9 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-12">
        <aside className="border-y border-border/75 py-6 lg:sticky lg:top-24" aria-label="Ringkasan notifikasi">
          <BellRing className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-7 text-5xl font-semibold tracking-[-0.06em]">0</p>
          <p className="mt-2 font-medium">Kabar belum dibaca</p>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Data contoh sudah disembunyikan sampai feed notifikasi tersambung.
          </p>
        </aside>

        <section aria-labelledby="notification-feed">
          <div className="flex items-end justify-between gap-4 border-b border-border/75 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Terbaru</p>
              <h2 id="notification-feed" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Linimasa kabar</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">00</span>
          </div>

          <div className="mt-6">
            <EmptyState
              title="Belum ada notifikasi"
              description="Feed notifikasi nyata akan tampil setelah query notifikasi halaman ini tersambung ke backend."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
