"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { RintaraLogo } from "@/components/rintara/logo";
import { ThemeToggle } from "@/components/rintara/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePublicAuthState } from "@/components/rintara/use-public-auth-state";

const links = [
  { href: "/jobs", label: "Cari kerja" },
  { href: "/first-opportunity", label: "Kesempatan Pertama" },
  { href: "/how-it-works", label: "Cara kerja" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const authState = usePublicAuthState();
  const checkingAuth = authState === "checking";
  const signedIn = authState === "signed-in";
  return (
    <header className="sticky top-0 z-40 border-b border-border/65 bg-background/82 px-4 backdrop-blur-2xl sm:px-6">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between">
        <div className="flex h-full items-center gap-10 xl:gap-14" data-public-nav-cluster>
          <RintaraLogo />
          <nav className="hidden h-full items-center gap-6 lg:flex xl:gap-8" aria-label="Navigasi utama">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
                className="relative flex h-full items-center text-sm font-medium text-muted-foreground transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-500 hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden min-w-80 items-center justify-end gap-2 lg:flex">
          <ThemeToggle />
          {checkingAuth ? (
            <div
              className="flex h-11 w-[11.5rem] items-center justify-end gap-2"
              role="status"
              aria-label="Memeriksa status akun"
            >
              <span className="h-2 w-20 rounded-full bg-muted" aria-hidden="true" />
              <span className="size-9 rounded-full bg-muted" aria-hidden="true" />
            </div>
          ) : signedIn ? (
            <Button size="lg" className="rounded-full px-6" asChild>
              <Link href="/account/continue" prefetch={false}>Buka ruang kerja</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="lg" className="rounded-full" asChild>
                <Link href="/sign-in" prefetch={false}>Masuk</Link>
              </Button>
              <Button size="lg" className="rounded-full px-6" asChild>
                <Link href="/register" prefetch={false}>Buat akun</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-lg" className="size-11" aria-label="Buka menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(90vw,22rem)]">
              <SheetHeader className="border-b">
                <SheetTitle>Menu Rintara</SheetTitle>
                <SheetDescription>Temukan jalan berikutnya di Rintara.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-4" aria-label="Navigasi seluler">
                {links.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Button variant="ghost" className="h-11 justify-start" asChild>
                      <Link href={link.href} aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined} className="aria-[current=page]:bg-secondary aria-[current=page]:text-primary">{link.label}</Link>
                    </Button>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto grid gap-2 border-t p-4">
                {checkingAuth ? (
                  <Button className="h-11" disabled>
                    Memeriksa akun
                  </Button>
                ) : signedIn ? (
                  <SheetClose asChild>
                    <Button className="h-11" asChild>
                      <Link href="/account/continue" prefetch={false}>Buka ruang kerja</Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button variant="outline" className="h-11" asChild>
                        <Link href="/sign-in" prefetch={false}>Masuk</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button className="h-11" asChild>
                        <Link href="/register" prefetch={false}>Buat akun</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
