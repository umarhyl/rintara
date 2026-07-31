"use client";

import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PolicyKind = "terms" | "privacy";

const documents = {
  terms: {
    trigger: "Ketentuan Penggunaan",
    title: "Ketentuan Penggunaan Rintara",
    description: "Ketentuan untuk menggunakan akun dan alur kerja Rintara.",
    sections: [
      {
        title: "1. Tentang Rintara",
        paragraphs: [
          "Rintara membantu Pekerja dan Pemberi Kerja menjalankan pekerjaan lokal dengan ketentuan yang terlihat, Mini Agreement, catatan kehadiran, dan Bukti Kerja.",
          "Rintara bukan pemberi kerja, agen tenaga kerja, penyedia escrow, atau pemroses pembayaran. Pembayaran dilakukan langsung di luar Rintara.",
        ],
      },
      {
        title: "2. Akun dan informasi",
        paragraphs: [
          "Kamu harus memberikan informasi yang benar, menjaga keamanan akun, dan menggunakan satu peran aktif sebagai Pekerja atau Pemberi Kerja.",
          "Jangan membagikan kata sandi, kode check-in, atau akses akun kepada orang lain. Aktivitas yang dilakukan melalui akun menjadi tanggung jawab pemilik akun selama tidak dilaporkan sebagai akses tanpa izin.",
        ],
      },
      {
        title: "3. Pekerjaan dan Mini Agreement",
        paragraphs: [
          "Pemberi Kerja wajib menerbitkan tugas, jadwal, area, upah, serta cara dan waktu pembayaran yang jelas. Pekerjaan berisiko tinggi atau membutuhkan lisensi tidak boleh diterbitkan dalam alur MVP.",
          "Pekerja harus membaca ketentuan sebelum melamar. Ketika satu Pekerja diterima, Rintara membuat snapshot Mini Agreement yang dikonfirmasi kedua pihak dan tidak dapat diedit sebagai catatan kesepakatan.",
        ],
      },
      {
        title: "4. Kehadiran, hasil, dan Bukti Kerja",
        paragraphs: [
          "Kode check-in hanya digunakan oleh Pekerja yang diterima. Pekerja mengunggah satu foto hasil privat sebelum check-out dan wajib memastikan foto tidak memuat orang, dokumen, atau informasi pribadi.",
          "Bukti Kerja diterbitkan setelah Pemberi Kerja memverifikasi penyelesaian melalui alur Rintara. Rintara mencatat proses tersebut tetapi tidak menjamin kualitas, keamanan, atau hasil pekerjaan di luar informasi yang tersedia pada platform.",
        ],
      },
      {
        title: "5. Pembayaran di luar Rintara",
        paragraphs: [
          "Rintara tidak menyimpan, memindahkan, menjamin, atau menyelesaikan sengketa dana. Untuk pekerjaan tunai yang telah selesai, Rintara hanya mencatat pernyataan Pemberi Kerja bahwa uang diberikan dan jawaban Pekerja tentang penerimaan.",
          "Permintaan penerimaan tunai yang tidak dijawab selama 48 jam dapat dicatat sebagai dikonfirmasi otomatis. Catatan tersebut bukan bukti independen bahwa pembayaran benar-benar terjadi dan Pekerja tetap dapat melaporkan belum menerima.",
        ],
      },
      {
        title: "6. Perilaku, laporan, dan pembatasan akun",
        paragraphs: [
          "Dilarang menggunakan Rintara untuk penipuan, spam, pelecehan, pekerjaan ilegal, manipulasi Bukti Kerja, atau akses terhadap data milik akun lain.",
          "Rintara dapat menyembunyikan pekerjaan, meninjau laporan, membatasi akun, atau mencabut catatan/reward melalui alur moderasi yang diaudit apabila diperlukan untuk keamanan dan integritas platform.",
        ],
      },
      {
        title: "7. Perubahan ketentuan",
        paragraphs: [
          "Ketentuan ini dapat diperbarui ketika layanan atau kewajiban operasional berubah. Versi yang berlaku akan ditampilkan di Rintara. Perubahan material akan disampaikan melalui sarana yang tersedia sebelum diberlakukan bila diperlukan.",
        ],
      },
    ],
  },
  privacy: {
    trigger: "Kebijakan Privasi",
    title: "Kebijakan Privasi Rintara",
    description: "Ringkasan data yang digunakan dan cara Rintara melindunginya.",
    sections: [
      {
        title: "1. Data yang kami gunakan",
        paragraphs: [
          "Rintara menggunakan email untuk autentikasi, peran dan status akun, nama tampilan, area umum, informasi profil, pekerjaan, lamaran, Mini Agreement, kehadiran, laporan, notifikasi, dan catatan audit.",
          "Alamat lengkap pekerjaan disimpan terpisah dari informasi publik. Satu foto hasil pekerjaan disimpan secara privat dan dinormalisasi untuk membuang metadata tertanam.",
        ],
      },
      {
        title: "2. Data yang tidak kami minta",
        paragraphs: [
          "Rintara tidak meminta dokumen identitas pemerintah, rekening bank, kartu pembayaran, lokasi GPS terus-menerus, percakapan privat, atau bukti transfer.",
          "Jangan memasukkan kata sandi, nomor rekening, nomor kartu, kode check-in, atau informasi rahasia lain ke kolom bebas, laporan, maupun foto hasil.",
        ],
      },
      {
        title: "3. Tujuan penggunaan",
        paragraphs: [
          "Data digunakan untuk membuat dan menjaga akun, menampilkan pekerjaan, menjalankan lamaran dan Mini Agreement, melindungi alamat privat, mencatat kehadiran dan penyelesaian, menerbitkan Bukti Kerja, mengirim notifikasi dalam aplikasi, serta menangani laporan dan keamanan.",
          "Catatan konfirmasi pembayaran tunai hanya digunakan untuk menampilkan pernyataan para pihak setelah pekerjaan selesai; Rintara tidak menggunakannya untuk memproses dana.",
        ],
      },
      {
        title: "4. Siapa yang dapat melihat",
        paragraphs: [
          "Informasi pekerjaan publik hanya memuat data yang diizinkan, termasuk area umum. Alamat lengkap hanya tersedia bagi Pemberi Kerja pemilik, Pekerja yang diterima melalui konteks Mini Agreement, dan Admin berwenang.",
          "Foto hasil hanya tersedia bagi Pekerja terkait, Pemberi Kerja terkait, dan Admin berwenang. Pengguna lain tidak dapat melihat lamaran, notifikasi, laporan, atau data ruang kerja milik akun lain.",
        ],
      },
      {
        title: "5. Penyedia layanan dan keamanan",
        paragraphs: [
          "Rintara menggunakan penyedia infrastruktur yang disetujui untuk hosting aplikasi, autentikasi, basis data, dan penyimpanan privat. Akses dibatasi sesuai kebutuhan layanan dan konfigurasi setiap lingkungan dipisahkan.",
          "Kami menggunakan kontrol akses server, koneksi aman, validasi input, audit, dan pembatasan data. Namun, tidak ada sistem internet yang sepenuhnya bebas risiko; segera laporkan dugaan akses tanpa izin melalui kanal resmi operator Rintara.",
        ],
      },
      {
        title: "6. Penyimpanan dan pilihanmu",
        paragraphs: [
          "Catatan lifecycle, Bukti Kerja, moderasi, dan audit dipertahankan dengan status, pembatalan, atau pencabutan agar riwayat tidak diperbaiki secara destruktif. Periode penyimpanan operasional ditetapkan sesuai kebutuhan pilot dan kewajiban yang berlaku.",
          "Kamu dapat memperbarui informasi profil yang memang dapat diedit. Untuk pertanyaan, koreksi data yang tidak tersedia di profil, atau permintaan privasi, gunakan kanal resmi operator Rintara pada lingkungan tempat akun dibuat.",
        ],
      },
      {
        title: "7. Cookie dan sesi",
        paragraphs: [
          "Rintara menggunakan cookie sesi yang diperlukan untuk menjaga autentikasi dan keamanan akun. Rintara tidak memerlukan cookie iklan untuk menjalankan alur MVP.",
        ],
      },
    ],
  },
} as const;

