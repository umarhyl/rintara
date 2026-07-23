import Link from "next/link";
import { ArrowUpRight, Bell, CheckCheck } from "lucide-react";

import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const items = [
  {
    title: "Pekerja sudah check-out",
    body: "Ayu Pratama menunggu verifikasi untuk Bantuan Bersih Ruang Pertemuan.",
    time: "8 menit lalu",
    href: "/employer/work/sesi-pekerjaan",
    unread: true,
  },
  {
    title: "Dua lamaran baru",
    body: "Kru Acara Akhir Pekan memiliki pelamar baru untuk ditinjau.",
    time: "1 jam lalu",
    href: "/employer/jobs",
    unread: true,
  },
  {
    title: "Kredit Kesempatan diterbitkan",
    body: "Satu kredit aktif ditambahkan setelah Kesempatan Pertama selesai.",
    time: "3 hari lalu",
    href: "/employer/opportunity-credits",
    unread: false,
  },
];

export default async function EmployerNotificationsPage() {
  await requireDashboardPageRole("employer", "/employer/notifications");

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Pusat aktivitas"
        title="Yang perlu perhatianmu"
        description="Pembaruan pelamar, kesepakatan, pekerjaan, dan Kredit Kesempatan tersusun berdasarkan waktu."
        action={
          <Button variant="outline" type="button">
            <CheckCheck aria-hidden="true" />
            Tandai semua dibaca
          </Button>
        }
      />

      <section aria-labelledby="latest-notifications">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2
            id="latest-notifications"
            className="text-xs font-semibold tracking-[0.14em] text-primary uppercase"
          >
            Terbaru
          </h2>
          <p className="text-sm text-muted-foreground">2 belum dibaca</p>
        </div>

        <ol className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/70 backdrop-blur-sm">
          {items.map((item, index) => (
            <li
              key={item.title}
              className={index > 0 ? "border-t border-border/70" : undefined}
            >
              <Link
                href={item.href}
                className={`group grid min-h-36 gap-5 px-5 py-6 outline-none transition-colors duration-300 hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:px-7 ${
                  item.unread ? "bg-primary/4" : ""
                }`}
              >
                <span
                  className={`grid size-11 place-items-center rounded-full border ${
                    item.unread
                      ? "border-primary/25 bg-primary/8 text-primary"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Bell className="size-4" aria-hidden="true" />
                </span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold tracking-[-0.02em]">
                      {item.title}
                    </span>
                    {item.unread ? (
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
                    {item.time}
                  </span>
                </span>

                <span className="flex min-h-11 items-center gap-2 self-end text-sm font-semibold text-primary sm:self-center">
                  Buka detail
                  <ArrowUpRight
                    className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
