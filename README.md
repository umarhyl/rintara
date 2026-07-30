# Rintara

**Rintara** adalah platform kerja informal lokal yang membantu pekerja memperoleh
kesempatan pertama, menjalani pekerjaan dengan ketentuan yang jelas, dan
membangun riwayat kerja terverifikasi.

Rintara menjawab masalah yang sering dialami pekerja pemula:

> Pekerja membutuhkan pengalaman agar dipercaya, tetapi membutuhkan kepercayaan
> untuk mendapatkan pengalaman pertama.

Melalui Rintara, pemberi kerja dapat menerbitkan pekerjaan dengan tugas, jadwal,
area, upah, serta ketentuan pembayaran yang terlihat sejak awal. Setelah
pekerjaan selesai dan diverifikasi, sistem menerbitkan **Bukti Kerja** ke
**Paspor Rintara** milik pekerja.

## Akses Aplikasi

- Website: [https://rintara-app.vercel.app](https://rintara-app.vercel.app)
- Repositori: [https://github.com/umarhyl/rintara](https://github.com/umarhyl/rintara)

## Alur Utama MVP

```text
Pemberi kerja menerbitkan pekerjaan
→ pekerja yang memenuhi syarat mengirim lamaran
→ pemberi kerja menerima tepat satu pekerja
→ kedua pihak mengonfirmasi Mini Agreement
→ pekerja melakukan check-in
→ pekerja mengunggah satu foto hasil dan melakukan check-out
→ pemberi kerja memverifikasi penyelesaian
→ Rintara menerbitkan satu Bukti Kerja
→ pemberi kerja yang memenuhi syarat memperoleh Kredit Kesempatan
→ Kredit Kesempatan digunakan untuk meningkatkan visibilitas pekerjaan selama 24 jam
```

## Fitur

### Untuk pekerja

- Registrasi, masuk, pemulihan kata sandi, dan pemilihan peran.
- Profil pekerja dengan area domisili, biografi, ketersediaan, dan kategori
  minat.
- Pencarian pekerjaan berdasarkan kata kunci, area, kategori, rentang upah, dan
  Kesempatan Pertama.
- Informasi tugas, jadwal, durasi, upah, dan area umum sebelum melamar.
- Pengiriman satu lamaran singkat tanpa penawaran upah.
- Konfirmasi Mini Agreement setelah diterima.
- Check-in menggunakan kode sekali pakai dari pemberi kerja.
- Unggah satu foto hasil pekerjaan secara privat sebelum check-out.
- Paspor Rintara yang dibentuk dari Bukti Kerja terverifikasi.
- Riwayat lamaran, notifikasi, dan laporan masalah.

### Untuk pemberi kerja

- Profil usaha atau pemberi kerja.
- Pembuatan draf dan penerbitan pekerjaan dengan ketentuan transparan.
- Pemisahan area umum dan alamat lengkap yang bersifat privat.
- Validasi upah berdasarkan Panduan Upah.
- Peninjauan pelamar dan konteks Paspor Rintara yang diizinkan.
- Penerimaan tepat satu pekerja secara transaksional.
- Konfirmasi Mini Agreement dan pengelolaan sesi kerja.
- Pembuatan kode check-in dengan masa berlaku 15 menit.
- Peninjauan foto hasil dan verifikasi penyelesaian pekerjaan.
- Kredit Kesempatan dan peningkatan visibilitas pekerjaan selama 24 jam.

### Untuk administrator

- Pengelolaan area percontohan, kategori pekerjaan, dan Panduan Upah.
- Peninjauan pekerjaan, pengguna, dan laporan.
- Moderasi pekerjaan dan akun melalui tindakan yang tercatat.
- Pencabutan Bukti Kerja, Kredit Kesempatan, atau peningkatan visibilitas jika
  ditemukan pelanggaran.
- Riwayat audit untuk operasi penting.

## Akun Demo

Gunakan sesi atau profil peramban yang berbeda untuk akun pekerja, pemberi
kerja, dan administrator agar alur dapat diuji tanpa saling mengganti sesi.

| Peran | Email | Kegunaan |
| --- | --- | --- |
| Administrator | `admin@admin.com:admin` | Mengelola area, kategori, Panduan Upah, dan moderasi |
| Pemberi kerja | `employer@employer.com:employer` | Membuat pekerjaan, meninjau lamaran, dan memverifikasi pekerjaan |
| Pekerja | `worker@worker.com:worker123` | Mencari pekerjaan, melamar, dan menyelesaikan pekerjaan |

## Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Antarmuka web | Next.js App Router, React, TypeScript, Tailwind CSS |
| Validasi | Zod |
| Basis data | Supabase Managed PostgreSQL |
| Akses data | Drizzle ORM dan SQL terparameterisasi |
| Autentikasi | Supabase Auth dengan integrasi SSR |
| Penyimpanan foto privat | Supabase Storage |
| Deployment | Vercel |
| Pengujian | Unit test dan integration test dengan PostgreSQL |
| Otomasi kualitas | GitHub Actions |

Rintara menggunakan arsitektur **modular monolith**: satu aplikasi Next.js dan
satu PostgreSQL sebagai sumber data utama. Aturan bisnis berada di lapisan
server dan dipanggil melalui operasi bernama, bukan perubahan status bebas dari
antarmuka.

## Struktur Repositori

```text
.
├── app/          # Route, halaman, layout, loading, dan error boundary
├── components/   # Komponen antarmuka bersama
├── features/     # Komponen yang dikelompokkan berdasarkan fitur
├── server/       # Autentikasi, query, aturan domain, dan akses data
├── drizzle/      # Migrasi PostgreSQL
├── tests/        # Unit test dan integration test PostgreSQL
├── docs/         # Dokumentasi produk, desain, teknik, dan operasional
└── public/       # Aset publik aplikasi
```

Dokumentasi lengkap tersedia di [docs/README.md](./docs/README.md).

## Menjalankan Secara Lokal

Rintara menggunakan Bun 1.3.14 sesuai deklarasi pada `package.json` dan
`bun.lock`.

```bash
bun install --frozen-lockfile
cp .env.example .env.local
bun run db:migrate
bun run dev
```

Perintah pemeriksaan yang tersedia:

```bash
bun run lint
bun run typecheck
bun run test
bun run test:integration
bun run db:check
bun run build
```

## Dokumentasi Utama

| Topik | Dokumen |
| --- | --- |
| Ruang lingkup produk | [PRD](./docs/product/PRD.md) |
| Persyaratan fungsional | [Requirements](./docs/product/REQUIREMENTS.md) |
| Aturan bisnis | [Business Rules](./docs/product/BUSINESS_RULES.md) |
| Alur pengguna | [User Flow](./docs/product/USER_FLOW.md) |
| Desain UI/UX | [UI/UX Design](./docs/design/UI_UX_DESIGN.md) |
| Arsitektur | [Architecture](./docs/engineering/ARCHITECTURE.md) |
| Basis data | [Database](./docs/engineering/DATABASE.md) |
| Kontrak aplikasi | [API](./docs/engineering/API.md) |