export function RegistrationPolicyDialog({ kind }: { kind: PolicyKind }) {
  const document = documents[kind];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:text-primary/80 focus-visible:ring-3 focus-visible:ring-ring/25"
        >
          {document.trigger}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeader className="border-b border-border bg-popover px-5 py-4 sm:px-8">
          <div className="flex items-start gap-3">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/25"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Kembali
              </button>
            </DialogClose>
            <div className="min-w-0 pt-2">
              <DialogTitle className="text-lg leading-6 sm:text-xl">
                {document.title}
              </DialogTitle>
              <DialogDescription className="mt-1 leading-5">
                {document.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <article className="overflow-y-auto overscroll-contain px-5 py-7 sm:px-8 sm:py-9">
          <p className="text-sm font-medium text-muted-foreground">
            Berlaku mulai 31 Juli 2026
          </p>
          <div className="mt-7 grid gap-8">
            {document.sections.map((section, index) => {
              const headingId = `${kind}-section-${index + 1}`;

              return (
              <section key={section.title} aria-labelledby={headingId}>
                <h2
                  id={headingId}
                  className="text-xl font-semibold tracking-[-0.015em]"
                >
                  {section.title}
                </h2>
                <div className="mt-3 grid gap-3 text-base leading-7 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
              );
            })}
          </div>
          <p className="mt-10 border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
            Tekan Esc, pilih Kembali, atau klik area di luar dokumen untuk menutup.
          </p>
        </article>
      </DialogContent>
    </Dialog>
  );
}
