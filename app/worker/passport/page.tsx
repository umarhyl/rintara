import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck2,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { getMyPassport } from "@/server/queries/profiles/get-worker-passport";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export default async function PassportPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  await requireDashboardPageRole("worker", "/worker/passport");
  const { cursor } = await searchParams;
  const passport = await getMyPassport({
    cursor: typeof cursor === "string" ? cursor : undefined,
  });

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Paspor Rintara"
        description="Riwayat Bukti Kerja yang diterbitkan setelah pekerjaan diverifikasi."
      />

      <section
        className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
        aria-labelledby="passport-summary"
      >
        <div className="flex gap-3">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-success"
            aria-hidden="true"
          />
          <p
            id="passport-summary"
            className="text-sm leading-6 text-muted-foreground"
          >
            Bukti Kerja dibuat otomatis oleh sistem, tidak dapat diedit, dan
            hanya terbit setelah penyelesaian diverifikasi pemberi kerja.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-5 border-t border-border/70 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <div>
            <dt className="text-sm text-muted-foreground">Bukti Kerja</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {passport.summary.completedJobs}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Kategori</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {passport.summary.verifiedCategoryCount}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="proof-history">
        <div className="border-b border-border/75 pb-4">
          <h2
            id="proof-history"
            className="text-xl font-semibold tracking-tight"
          >
            Riwayat Bukti Kerja
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bukti terbaru tampil lebih dahulu dan tidak dapat diedit.
          </p>
        </div>

        {passport.entries.length > 0 ? (
          <ol className="divide-y divide-border/70 border-b border-border/70">
            {passport.entries.map((proof) => (
              <li
                key={proof.id}
                className="grid gap-4 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-start"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-success/10 text-success">
                  <BadgeCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{proof.jobTitle}</h3>
                    <StatusBadge tone="success">Terverifikasi</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm font-medium text-primary">
                    {proof.categoryName}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4" aria-hidden="true" />
                    {proof.areaLabel}
                  </p>
                </div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarCheck2 className="size-4" aria-hidden="true" />
                  Selesai {dateFormatter.format(proof.completedAt)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Belum ada Bukti Kerja"
              description="Bukti Kerja pertamamu akan muncul setelah pekerjaan diselesaikan dan diverifikasi oleh pemberi kerja."
              actionLabel="Cari pekerjaan"
              actionHref="/jobs"
            />
          </div>
        )}
      </section>

      {passport.nextCursor ? (
        <div>
          <Button variant="outline" asChild>
            <Link
              href={`/worker/passport?cursor=${encodeURIComponent(passport.nextCursor)}`}
            >
              Bukti berikutnya
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
