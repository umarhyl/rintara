import Link from "next/link";
import { cn } from "@/lib/utils";

export function RintaraLogo({
  className,
  prefetch,
  tone = "default",
}: {
  className?: string;
  prefetch?: boolean;
  tone?: "default" | "inverse";
}) {
  return (
    <Link
      href="/"
      prefetch={prefetch}
      className={cn(
        "group/logo inline-flex min-h-11 items-center gap-2 font-semibold tracking-tight",
        className,
      )}
      aria-label="Rintara, kembali ke beranda"
    >
      <span
        className={cn(
          "grid size-9 place-items-center transition-colors duration-150",
          tone === "inverse"
            ? "text-[#73e2a7]"
            : "text-primary group-hover/logo:text-[#1b512d]",
        )}
      >
        <svg
          viewBox="0 0 36 36"
          className="size-8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8.5 29V10.5A3.5 3.5 0 0 1 12 7h16"
            stroke="currentColor"
            strokeWidth="3.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 15h6.2a4.4 4.4 0 0 1 0 8.8H15"
            stroke="currentColor"
            strokeWidth="3.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m21 23.8 7.2 6.2"
            stroke="currentColor"
            strokeWidth="3.25"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "text-xl font-bold tracking-[-0.025em]",
          tone === "inverse" ? "text-white" : "text-[#1b512d]",
        )}
      >
        Rintara
      </span>
    </Link>
  );
}
