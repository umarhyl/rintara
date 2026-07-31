import Image from "next/image";
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
      <span className="grid size-9 place-items-center">
        <Image
          src={
            tone === "inverse"
              ? "/brand/rintara-mark-white.svg"
              : "/brand/rintara-mark.svg"
          }
          alt=""
          width={217}
          height={270}
          className="h-8 w-auto transition-transform duration-150 group-hover/logo:scale-[1.03]"
        />
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
