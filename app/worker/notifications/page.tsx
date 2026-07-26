import Link from "next/link";
import { ArrowUpRight, Bell } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
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
    <div className="grid gap-7">
      <PageHeader
        title="Notifikasi"
        description="Pembaruan tentang lamaran, kesepakatan, pekerjaan, dan Bukti Kerja."
      />

      <section aria-labelledby="notification-feed">
          <div className="flex items-center justify-between gap-4 border-y border-border/75 py-4">
            <div>
              <h2 id="notification-feed" className="text-lg font-semibold tracking-tight">
                Pembaruan terbaru
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {notificationPage.unreadCount} belum dibaca
              </p>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {notificationPage.items.length} notifikasi
            </span>
          </div>

          {notificationPage.items.length > 0 ? (
            <ol className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
              {notificationPage.items.map((item, index) => {
                const content = (
                  <>
                    <span
                      className={`grid size-11 place-items-center rounded-xl border ${
                        item.readAt
                          ? "border-border bg-background text-muted-foreground"
                          : "border-primary/25 bg-primary/8 text-primary"
                      }`}
                    >
                      <Bell className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold tracking-tight">
                          {item.title}
                        </span>
                        {!item.readAt ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                            Belum dibaca
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block max-w-2xl text-sm leading-6 text-muted-foreground">
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
                        className="group grid min-h-20 gap-4 p-4 outline-none transition-colors duration-200 hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:p-5"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="grid min-h-20 gap-4 p-4 sm:grid-cols-[3rem_minmax(0,1fr)] sm:items-center sm:p-5">
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
                description="Pembaruan Mini Agreement dan pekerjaan akan muncul di sini."
              />
            </div>
          )}
      </section>
    </div>
  );
}
