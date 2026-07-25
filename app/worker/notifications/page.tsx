import Link from "next/link";
import { ArrowUpRight, Bell, BellRing, CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { listMyNotifications } from "@/server/queries/notifications";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

export default async function WorkerNotificationsPage() {
  await requireDashboardPageRole("worker", "/worker/notifications");
  const notificationPage = await listMyNotifications();

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
          <p className="mt-7 text-5xl font-semibold tracking-[-0.06em]">
            {notificationPage.unreadCount}
          </p>
          <p className="mt-2 font-medium">Kabar belum dibaca</p>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Buka pembaruan agreement dari sini tanpa menampilkan alamat privat
            di feed.
          </p>
        </aside>

        <section aria-labelledby="notification-feed">
          <div className="flex items-end justify-between gap-4 border-b border-border/75 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Terbaru</p>
              <h2 id="notification-feed" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Linimasa kabar</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {notificationPage.items.length.toString().padStart(2, "0")}
            </span>
          </div>

          {notificationPage.items.length > 0 ? (
            <ol className="mt-6 overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/70">
              {notificationPage.items.map((item, index) => {
                const content = (
                  <>
                    <span
                      className={`grid size-11 place-items-center rounded-full border ${
                        item.readAt
                          ? "border-border bg-background text-muted-foreground"
                          : "border-primary/25 bg-primary/8 text-primary"
                      }`}
                    >
                      <Bell className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold tracking-[-0.02em]">
                          {item.title}
                        </span>
                        {!item.readAt ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                            Belum dibaca
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1.5 block max-w-2xl text-base leading-7 text-muted-foreground">
                        {item.body}
                      </span>
                      <span className="mt-2 block text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </span>
                    {item.href ? (
                      <span className="flex min-h-11 items-center gap-2 self-end text-sm font-semibold text-primary sm:self-center">
                        Buka detail
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                );

                return (
                  <li
                    key={item.id}
                    className={index > 0 ? "border-t border-border/70" : undefined}
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="group grid min-h-32 gap-5 px-5 py-6 outline-none transition-colors duration-300 hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:px-7"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="grid min-h-32 gap-5 px-5 py-6 sm:grid-cols-[3rem_minmax(0,1fr)] sm:items-center sm:px-7">
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="mt-6">
              <EmptyState
                title="Belum ada notifikasi"
                description="Pembaruan agreement dan pekerjaan akan muncul di sini."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
