"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  ChevronDown,
  FileSignature,
  Grid2X2,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { PublicAccountMenu } from "@/components/rintara/public-account-menu";
import { RintaraLogo } from "@/components/rintara/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePublicAccountState } from "@/features/auth/use-public-auth-state";

type PublicNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  activePrefixes: readonly string[];
  description?: string;
};

type PublicNavGroup = {
  id: "worker" | "employer";
  label: string;
  icon: LucideIcon;
  activePrefixes: readonly string[];
  items: readonly PublicNavLink[];
};

const workerNavGroup: PublicNavGroup = {
  id: "worker",
  label: "Untuk pekerja",
  icon: UserRound,
  activePrefixes: ["/for-workers", "/jobs", "/first-opportunity"],
  items: [
    {
      href: "/for-workers",
      label: "Panduan pekerja",
      description: "Pahami alur melamar sampai Bukti Kerja.",
      icon: UserRound,
      activePrefixes: ["/for-workers"],
    },
    {
      href: "/jobs",
      label: "Cari pekerjaan",
      description: "Bandingkan tugas, area, upah, dan jadwal.",
      icon: Search,
      activePrefixes: ["/jobs"],
    },
    {
      href: "/jobs?opportunity=first",
      label: "Kesempatan Pertama",
      description: "Lihat pekerjaan berbayar di kategori barumu.",
      icon: BadgeCheck,
      activePrefixes: [],
    },
    {
      href: "/for-workers#alur-bukti-kerja",
      label: "Alur menjadi Bukti Kerja",
      description: "Ikuti langkah dari lamaran hingga hasil terverifikasi.",
      icon: FileSignature,
      activePrefixes: [],
    },
  ],
};

const employerNavGroup: PublicNavGroup = {
  id: "employer",
  label: "Untuk pemberi kerja",
  icon: Building2,
  activePrefixes: ["/for-employers"],
  items: [
    {
      href: "/for-employers",
      label: "Panduan pemberi kerja",
      description: "Pahami tanggung jawab dari terbit sampai selesai.",
      icon: Building2,
      activePrefixes: ["/for-employers"],
    },
    {
      href: "/for-employers#alur-pekerjaan",
      label: "Alur satu pekerjaan",
      description: "Lihat tahapan bersama tepat satu pekerja.",
      icon: FileSignature,
      activePrefixes: [],
    },
    {
      href: "/for-employers#ketentuan-privasi",
      label: "Ketentuan & privasi",
      description: "Bedakan informasi publik dan alamat privat.",
      icon: LockKeyhole,
      activePrefixes: [],
    },
    {
      href: "/for-employers#kredit-kesempatan",
      label: "Kredit Kesempatan",
      description: "Pahami kapan kredit diterbitkan dan digunakan.",
      icon: BadgeCheck,
      activePrefixes: [],
    },
  ],
};

const publicAudienceNavGroups = [workerNavGroup, employerNavGroup] as const;

const directPublicNavLinks: PublicNavLink[] = [
  {
    href: "/categories",
    label: "Kategori kerja",
    icon: Grid2X2,
    activePrefixes: ["/categories"],
  },
  {
    href: "/how-it-works",
    label: "Cara kerja",
    icon: FileSignature,
    activePrefixes: ["/how-it-works"],
  },
  {
    href: "/why-rintara",
    label: "Mengapa Rintara",
    icon: ShieldCheck,
    activePrefixes: ["/why-rintara"],
  },
];

const CONDENSE_DISTANCE = 220;

