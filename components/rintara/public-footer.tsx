import Link from "next/link";
import { RintaraLogo } from "@/components/rintara/logo";

const footerGroups = [
  {
    title: "Jelajahi",
    links: [
      { href: "/jobs", label: "Cari pekerjaan" },
      {
        href: "/jobs?opportunity=first",
        label: "Kesempatan Pertama",
      },
      { href: "/categories", label: "Kategori dan wilayah" },
    ],
  },
  {
    title: "Pelajari",
    links: [
      {
        href: "/for-workers",
        label: "Untuk pekerja",
      },
      {
        href: "/for-employers",
        label: "Untuk pemberi kerja",
      },
      { href: "/how-it-works", label: "Cara kerja Rintara" },
      { href: "/why-rintara", label: "Mengapa Rintara" },
    ],
  },
  {
    title: "Akun",
    links: [
      { href: "/sign-in", label: "Masuk" },
      { href: "/register", label: "Daftar" },
      { href: "/account/continue", label: "Buka ruang kerja" },
    ],
  },
] as const;

export function PublicFooter() {
  return (
    <footer className="bg-[#143d24] text-white">
      <div className="mx-auto grid max-w-[80rem] gap-10 px-4 py-11 sm:px-6 md:grid-cols-[minmax(18rem,1.3fr)_2fr] lg:px-8 lg:py-14">
        <div className="max-w-md">
          <RintaraLogo tone="inverse" />
          <p className="mt-3 text-base leading-7 text-white/68">
            Pekerjaan lokal dengan ketentuan terbuka dan jejak kerja yang diterbitkan sistem.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-semibold text-white">
                {group.title}
              </h2>
              <ul className="mt-3 grid gap-1">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="inline-flex min-h-11 items-center text-sm font-medium text-white/68 outline-none transition-colors duration-150 hover:text-[#def4c6] focus-visible:ring-3 focus-visible:ring-white/35"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[80rem] px-4 pb-8 sm:px-6 lg:px-8">
        <p className="text-sm leading-6 text-white/68">
          © 2026 Rintara. Pembayaran dilakukan langsung di luar platform. Rintara tidak menyimpan rekening atau kartu.
        </p>
      </div>
    </footer>
  );
}
