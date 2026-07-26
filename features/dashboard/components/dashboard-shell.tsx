"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  Home,
  LoaderCircle,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  TicketCheck,
  UserRound,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { submitSignOut } from "@/app/auth/sign-out-action";
import { RintaraLogo } from "@/components/rintara/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { cn } from "@/lib/utils";
import { primePublicAuthState } from "@/features/auth/use-public-auth-state";
import {
  resolveDashboardActiveHref,
  type DashboardNavigationRole,
} from "@/features/dashboard/navigation";

type Role = DashboardNavigationRole;

const roleConfig = {
  worker: {
    label: "Pekerja",
    name: "Pekerja Rintara",
    initials: "PR",
    items: [
      { href: "/worker/dashboard", label: "Beranda", icon: Home },
      { href: "/jobs", label: "Cari kerja", icon: BriefcaseBusiness },
      { href: "/worker/applications", label: "Lamaran", icon: ClipboardList },
      { href: "/worker/passport", label: "Paspor", icon: FileCheck2 },
    ],
  },
  employer: {
    label: "Pemberi kerja",
    name: "Pemberi Kerja Rintara",
    initials: "PK",
    items: [
      { href: "/employer/dashboard", label: "Beranda", icon: Home },
      { href: "/employer/jobs/new", label: "Pasang kerja", icon: PlusCircle },
      { href: "/employer/jobs", label: "Pekerjaan", icon: BriefcaseBusiness },
      { href: "/employer/opportunity-credits", label: "Kredit", icon: TicketCheck },
    ],
  },
  admin: {
    label: "Administrator",
    name: "Admin Rintara",
    initials: "AR",
    items: [
      { href: "/admin", label: "Ringkasan", icon: Home },
      { href: "/admin/reports", label: "Laporan", icon: ShieldCheck },
      { href: "/admin/jobs", label: "Pekerjaan", icon: BriefcaseBusiness },
      { href: "/admin/users", label: "Pengguna", icon: UsersRound },
      { href: "/admin/wage-guidelines", label: "Panduan upah", icon: WalletCards },
      { href: "/admin/audit-logs", label: "Audit", icon: ClipboardList },
    ],
  },
} satisfies Record<Role, { label: string; name: string; initials: string; items: Array<{ href: string; label: string; icon: typeof Home }> }>;

const accountMenuItems = {
  worker: [
    { href: "/worker/profile", label: "Profil pekerja", icon: UserRound },
    {
      href: "/worker/applications",
      label: "Lamaran saya",
      icon: ClipboardList,
    },
    { href: "/worker/passport", label: "Paspor Rintara", icon: FileCheck2 },
  ],
  employer: [
    {
      href: "/employer/settings/profile",
      label: "Profil pemberi kerja",
      icon: Building2,
    },
    {
      href: "/employer/jobs",
      label: "Pekerjaan saya",
      icon: BriefcaseBusiness,
    },
    {
      href: "/employer/opportunity-credits",
      label: "Kredit Kesempatan",
      icon: TicketCheck,
    },
  ],
  admin: [
    { href: "/admin", label: "Panel admin", icon: ShieldCheck },
    { href: "/admin/reports", label: "Laporan", icon: ClipboardList },
  ],
} satisfies Record<
  Role,
  Array<{ href: string; label: string; icon: LucideIcon }>
>;

function Navigation({ role, mobile = false }: { role: Role; mobile?: boolean }) {
  const pathname = usePathname();
  const activeHref = resolveDashboardActiveHref(
    role,
    pathname,
    roleConfig[role].items.map((item) => item.href),
  );

  return (
    <nav className="grid gap-1" aria-label={`Navigasi ${roleConfig[role].label}`}>
      {roleConfig[role].items.map((item) => {
        const Icon = item.icon;
        const active = item.href === activeHref;
        const link = (
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group/nav flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/65 hover:text-sidebar-accent-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-8 place-items-center rounded-md text-sidebar-foreground transition-colors",
                active &&
                  "bg-sidebar-primary/10 text-sidebar-primary",
                !active &&
                  "group-hover/nav:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            {item.label}
          </Link>
        );

        return mobile ? (
          <SheetClose key={item.href} asChild>
            {link}
          </SheetClose>
        ) : (
          <div key={item.href}>{link}</div>
        );
      })}
    </nav>
  );
}

