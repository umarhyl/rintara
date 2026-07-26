import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  FileSignature,
  LockKeyhole,
  Search,
} from "lucide-react";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Mengapa Rintara",
  description:
    "Pelajari bagaimana Rintara menjaga ketentuan kerja, privasi alamat, Mini Agreement, Bukti Kerja, dan Kredit Kesempatan.",
};

const stages = [
  {
    icon: Search,
    title: "Sebelum melamar",
    description:
      "Keputusan dimulai dari informasi pekerjaan yang dapat dibandingkan.",
    facts: [
      "Tugas, jadwal, durasi, area umum, upah, serta cara dan waktu pembayaran terlihat sebelum lamaran dikirim.",
      "Upah ditetapkan pada pekerjaan. Pekerja mengirim catatan singkat tanpa mengajukan harga atau menawar upah.",
      "Alamat lengkap tidak masuk ke informasi publik dan tetap privat sampai satu pekerja diterima.",
    ],
  },
  {
    icon: FileSignature,
    title: "Ketika satu pekerja diterima",
    description:
      "Kedua pihak bekerja dari catatan ketentuan yang sama.",
    facts: [
      "Satu pekerjaan menerima tepat satu pekerja dalam alur Rintara.",
      "Penerimaan membuat snapshot Mini Agreement dari ketentuan pekerjaan dan lamaran yang dipilih.",
      "Mini Agreement dikonfirmasi oleh pekerja dan pemberi kerja, lalu tidak dapat diedit sebagai catatan kesepakatan.",
    ],
  },
  {
    icon: BadgeCheck,
    title: "Setelah pekerjaan selesai",
    description:
      "Riwayat lahir dari penyelesaian yang tercatat, bukan klaim profil.",
    facts: [
      "Setelah check-in, check-out, dan verifikasi penyelesaian oleh pemberi kerja, sistem menerbitkan satu Bukti Kerja.",
      "Paspor Rintara dibaca dari Bukti Kerja yang diterbitkan sistem dan bukan konten yang dapat ditulis sendiri.",
      "Penyelesaian Kesempatan Pertama yang memenuhi syarat dapat menerbitkan satu Kredit Kesempatan untuk meningkatkan satu pekerjaan terbit selama 24 jam.",
    ],
  },
] as const;

export default function WhyRintaraPage() {
  return (
    <PublicShell>
      <template
        data-rintara-direction
        dangerouslySetInnerHTML={{
          __html:
            "<!-- THESIS: alasan memilih Rintara terlihat dalam rantai aturan dan bukti, bukan janji pemasaran. OWN-WORLD: satu bidang Forest menjadi ringkasan batas produk, sementara dokumen putih bertahap memakai tipografi tegas dan hijau tonal tanpa deretan kartu promosi. STORY: pembaca memahami apa yang terlihat sebelum melamar, apa yang dikunci saat diterima, dan apa yang diterbitkan setelah selesai. FIRST VIEWPORT: pernyataan utama berada di kiri dan ringkasan ketentuan-ke-bukti berada di kanan sebelum tiga tahap terurai. FORM: dokumen kepercayaan marketplace dalam dunia visual Rintara yang sudah mapan; seed a29a8bd0. -->",
        }}
      />

      <header className="bg-[#edf3ee]">
        <div className="mx-auto grid w-full max-w-[80rem] gap-8 px-4 py-11 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)] lg:items-end lg:px-8 lg:py-14">
          <div>
            <h1 className="max-w-[14ch] text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Ketentuan jelas. Hasil menjadi bukti.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Rintara menghubungkan informasi sebelum lamaran, kesepakatan yang
              dikonfirmasi, dan riwayat kerja yang diterbitkan sistem.
            </p>
          </div>

          <div className="rounded-xl bg-[#143d24] p-6 text-white sm:p-7">
            <p className="text-base font-semibold text-[#def4c6]">
              Batas yang dijaga Rintara
            </p>
            <p className="mt-3 max-w-2xl text-xl font-semibold leading-8 tracking-[-0.015em]">
              Ketentuan terbuka sebelum keputusan, alamat lengkap tetap privat,
              dan Bukti Kerja hanya terbit melalui alur penyelesaian.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[80rem] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:px-8 lg:py-16">
        <aside className="rounded-xl bg-[#e5f1e8] p-5 sm:p-6 lg:sticky lg:top-24">
          <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-semibold tracking-[-0.015em]">
            Data mengikuti kebutuhan alur
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Informasi publik hanya memuat area umum. Alamat lengkap tersedia
            kepada pihak yang berwenang setelah satu pekerja diterima.
          </p>
          <Button variant="outline" className="mt-6 w-full bg-white/75" asChild>
            <Link href="/how-it-works">
              Lihat cara kerja
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </aside>

        <section aria-labelledby="why-stages-heading">
          <h2
            id="why-stages-heading"
            className="text-3xl font-semibold tracking-[-0.025em]"
          >
            Dari keputusan sampai riwayat kerja
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Tiga tahap ini menjelaskan bagian yang dicatat dan konsekuensi yang
            terlihat bagi pekerja maupun pemberi kerja.
          </p>

          <ol className="mt-8 overflow-hidden rounded-xl bg-white shadow-[0_22px_55px_-48px_rgb(27_81_45/0.7)]">
            {stages.map((stage, index) => {
              const Icon = stage.icon;

              return (
                <li
                  key={stage.title}
                  className="grid gap-6 px-5 py-8 sm:px-8 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8 md:py-10 [&+&]:border-t"
                >
                  <div>
                    <span className="grid size-10 place-items-center rounded-lg bg-[#def4c6] text-[#1b512d]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-primary">
                      Tahap {index + 1}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold tracking-[-0.015em]">
                      {stage.title}
                    </h3>
                  </div>

                  <div>
                    <p className="text-lg font-semibold leading-7">
                      {stage.description}
                    </p>
                    <ul className="mt-5 grid gap-4">
                      {stage.facts.map((fact) => (
                        <li
                          key={fact}
                          className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 text-base leading-7 text-muted-foreground"
                        >
                          <BadgeCheck
                            className="mt-1 size-4 text-primary"
                            aria-hidden="true"
                          />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 grid gap-5 rounded-xl bg-[#def4c6] p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:p-6">
            <span className="grid size-10 place-items-center rounded-lg bg-white/75 text-[#1b512d]">
              <ExternalLink className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.015em] text-[#1b512d]">
                Pembayaran tetap dilakukan di luar Rintara
              </h2>
              <p className="mt-2 text-base leading-7 text-[#1b512d]/80">
                Cara dan waktu pembayaran dicatat dalam ketentuan, tetapi
                pembayaran dilakukan langsung oleh kedua pihak. Rintara tidak
                menyimpan rekening, kartu, atau dana pembayaran.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/jobs">
                Cari pekerjaan
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Buat akun Rintara</Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
