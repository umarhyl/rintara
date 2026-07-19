import Link from "next/link";
import { ArrowRight, Clock3, FileCheck2, ShieldCheck, TicketCheck } from "lucide-react";

import { ConfirmAction } from "@/components/rintara/confirm-action";
import { PageHeader } from "@/components/rintara/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const summaries = [
  {
    label: "Kredit aktif",
    value: "2 / 3",
    description: "Batas maksimum tiga kredit aktif",
    icon: TicketCheck,
  },
  {
    label: "Kesempatan selesai",
    value: "4",
    description: "Sepanjang waktu",
    icon: FileCheck2,
  },
  {
    label: "Boost aktif",
    value: "0",
    description: "Belum ada pekerjaan yang di-boost",
    icon: Clock3,
  },
];

const credits = [
  {
    id: "credit-1",
    source: "Kru Acara Komunitas",
    earnedAt: "Diperoleh 10 Juli 2026",
  },
  {
    id: "credit-2",
    source: "Input Inventaris",
    earnedAt: "Diperoleh 2 Juli 2026",
  },
];

export default async function CreditsPage() {
  await requireDashboardPageRole("employer", "/employer/opportunity-credits");

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Jejak pemberi kesempatan"
        title="Ubah satu kredit menjadi 24 jam visibilitas"
        description="Kredit Kesempatan adalah manfaat produk, bukan uang, tidak dapat dipindahkan, dan digunakan satu kali untuk pekerjaan terbit milikmu."
      />

      <section
        aria-label="Ringkasan Kredit Kesempatan"
        className="grid border-y border-border/70 sm:grid-cols-3"
      >
        {summaries.map((summary, index) => {
          const Icon = summary.icon;
          return (
            <div
              key={summary.label}
              className={`grid grid-cols-[auto_1fr] gap-4 py-5 sm:px-6 ${
                index > 0 ? "border-t border-border/70 sm:border-l sm:border-t-0" : ""
              } ${index === 0 ? "sm:pl-0" : ""}`}
            >
              <Icon className="mt-1 size-4 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {summary.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                  {summary.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {summary.description}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/75 backdrop-blur-sm">
          <header className="border-b border-border/70 px-6 py-7 sm:px-8">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              Pilih sumber
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Kredit aktif
            </h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              Setiap kredit berasal dari satu Kesempatan Pertama yang selesai dan
              hanya dapat ditebus satu kali.
            </p>
          </header>

          <div className="px-6 py-7 sm:px-8">
            <RadioGroup
              defaultValue="credit-1"
              aria-label="Pilih kredit aktif"
              className="gap-0 border-y border-border/70"
            >
              {credits.map((credit, index) => (
                <Label
                  key={credit.id}
                  htmlFor={credit.id}
                  className={`group flex min-h-24 cursor-pointer items-center gap-4 px-1 py-5 transition-colors duration-300 hover:bg-muted/45 has-[[data-state=checked]]:bg-primary/5 ${
                    index > 0 ? "border-t border-border/70" : ""
                  }`}
                >
                  <RadioGroupItem id={credit.id} value={credit.id} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold tracking-[-0.01em]">
                      {credit.source}
                    </span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      {credit.earnedAt}
                    </span>
                  </span>
                  <StatusBadge status="success">Aktif</StatusBadge>
                </Label>
              ))}
            </RadioGroup>

            <div className="mt-8 grid gap-3 border-t border-border/70 pt-7 sm:grid-cols-[10rem_1fr] sm:items-center">
              <Label htmlFor="boost-job">Pekerjaan terbit</Label>
              <Select>
                <SelectTrigger id="boost-job" className="h-11 w-full">
                  <SelectValue placeholder="Pilih pekerjaan tanpa boost aktif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Kru Acara Akhir Pekan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <aside className="rounded-[1.75rem] bg-foreground p-6 text-background shadow-[0_28px_70px_-44px_rgb(15_23_42/0.7)] lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-background/70 uppercase">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Ringkasan boost
          </p>
          <p className="mt-5 text-5xl font-semibold tracking-[-0.06em]">24</p>
          <p className="mt-1 text-sm text-background/70">jam sejak aktivasi</p>

          <dl className="mt-6 divide-y divide-background/15 border-y border-background/15 text-sm">
            <div className="grid grid-cols-[1fr_auto] gap-4 py-4">
              <dt className="text-background/70">Digunakan</dt>
              <dd className="font-medium">1 kredit</dd>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 py-4">
              <dt className="text-background/70">Tujuan</dt>
              <dd className="font-medium">1 pekerjaan</dd>
            </div>
          </dl>

          <p className="mt-5 text-base leading-7 text-background/65">
            Waktu mulai dan selesai yang tepat ditampilkan setelah boost berhasil
            diaktifkan. Boost yang sudah aktif tidak dapat ditumpuk.
          </p>
          <div className="mt-6 [&>button]:w-full">
            <ConfirmAction
              triggerLabel="Gunakan 1 kredit"
              title="Aktifkan boost 24 jam?"
              description="Kredit dipakai tepat satu kali. Jika pekerjaan sudah memiliki boost aktif, permintaan ditolak tanpa menghabiskan kredit."
              confirmLabel="Aktifkan boost"
            />
          </div>
          <Link
            href="/employer/jobs/kru-acara-akhir-pekan"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-background/75 underline-offset-4 hover:text-background hover:underline"
          >
            Lihat pekerjaan <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
