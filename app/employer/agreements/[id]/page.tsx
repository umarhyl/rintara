import type { LucideIcon } from "lucide-react";
import { notFound } from "next/navigation";
import {
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  LockKeyhole,
  UsersRound,
} from "lucide-react";

import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { requireDashboardPageRole } from "@/server/auth/page-access";

type AgreementItem = {
  label: string;
  value: string;
};

function AgreementSection({
  index,
  title,
  icon: Icon,
  items,
}: {
  index: string;
  title: string;
  icon: LucideIcon;
  items: AgreementItem[];
}) {
  return (
    <section className="grid gap-5 border-b border-border/70 px-6 py-8 last:border-b-0 sm:px-8 lg:grid-cols-[10rem_1fr] lg:gap-10">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <Icon className="size-4" aria-hidden="true" />
          {index}
        </p>
        <h2 className="mt-3 text-lg font-semibold tracking-[-0.02em]">{title}</h2>
      </div>
      <dl className="divide-y divide-border/70 border-y border-border/70">
        {items.map((item) => (
          <div
            key={item.label}
            className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-5"
          >
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="leading-6">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function EmployerAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboardPageRole(
    "employer",
    `/employer/agreements/${encodeURIComponent(id)}`,
  );
  if (id !== "kesepakatan-kru-acara") notFound();

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Mini Agreement"
        title="Kesepakatan dengan Ayu Pratama"
        description="Ketentuan ini dibuat ketika satu pelamar diterima. Isinya tetap dan hanya dapat dibuka oleh kedua pihak serta admin yang berwenang."
        action={<StatusBadge status="warning">Menunggu konfirmasi</StatusBadge>}
      />

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/80 shadow-[0_24px_70px_-56px_rgb(15_23_42/0.5)] backdrop-blur-sm">
          <header className="grid gap-5 border-b border-border/70 px-6 py-7 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Dokumen kesepakatan
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Kru Acara Akhir Pekan
              </h2>
            </div>
            <p className="flex max-w-xs items-center gap-2 text-base leading-7 text-muted-foreground">
              <LockKeyhole className="size-4 shrink-0 text-primary" aria-hidden="true" />
              Alamat lengkap dilindungi dalam konteks privat ini.
            </p>
          </header>

          <AgreementSection
            index="01"
            title="Para pihak"
            icon={UsersRound}
            items={[
              { label: "Pemberi kerja", value: "Sinar Event Studio" },
              { label: "Pekerja", value: "Ayu Pratama" },
              { label: "Jenis", value: "Kesempatan Pertama · Event Helper" },
            ]}
          />
          <AgreementSection
            index="02"
            title="Pekerjaan & lokasi"
            icon={BriefcaseBusiness}
            items={[
              {
                label: "Ruang lingkup",
                value:
                  "Menata kursi ringan dan meja registrasi, menyiapkan tanda arah, serta membantu peserta di meja registrasi.",
              },
              { label: "Area umum", value: "Sukajadi, Bandung" },
              {
                label: "Akses lokasi",
                value:
                  "Alamat lengkap ditampilkan setelah hubungan kesepakatan terverifikasi.",
              },
              {
                label: "Peralatan",
                value: "Meja registrasi dan alat tulis disediakan pemberi kerja.",
              },
            ]}
          />
          <AgreementSection
            index="03"
            title="Waktu"
            icon={CalendarClock}
            items={[
              { label: "Jadwal", value: "30 Juli 2026 · 09.00–13.00 WIB" },
              { label: "Durasi", value: "Sekitar 4 jam" },
            ]}
          />
          <AgreementSection
            index="04"
            title="Upah & ketentuan"
            icon={Banknote}
            items={[
              { label: "Upah", value: "Rp200.000 / pekerjaan" },
              {
                label: "Pembayaran",
                value:
                  "Transfer bank, maksimal 1 hari setelah pekerjaan diverifikasi. Pembayaran dilakukan di luar Rintara.",
              },
              {
                label: "Pembatalan",
                value:
                  "Ketentuan tidak dapat diedit. Masalah atau pembatalan diproses melalui alur yang berwenang.",
              },
            ]}
          />
        </article>

        <aside className="rounded-[1.75rem] bg-foreground p-6 text-background shadow-[0_28px_70px_-44px_rgb(15_23_42/0.7)] xl:sticky xl:top-24">
          <p className="text-xs font-semibold tracking-[0.14em] text-background/70 uppercase">
            Status konfirmasi
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
            Aktif setelah keduanya setuju
          </h2>

          <ol className="relative mt-6 grid gap-6 before:absolute before:bottom-3 before:left-[0.34rem] before:top-3 before:w-px before:bg-background/20 before:content-['']">
            <li className="relative grid grid-cols-[0.75rem_1fr] gap-3">
              <span className="mt-1 grid size-3 place-items-center rounded-full bg-success text-success-foreground ring-2 ring-background"><Check className="size-2" aria-hidden="true" /></span>
              <div>
                <p className="font-medium">Sinar Event Studio</p>
                <p className="mt-0.5 text-sm text-background/70">Dikonfirmasi 19 Juli 2026 · 09.10 WIB</p>
              </div>
            </li>
            <li className="relative grid grid-cols-[0.75rem_1fr] gap-3">
              <span className="mt-1 size-3 rounded-full border border-background/35 bg-foreground" />
              <div>
                <p className="font-medium">Ayu Pratama</p>
                <p className="mt-0.5 text-sm text-background/70">Belum dikonfirmasi</p>
              </div>
            </li>
          </ol>

          <p className="mt-6 border-t border-background/15 pt-5 text-base leading-7 text-background/65">
            Konfirmasi dicatat satu kali beserta waktunya. Baca seluruh ketentuan
            sebelum melanjutkan.
          </p>
          <Button variant="outline" className="mt-5 w-full border-background/20 bg-transparent text-background" disabled>
            <Check aria-hidden="true" /> Sudah dikonfirmasi
          </Button>
          <p className="mt-3 text-sm leading-6 text-background/70">Langkah kerja terbuka setelah Ayu juga mengonfirmasi.</p>
        </aside>
      </div>
    </div>
  );
}
