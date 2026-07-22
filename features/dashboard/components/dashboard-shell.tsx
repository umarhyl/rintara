"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
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
} from "lucide-react";
import { submitSignOut } from "@/app/auth/sign-out-action";
import { RintaraLogo } from "@/components/rintara/logo";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { ScrollProgress } from "@/components/rintara/motion-primitives";
import { ScrollRevealManager } from "@/components/rintara/scroll-reveal-manager";
import { ThemeToggle } from "@/components/rintara/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

type Role = "worker" | "employer" | "admin";

const roleConfig = {
  worker: {
    label: "Pekerja",
    name: "Ayu Pratama",
    initials: "AP",
    items: [
      { href: "/worker/dashboard", label: "Beranda", icon: Home },
      { href: "/jobs", label: "Cari kerja", icon: BriefcaseBusiness },
      { href: "/worker/applications", label: "Lamaran", icon: ClipboardList },
      { href: "/worker/passport", label: "Paspor", icon: FileCheck2 },
      { href: "/worker/profile", label: "Profil", icon: UserRound },
      { href: "/worker/notifications", label: "Notifikasi", icon: Bell },
    ],
  },
  employer: {
    label: "Pemberi kerja",
    name: "Sinar Event Studio",
    initials: "SE",
    items: [
      { href: "/employer/dashboard", label: "Beranda", icon: Home },
      { href: "/employer/jobs/new", label: "Pasang kerja", icon: PlusCircle },
      { href: "/employer/jobs/kru-acara-akhir-pekan", label: "Pekerjaan", icon: BriefcaseBusiness },
      { href: "/employer/opportunity-credits", label: "Kredit", icon: TicketCheck },
      { href: "/employer/notifications", label: "Notifikasi", icon: Bell },
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

function Navigation({ role, mobile = false }: { role: Role; mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1" aria-label={`Navigasi ${roleConfig[role].label}`}>
      {roleConfig[role].items.map((item) => {
        const Icon = item.icon;
        const active = isNavigationItemActive(role, item.href, pathname);
        const link = (
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group/nav relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-300",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_rgb(255_255_255/0.04)]" : "text-sidebar-foreground hover:translate-x-0.5 hover:bg-white/[0.055] hover:text-white",
            )}
          >
            {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-sidebar-primary" aria-hidden="true" /> : null}
            <span className={cn("grid size-8 place-items-center rounded-lg transition-colors", active ? "bg-sidebar-primary/15 text-sidebar-primary" : "text-slate-400 group-hover/nav:text-white")}><Icon className="size-4.5" aria-hidden="true" /></span>
            {item.label}
          </Link>
        );
        return mobile ? <SheetClose key={item.href} asChild>{link}</SheetClose> : <div key={item.href}>{link}</div>;
      })}
    </nav>
  );
}

function isNavigationItemActive(role: Role, href: string, pathname: string) {
  if (pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`))) return true;

  if (role === "worker" && href === "/worker/applications") {
    return pathname.startsWith("/worker/agreements/") || pathname.startsWith("/worker/work/");
  }

  if (role === "employer" && href === "/employer/jobs/kru-acara-akhir-pekan") {
    return pathname.startsWith("/employer/agreements/") || pathname.startsWith("/employer/work/");
  }

  return false;
}

function initialsFor(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardShell({ role, displayName, children }: { role: Role; displayName?: string; children: React.ReactNode }) {
  const config = roleConfig[role];
  const accountName = displayName ?? config.name;
  const accountInitials = displayName ? initialsFor(displayName) : config.initials;
  const pathname = usePathname();
  const router = useRouter();
  const signingOutRef = useRef(false);
  const [isSigningOut, startSignOutTransition] = useTransition();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const notificationHref = role === "admin" ? "/admin/reports" : `/${role}/notifications`;

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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-card focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-xl">
        Lewati ke konten utama
      </a>
      <ScrollProgress />
      <ScrollRevealManager />
      <AmbientBackdrop variant="dashboard" className="fixed left-0 lg:left-72" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-sidebar-border px-6"><RintaraLogo className="[&>span:last-child]:text-white" /></div>
        <div className="flex-1 overflow-y-auto p-4"><Navigation role={role} /></div>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.045] p-3.5">
            <Avatar><AvatarFallback className="bg-white/10 text-white">{accountInitials}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{accountName}</p>
              <p className="truncate text-xs text-slate-400">{config.label}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label={isSigningOut ? "Sedang keluar" : "Keluar dari akun"}
              title="Keluar"
            >
              {isSigningOut ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
            </Button>
          </div>
          {signOutError ? <p className="mt-2 text-xs leading-relaxed text-red-300" role="alert">{signOutError}</p> : null}
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-border/65 bg-background/78 px-4 backdrop-blur-2xl lg:ml-72 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-lg" className="size-11" aria-label="Buka navigasi"><Menu aria-hidden="true" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,20rem)]">
              <SheetHeader className="border-b text-left">
                <SheetTitle><RintaraLogo /></SheetTitle>
                <SheetDescription>{config.label}</SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col px-4">
                <Navigation role={role} mobile />
                <div className="mt-auto border-t py-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
                    {isSigningOut ? "Sedang keluar..." : "Keluar dari akun"}
                  </Button>
                  {signOutError ? <p className="mt-2 px-3 text-sm leading-relaxed text-destructive" role="alert">{signOutError}</p> : null}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <RintaraLogo className="hidden min-[360px]:inline-flex [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
        </div>
        <div className="hidden lg:block">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
          <p className="text-sm font-semibold">{config.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon-lg" className="size-11" asChild>
            <Link href={notificationHref} aria-label={role === "admin" ? "Buka laporan, ada laporan baru" : "Buka notifikasi, ada notifikasi baru"} className="relative">
              <Bell aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-card" aria-hidden="true" />
            </Link>
          </Button>
          <Avatar className="hidden size-9 ring-2 ring-card shadow-sm min-[420px]:flex"><AvatarFallback className="bg-blue-50 text-xs font-semibold text-primary">{accountInitials}</AvatarFallback></Avatar>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="relative z-[1] pb-28 lg:ml-72 lg:pb-10">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9" data-dashboard-flow>{children}</div>
      </main>

      <nav className="fixed bottom-3 left-3 right-3 z-30 grid grid-cols-4 overflow-hidden rounded-2xl border border-border/80 bg-card/90 pb-[env(safe-area-inset-bottom)] shadow-[0_20px_55px_-28px_rgb(15_23_42/0.55)] backdrop-blur-2xl lg:hidden" aria-label="Navigasi utama seluler">
        {config.items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isNavigationItemActive(role, item.href, pathname);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors duration-300", active ? "text-primary" : "text-muted-foreground hover:text-primary")}>
              {active ? <span className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-primary" aria-hidden="true" /> : null}
              <Icon className={cn("size-5 transition-transform duration-200", active && "-translate-y-0.5")} aria-hidden="true" />{item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
