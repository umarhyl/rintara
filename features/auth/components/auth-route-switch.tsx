import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthRouteSwitch({ active, nextPath }: { active: "sign-in" | "register"; nextPath?: string }) {
  const signInHref = nextPath ? { pathname: "/sign-in", query: { next: nextPath } } : "/sign-in";
  const registerHref = nextPath ? { pathname: "/register", query: { next: nextPath } } : "/register";

  return (
    <nav className="flex gap-8 border-b border-border" aria-label="Pilih masuk atau daftar">
      <Link
        href={signInHref}
        prefetch={false}
        aria-current={active === "sign-in" ? "page" : undefined}
        className={cn(
          "relative flex min-h-11 items-center justify-center px-0 text-sm font-semibold text-muted-foreground transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-600 hover:text-foreground",
          active === "sign-in" && "text-foreground after:scale-x-100",
        )}
      >
        Masuk
      </Link>
      <Link
        href={registerHref}
        prefetch={false}
        aria-current={active === "register" ? "page" : undefined}
        className={cn(
          "relative flex min-h-11 items-center justify-center px-0 text-sm font-semibold text-muted-foreground transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-600 hover:text-foreground",
          active === "register" && "text-foreground after:scale-x-100",
        )}
      >
        Daftar
      </Link>
    </nav>
  );
}
