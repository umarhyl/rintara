import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  MapPin,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { ConfirmAction } from "@/components/rintara/confirm-action";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const facts = [
  {
    label: "Pelamar",
    value: "2 orang",
    detail: "Keduanya memenuhi syarat kategori",
    icon: UsersRound,
  },
  {
    label: "Batas lamaran",
    value: "29 Juli",
    detail: "17.00 WIB",
    icon: CalendarDays,
  },
  {
    label: "Area publik",
    value: "Sukajadi, Bandung",
    detail: "Alamat lengkap tetap privat",
    icon: MapPin,
  },
];

export default async function EmployerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboardPageRole(
    "employer",
    `/employer/jobs/${encodeURIComponent(id)}`,
  );
  if (id !== "kru-acara-akhir-pekan") notFound();

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Pekerjaan terbit"
        title="Kru Acara Akhir Pekan"
        description="Ketentuan yang sudah diterbitkan tidak dapat diedit. Perubahan dilakukan dengan membatalkan pekerjaan dan membuat draft baru."
        action={<StatusBadge status="success">Menerima lamaran</StatusBadge>}
      />

      <section
        aria-label="Ringkasan pekerjaan"
        className="grid border-y border-border/70 sm:grid-cols-3"
      >
        {facts.map((fact, index) => {
          const Icon = fact.icon;
          return (
            <div
              key={fact.label}
              className={`grid grid-cols-[auto_1fr] gap-4 py-5 sm:px-6 ${
                index > 0 ? "border-t border-border/70 sm:border-l sm:border-t-0" : ""
              } ${index === 0 ? "sm:pl-0" : ""}`}
            >
              <Icon className="mt-1 size-4 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {fact.label}
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">
                  {fact.value}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{fact.detail}</p>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <article className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/75 backdrop-blur-sm">
          <div className="grid gap-6 border-b border-border/70 px-6 py-7 sm:grid-cols-[1fr_auto] sm:items-end sm:px-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Upah tetap
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Rp200.000
              </p>
              <p className="mt-1 text-sm text-muted-foreground">per pekerjaan</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              Ketentuan terkunci setelah diterima
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[0.78fr_1.22fr]">
            <section>
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                Waktu & kategori
              </p>
              <dl className="mt-4 divide-y divide-border/70 border-y border-border/70">
                <div className="py-4">
                  <dt className="text-sm text-muted-foreground">Jadwal</dt>
                  <dd className="mt-1 font-medium">
                    30 Juli 2026
                    <span className="block text-sm font-normal text-muted-foreground">
                      09.00–13.00 WIB
                    </span>
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm text-muted-foreground">Kategori</dt>
                  <dd className="mt-1 font-medium">Event Helper</dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm text-muted-foreground">Jenis kesempatan</dt>
                  <dd className="mt-1 font-medium">Kesempatan Pertama</dd>
                </div>
              </dl>
            </section>

            <section>
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                Ruang lingkup
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Tugas yang disepakati
              </h2>
              <ol className="mt-6 border-l border-primary/25 pl-6">
                {[
                  "Menata kursi ringan dan meja registrasi",
                  "Menyiapkan tanda arah",
                  "Membantu peserta di meja registrasi",
                ].map((task, index) => (
                  <li key={task} className="relative pb-6 last:pb-0">
                    <span
                      className="absolute -left-[1.78rem] top-1.5 size-2.5 rounded-full border-2 border-card bg-primary"
                      aria-hidden="true"
                    />
                    <span className="mr-3 text-xs text-muted-foreground">
                      0{index + 1}
                    </span>
                    <span className="leading-7">{task}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </article>

        <aside className="rounded-[1.75rem] bg-foreground p-6 text-background shadow-[0_28px_70px_-44px_rgb(15_23_42/0.7)] lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-background/70 uppercase">
            <Eye className="size-4" aria-hidden="true" />
            Tindakan utama
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
            Pilih satu pekerja
          </h2>
          <p className="mt-2 text-base leading-7 text-background/65">
            Baca catatan dan ringkasan Paspor sebelum menerima satu pelamar.
          </p>
          <Button
            className="mt-6 w-full bg-background text-foreground shadow-none hover:bg-background/90"
            asChild
          >
            <Link href="/employer/jobs/kru-acara-akhir-pekan/applicants">
              Tinjau 2 pelamar <ArrowRight />
            </Link>
          </Button>
          <Button
            variant="outline"
            className="mt-3 w-full border-background/20 bg-transparent text-background hover:border-background/35 hover:bg-background/10 hover:text-background"
            asChild
          >
            <Link href="/jobs/kru-acara-akhir-pekan">Lihat halaman publik</Link>
          </Button>

          <div className="mt-7 border-t border-background/15 pt-5">
            <p className="text-xs leading-5 text-background/70">
              Membatalkan pekerjaan akan menutup lamaran yang masih aktif.
            </p>
            <div className="mt-3 [&>button]:w-full">
              <ConfirmAction
                triggerLabel="Batalkan pekerjaan"
                title="Batalkan pekerjaan ini?"
                description="Pekerjaan tidak lagi menerima lamaran. Untuk pekerjaan yang sudah terisi atau berjalan, gunakan alur pembatalan yang berwenang."
                confirmLabel="Ya, batalkan"
                destructive
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
