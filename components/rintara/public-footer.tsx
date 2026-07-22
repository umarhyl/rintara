import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { RintaraLogo } from "@/components/rintara/logo";

const footerLinks = [
  { href: "/jobs", label: "Cari kerja" },
  { href: "/first-opportunity", label: "Kesempatan Pertama" },
  { href: "/how-it-works", label: "Cara kerja" },
  { href: "/sign-in", label: "Masuk" },
] as const;

export function PublicFooter() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-[#071020] text-white">
      <AmbientBackdrop variant="dashboard" className="opacity-70" />
      <div className="reveal-on-scroll relative mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div>
          <RintaraLogo className="[&>span:last-child]:text-white" />
          <p className="mt-9 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">
            Setiap pekerjaan layak meninggalkan <span className="font-serif font-normal italic text-blue-300">jejak yang berarti.</span>
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
            Kesempatan kerja lokal dengan ketentuan terbuka dan Bukti Kerja yang dapat dipercaya.
          </p>
        </div>

        <nav className="divide-y divide-white/12 border-y border-white/12 lg:self-end" aria-label="Navigasi penutup">
          {footerLinks.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-14 items-center gap-4 py-3 text-sm text-slate-300 transition-colors duration-300 hover:text-white"
            >
              <span className="font-mono text-xs text-slate-500" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="flex-1 font-medium">{item.label}</span>
              <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </div>

      <div className="relative border-t border-white/10 px-4 py-5 text-center text-xs leading-5 text-slate-400">
        © 2026 Rintara · Pembayaran dilakukan di luar Rintara. Kami tidak menyimpan data rekening atau kartu.
      </div>
    </footer>
  );
}