function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function smoothStep(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

function isPublicNavLinkActive(pathname: string, item: PublicNavLink) {
  return item.activePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPublicNavGroupActive(pathname: string, group: PublicNavGroup) {
  return group.activePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function DesktopAudienceMenu({
  group,
  pathname,
}: {
  group: PublicNavGroup;
  pathname: string;
}) {
  const active = isPublicNavGroupActive(pathname, group);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-public-audience-trigger
          data-active={active ? "true" : "false"}
          className="group flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-foreground/75 outline-none transition-colors duration-150 hover:bg-white/55 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 data-[active=true]:bg-secondary/75 data-[active=true]:text-secondary-foreground data-[state=open]:bg-white/70 data-[state=open]:text-foreground"
        >
          {group.label}
          <ChevronDown
            className="size-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-public-subnav={group.id}
        align="start"
        sideOffset={8}
        className="w-[21rem] rounded-xl bg-popover p-2 shadow-[0_24px_55px_-32px_rgb(16_37_27/0.6)] ring-border/80"
      >
        {group.items.map((item) => {
          const Icon = item.icon;

          return (
            <DropdownMenuItem
              key={item.href}
              asChild
              className="min-h-0 cursor-pointer items-start gap-3 rounded-lg p-3 focus:bg-secondary/65"
            >
              <Link
                href={item.href}
                aria-current={
                  isPublicNavLinkActive(pathname, item) ? "page" : undefined
                }
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e5f1e8] text-primary">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  {item.description ? (
                    <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileAudienceMenu({
  group,
  pathname,
}: {
  group: PublicNavGroup;
  pathname: string;
}) {
  const GroupIcon = group.icon;
  const active = isPublicNavGroupActive(pathname, group);

  return (
    <details
      data-mobile-audience-menu={group.id}
      data-active={active ? "true" : "false"}
      className="group rounded-xl border border-transparent bg-muted/35 data-[active=true]:border-border data-[active=true]:bg-secondary/45"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-3 text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/25 [&::-webkit-details-marker]:hidden">
        <GroupIcon className="size-4.5 text-primary" aria-hidden="true" />
        <span>{group.label}</span>
        <ChevronDown
          className="ml-auto size-4 text-muted-foreground transition-transform duration-150 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="grid gap-1 px-2 pb-2">
        {group.items.map((item) => {
          const Icon = item.icon;

          return (
            <SheetClose key={item.href} asChild>
              <Link
                href={item.href}
                aria-current={
                  isPublicNavLinkActive(pathname, item) ? "page" : undefined
                }
                className="flex min-h-14 items-start gap-3 rounded-lg px-3 py-2.5 outline-none transition-colors duration-150 hover:bg-white/80 focus-visible:ring-3 focus-visible:ring-ring/25 aria-[current=page]:bg-white aria-[current=page]:text-secondary-foreground"
              >
                <Icon
                  className="mt-0.5 size-4.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>
                  {item.description ? (
                    <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </SheetClose>
          );
        })}
      </div>
    </details>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const { accountState, retry } = usePublicAccountState();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const navClusterRef = useRef<HTMLDivElement>(null);
  const [signedOutLocally, setSignedOutLocally] = useState(false);
  const checkingAccount =
    !signedOutLocally && accountState.kind === "checking";
  const anonymousAccount =
    signedOutLocally || accountState.kind === "anonymous";
  const signedInAccountState =
    !signedOutLocally &&
    accountState.kind !== "checking" &&
    accountState.kind !== "anonymous"
      ? accountState
      : null;

  useEffect(() => {
    const surface = surfaceRef.current;
    const navCluster = navClusterRef.current;
    if (!surface || !navCluster) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame: number | null = null;

    const updateHeader = () => {
      animationFrame = null;

      const viewportWidth = window.innerWidth;
      const rawProgress = Math.min(
        Math.max(window.scrollY / CONDENSE_DISTANCE, 0),
        1,
      );
      const progress = reducedMotion.matches ? 0 : smoothStep(rawProgress);
      const startPadding =
        viewportWidth >= 1024 ? 32 : viewportWidth >= 640 ? 24 : 16;
      const endPadding = viewportWidth >= 1024 ? 24 : viewportWidth >= 640 ? 20 : 16;
      const startGap = viewportWidth >= 1280 ? 40 : 32;
      const endGap = viewportWidth >= 1280 ? 20 : 16;

      const condensedWidthLimit = 1280;
      const maxSideMargin =
        viewportWidth > condensedWidthLimit
          ? (viewportWidth - condensedWidthLimit) / 2
          : viewportWidth >= 640
          ? 16
          : 8;
      const currentSideMargin = interpolate(0, maxSideMargin, progress);

      surface.style.height = `${interpolate(72, 60, progress)}px`;
      surface.style.marginTop = `${interpolate(0, 12, progress)}px`;
      surface.style.width = `calc(100% - ${currentSideMargin * 2}px)`;
      surface.style.marginInline = "auto";
      surface.style.borderRadius = `${interpolate(0, 16, progress)}px`;
      surface.style.paddingInline = `${interpolate(
        startPadding,
        endPadding,
        progress,
      )}px`;
      surface.style.backgroundColor = `color-mix(in srgb, var(--card) ${Math.round(
        interpolate(68, 88, progress),
      )}%, transparent)`;
      surface.style.borderColor = `color-mix(in srgb, var(--border) ${Math.round(
        interpolate(34, 70, progress),
      )}%, transparent)`;
      const backdropFilter = `blur(${interpolate(12, 24, progress).toFixed(
        2,
      )}px) saturate(${interpolate(106, 126, progress).toFixed(2)}%)`;
      surface.style.backdropFilter = backdropFilter;
      surface.style.setProperty("-webkit-backdrop-filter", backdropFilter);
      surface.style.boxShadow = `inset 0 1px 0 rgb(255 255 255 / ${interpolate(
        0.5,
        0.82,
        progress,
      ).toFixed(3)}), 0 18px 48px -30px rgb(16 37 27 / ${interpolate(
        0.24,
        0.48,
        progress,
      ).toFixed(3)}), 0 2px 10px -7px rgb(16 37 27 / ${interpolate(
        0.14,
        0.24,
        progress,
      ).toFixed(3)})`;
      surface.dataset.condensed = progress >= 0.98 ? "true" : "false";
      surface.style.setProperty(
        "--public-header-progress",
        progress.toFixed(4),
      );
      navCluster.style.gap = `${interpolate(startGap, endGap, progress)}px`;
    };

    const scheduleUpdate = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(updateHeader);
    };

    updateHeader();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener("change", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", scheduleUpdate);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <header className="pointer-events-none sticky top-0 inset-x-0 z-40 h-18 w-full">
      <div
        ref={surfaceRef}
        className="pointer-events-auto flex h-18 w-full max-w-none items-center justify-between border border-transparent bg-card/10 px-4 sm:px-6 lg:px-8"
        data-condensed="false"
      >
        <div
          ref={navClusterRef}
          className="flex h-full items-center gap-8 xl:gap-10"
          data-public-nav-cluster
        >
          <RintaraLogo />
          <nav
            className="hidden h-full items-center gap-1 min-[1120px]:flex"
            aria-label="Navigasi utama"
          >
            {publicAudienceNavGroups.map((group) => (
              <DesktopAudienceMenu
                key={group.id}
                group={group}
                pathname={pathname}
              />
            ))}
            {directPublicNavLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  isPublicNavLinkActive(pathname, item) ? "page" : undefined
                }
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground/75 transition-colors duration-150 hover:bg-white/55 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 aria-[current=page]:bg-secondary/75 aria-[current=page]:text-secondary-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center justify-end gap-2">
          {checkingAccount ? (
            <div
              className="grid size-11 place-items-center"
              role="status"
              aria-label="Memeriksa status akun"
            >
              <span
                className="size-10 rounded-full bg-muted"
                aria-hidden="true"
              />
            </div>
          ) : signedInAccountState ? (
            <PublicAccountMenu
              accountState={signedInAccountState}
              retry={retry}
              onSignedOut={() => setSignedOutLocally(true)}
            />
          ) : null}

          {anonymousAccount ? (
            <div className="hidden items-center gap-2 min-[1120px]:flex">
              <Button variant="ghost" asChild>
                <Link href="/sign-in" prefetch={false}>
                  Masuk
                </Link>
              </Button>
              <Button className="px-5" asChild>
                <Link href="/register" prefetch={false}>
                  Daftar
                </Link>
              </Button>
            </div>
          ) : null}

          <div className="min-[1120px]:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="size-11"
                  aria-label="Buka menu"
                >
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" style={{ width: "min(90vw, 22rem)" }}>
                <SheetHeader className="border-b">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Pilih halaman Rintara</SheetDescription>
                </SheetHeader>
                <nav
                  className="overflow-y-auto px-4 pb-4"
                  aria-label="Navigasi seluler"
                >
                  <div className="grid gap-2">
                    {publicAudienceNavGroups.map((group) => (
                      <MobileAudienceMenu
                        key={group.id}
                        group={group}
                        pathname={pathname}
                      />
                    ))}
                    <div className="grid gap-1 pt-1">
                      {directPublicNavLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <SheetClose key={item.href} asChild>
                            <Button
                              variant="ghost"
                              className="h-12 justify-start gap-3 aria-[current=page]:bg-secondary aria-[current=page]:text-secondary-foreground"
                              asChild
                            >
                              <Link
                                href={item.href}
                                aria-current={
                                  isPublicNavLinkActive(pathname, item)
                                    ? "page"
                                    : undefined
                                }
                              >
                                <Icon className="size-4" aria-hidden="true" />
                                {item.label}
                              </Link>
                            </Button>
                          </SheetClose>
                        );
                      })}
                    </div>
                  </div>
                </nav>
                {checkingAccount || anonymousAccount ? (
                  <div className="mt-auto grid gap-2 border-t p-4">
                    {checkingAccount ? (
                      <Button className="h-11" disabled>
                        Memeriksa akun
                      </Button>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Button variant="outline" className="h-11" asChild>
                            <Link href="/sign-in" prefetch={false}>
                              Masuk
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button className="h-11" asChild>
                            <Link href="/register" prefetch={false}>
                              Daftar
                            </Link>
                          </Button>
                        </SheetClose>
                      </>
                    )}
                  </div>
                ) : null}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
