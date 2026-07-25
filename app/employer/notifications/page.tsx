import Link from "next/link";
import { ArrowUpRight, Bell, CheckCheck } from "lucide-react";

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

export default async function EmployerNotificationsPage() {
  await requireDashboardPageRole("employer", "/employer/notifications");
  const notificationPage = await listMyNotifications();

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Pusat aktivitas"
        title="Yang perlu perhatianmu"
        description="Pembaruan pelamar, kesepakatan, pekerjaan, dan Kredit Kesempatan tersusun berdasarkan waktu."
        action={
          <Button variant="outline" type="button" disabled>
            <CheckCheck aria-hidden="true" />
            Tandai semua dibaca
          </Button>
        }
      />

      <section aria-labelledby="latest-notifications">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2
            id="latest-notifications"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-primary"
          >
            Terbaru
          </h2>
          <p className="text-sm text-muted-foreground">
            {notificationPage.unreadCount} belum dibaca
          </p>
        </div>

        {notificationPage.items.length > 0 ? (
          <ol className="overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/70 backdrop-blur-sm">
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
          <EmptyState
            title="Belum ada notifikasi"
            description="Pembaruan agreement dan pekerjaan akan muncul di sini."
          />
        )}
      </section>
    </div>
  );
}
