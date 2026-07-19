import Link from "next/link";
import { ArrowRight, BellRing, CheckCheck } from "lucide-react";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { demoNotifications as notifications } from "@/lib/demo-data";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export default async function WorkerNotificationsPage() {
  await requireDashboardPageRole("worker", "/worker/notifications");

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Kabar perjalanan"
        title="Notifikasi"
        description="Pembaruan penting tentang lamaran, kesepakatan, pekerjaan, dan Bukti Kerja."
        action={
          <Button variant="outline" type="button" className="rounded-full px-5">
            <CheckCheck aria-hidden="true" /> Tandai semua dibaca
          </Button>
        }
      />

      <div className="grid gap-9 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-12">
        <aside className="border-y border-border/75 py-6 lg:sticky lg:top-24" aria-label="Ringkasan notifikasi">
          <BellRing className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-7 text-5xl font-semibold tracking-[-0.06em]">{unreadCount}</p>
          <p className="mt-2 font-medium">Kabar belum dibaca</p>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Dahulukan kabar yang membutuhkan tindakanmu.
          </p>
        </aside>

        <section aria-labelledby="notification-feed">
          <div className="flex items-end justify-between gap-4 border-b border-border/75 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Terbaru</p>
              <h2 id="notification-feed" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Linimasa kabar</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{notifications.length.toString().padStart(2, "0")}</span>
          </div>

          <ol>
            {notifications.map((item, index) => (
              <li
                key={item.id}
                className={`group relative grid gap-4 border-b border-border/70 py-7 sm:grid-cols-[2.25rem_1fr] sm:gap-5 ${
                  item.unread ? "before:absolute before:inset-y-4 before:left-0 before:w-0.5 before:rounded-full before:bg-primary sm:before:-left-4" : ""
                }`}
              >
                <span className="font-mono text-xs text-muted-foreground" aria-hidden="true">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <article>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold tracking-[-0.02em] transition-colors duration-500 group-hover:text-primary">
                          {item.title}
                        </h3>
                        {item.unread ? (
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Belum dibaca</span>
                        ) : null}
                      </div>
                      <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">{item.body}</p>
                    </div>
                    {item.unread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" /> : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <time className="text-xs text-muted-foreground">{item.time}</time>
                    {item.id === "notification-2" ? (
                      <Button variant="link" className="h-auto px-0 [&_svg]:group-hover/button:translate-x-0.5" asChild>
                        <Link href="/worker/agreements/kesepakatan-kru-acara">
                          Buka kesepakatan <ArrowRight aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
