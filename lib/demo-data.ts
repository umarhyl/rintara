export const demoJobs = [
  {
    id: "kru-acara-akhir-pekan",
    title: "Kru Acara Akhir Pekan",
    category: "Event Helper",
    employer: "Sinar Event Studio",
    area: "Bandung",
    publicLocation: "Sukajadi, Bandung",
    wage: "Rp200.000 / pekerjaan",
    date: "30 Juli 2026 · 09.00 WIB",
    duration: "Sekitar 4 jam",
    deadline: "29 Juli 2026 · 17.00 WIB",
    firstOpportunity: true,
    boosted: true,
    description:
      "Membantu persiapan acara komunitas kecil dengan tugas ringan dan arahan yang jelas.",
    tasks: [
      "Menata kursi ringan dan meja registrasi",
      "Menyiapkan tanda arah dan materi acara",
      "Membantu peserta di meja registrasi",
    ],
  },
  {
    id: "bersih-ruang-pertemuan",
    title: "Bantuan Bersih Ruang Pertemuan",
    category: "Light Cleaning",
    employer: "Ruang Bersama",
    area: "Bandung",
    publicLocation: "Coblong, Bandung",
    wage: "Rp150.000 / hari",
    date: "31 Juli 2026 · 08.00 WIB",
    duration: "Sekitar 3 jam",
    deadline: "30 Juli 2026 · 16.00 WIB",
    firstOpportunity: false,
    boosted: false,
    description:
      "Pembersihan ringan untuk ruang pertemuan setelah kegiatan komunitas.",
    tasks: ["Menyapu lantai", "Mengelap meja", "Merapikan kursi ringan"],
  },
  {
    id: "input-inventaris-sederhana",
    title: "Input Data Inventaris Sederhana",
    category: "Simple Administration",
    employer: "Toko Rintis Bersama",
    area: "Bandung",
    publicLocation: "Lengkong, Bandung",
    wage: "Rp175.000 / pekerjaan",
    date: "1 Agustus 2026 · 10.00 WIB",
    duration: "Sekitar 5 jam",
    deadline: "30 Juli 2026 · 20.00 WIB",
    firstOpportunity: true,
    boosted: false,
    description: "Memindahkan daftar inventaris cetak ke spreadsheet yang sudah disiapkan.",
    tasks: ["Memasukkan kode barang", "Memeriksa jumlah", "Menandai data yang tidak terbaca"],
  },
] as const;

export const demoApplications = [
  {
    id: "app-event",
    jobId: "kru-acara-akhir-pekan",
    jobTitle: "Kru Acara Akhir Pekan",
    employer: "Sinar Event Studio",
    status: "accepted",
    statusLabel: "Diterima",
    date: "Hari ini · 10.24 WIB",
    nextHref: "/worker/agreements/kesepakatan-kru-acara",
    nextLabel: "Tinjau kesepakatan",
  },
  {
    id: "app-cleaning",
    jobId: "bersih-ruang-pertemuan",
    jobTitle: "Bantuan Bersih Ruang Pertemuan",
    employer: "Ruang Bersama",
    status: "accepted",
    statusLabel: "Sedang berjalan",
    date: "Kemarin · 16.10 WIB",
    nextHref: "/worker/work/sesi-pekerjaan",
    nextLabel: "Lihat langkah kerja",
  },
] as const;

export const demoNotifications = [
  {
    id: "notification-1",
    title: "Lamaranmu diterima",
    body: "Sinar Event Studio memilihmu untuk Kru Acara Akhir Pekan.",
    time: "5 menit lalu",
    unread: true,
  },
  {
    id: "notification-2",
    title: "Konfirmasi Kesepakatan Kerja",
    body: "Baca seluruh ketentuan sebelum mengonfirmasi.",
    time: "20 menit lalu",
    unread: true,
  },
  {
    id: "notification-3",
    title: "Bukti Kerja diterbitkan",
    body: "Pengalaman Light Cleaning telah masuk ke Paspor Rintara.",
    time: "2 hari lalu",
    unread: false,
  },
] as const;

export const demoProofs = [
  {
    id: "proof-1",
    category: "Light Cleaning",
    jobTitle: "Bantuan Bersih Ruang Pertemuan",
    employer: "Ruang Bersama",
    area: "Bandung",
    completedAt: "17 Juli 2026",
    status: "verified",
  },
] as const;

export const demoApplicants = [
  {
    id: "ayu",
    name: "Ayu Pratama",
    area: "Bandung",
    eligible: true,
    proofCount: 1,
    note: "Saya terbiasa membantu kegiatan kampus dan siap mengikuti arahan panitia.",
  },
  {
    id: "bima",
    name: "Bima Saputra",
    area: "Bandung",
    eligible: true,
    proofCount: 0,
    note: "Saya tersedia sesuai jadwal dan dapat datang 30 menit lebih awal.",
  },
] as const;
