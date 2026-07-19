import Link from "next/link";
import { cn } from "@/lib/utils";

export function RintaraLogo({
  className,
  prefetch,
}: {
  className?: string;
  prefetch?: boolean;
}) {
  return (
    <Link
      href="/"
      prefetch={prefetch}
      className={cn("group/logo inline-flex min-h-11 items-center gap-2.5 font-semibold tracking-tight", className)}
      aria-label="Rintara, kembali ke beranda"
    >
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-[0.8rem] bg-primary text-primary-foreground shadow-[0_8px_22px_-10px_rgb(30_79_214/0.72)] transition-[transform,box-shadow] duration-500 ease-out group-hover/logo:scale-[1.025] group-hover/logo:shadow-[0_10px_26px_-10px_rgb(30_79_214/0.82)]">
        <svg viewBox="0 0 36 36" className="size-6" fill="none" aria-hidden="true">
          <path d="M7 27.5C11.2 25.7 10.2 18.6 15.1 17.4C19.4 16.3 20.6 21.2 24.5 19.7C27.4 18.6 27.5 13.5 30 8.5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
          <circle cx="7" cy="27.5" r="2.4" fill="currentColor" />
          <circle cx="15.1" cy="17.4" r="2.4" fill="var(--primary)" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="30" cy="8.5" r="2.4" fill="currentColor" />
        </svg>
      </span>
      <span className="text-xl font-semibold text-foreground">Rintara</span>
    </Link>
  );
}