function initialsFor(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function DashboardAccountMenu({
  role,
  accountName,
  accountInitials,
  isSigningOut,
  signOutError,
  onSignOut,
}: {
  role: Role;
  accountName: string;
  accountInitials: string;
  isSigningOut: boolean;
  signOutError: string | null;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-full border-primary/20 bg-card p-0.5 shadow-sm hover:border-primary/45 hover:bg-secondary"
          aria-label={`Buka menu akun ${roleConfig[role].label}`}
          title="Menu akun"
        >
          <Avatar className="size-9 after:border-primary/15">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {accountInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[18rem] rounded-xl p-2"
      >
        <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2.5 font-normal">
          <Avatar size="lg" className="after:border-primary/15">
            <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">
              {accountInitials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {accountName}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {roleConfig[role].label}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {accountMenuItems[role].map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.href}
              asChild
              className="cursor-pointer gap-3 rounded-lg px-3 text-sm font-medium"
            >
              <Link href={item.href}>
                <Icon className="size-4.5 text-primary" aria-hidden="true" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer gap-3 rounded-lg px-3 text-sm font-medium"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            onSignOut();
          }}
        >
          {isSigningOut ? (
            <LoaderCircle className="size-4.5 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-4.5" aria-hidden="true" />
          )}
          {isSigningOut ? "Sedang keluar..." : "Keluar dari akun"}
        </DropdownMenuItem>

        {signOutError ? (
          <p
            className="px-3 pb-2 pt-1 text-xs leading-5 text-destructive"
            role="alert"
          >
            {signOutError}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({ role, displayName, children }: { role: Role; displayName?: string; children: React.ReactNode }) {
  const config = roleConfig[role];
  const accountName = displayName ?? config.name;
  const accountInitials = displayName ? initialsFor(displayName) : config.initials;
  const pathname = usePathname();
  const activeHref = resolveDashboardActiveHref(
    role,
    pathname,
    config.items.map((item) => item.href),
  );
  const router = useRouter();
  const signingOutRef = useRef(false);
  const [isSigningOut, startSignOutTransition] = useTransition();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const notificationHref =
    role === "worker"
      ? "/worker/notifications"
      : "/employer/notifications";

  function handleSignOut() {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    setSignOutError(null);
    startSignOutTransition(async () => {
      try {
        const result = await submitSignOut();

        if (!result.ok) {
          signingOutRef.current = false;
          setSignOutError(result.message);
          return;
        }

        primePublicAuthState("anonymous");
        router.replace("/");
      } catch {
        signingOutRef.current = false;
        setSignOutError(
          "Koneksi terputus saat keluar. Periksa jaringan lalu coba lagi.",
        );
      }
    });
  }

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-xl"
      >
        Lewati ke konten utama
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-14 items-center px-5">
          <RintaraLogo />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Navigation role={role} />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-background/95 px-4 shadow-[0_10px_30px_-26px_rgb(16_55_37/0.55)] backdrop-blur-md lg:ml-64 lg:justify-end lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                className="size-11"
                aria-label="Buka navigasi"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,20rem)]">
              <SheetHeader className="text-left">
                <SheetTitle>
                  <RintaraLogo />
                </SheetTitle>
                <SheetDescription>{config.label}</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 px-4">
                <Navigation role={role} mobile />
              </div>
            </SheetContent>
          </Sheet>
          <RintaraLogo className="hidden min-[360px]:inline-flex [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
        </div>
        <div className="flex items-center gap-2">
          {role !== "admin" ? (
            <Button variant="ghost" size="icon-lg" className="size-11" asChild>
              <Link href={notificationHref} aria-label="Buka notifikasi">
                <Bell aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
          <DashboardAccountMenu
            role={role}
            accountName={accountName}
            accountInitials={accountInitials}
            isSigningOut={isSigningOut}
            signOutError={signOutError}
            onSignOut={handleSignOut}
          />
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="pb-24 lg:ml-64 lg:pb-10">
        <div className="mx-auto max-w-[76rem] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navigasi utama seluler"
      >
        {config.items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors duration-200",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
