"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileCheck2,
  Home,
  LoaderCircle,
  LogOut,
  PlusCircle,
  RotateCw,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { submitSignOut } from "@/app/auth/sign-out-action";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  primePublicAuthState,
  type PublicAccountRole,
  type PublicAccountState,
} from "@/features/auth/use-public-auth-state";

type AccountMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type ReadyAccountMenu = {
  roleLabel: string;
  fallbackName: string;
  fallbackInitials: string;
  items: readonly AccountMenuItem[];
};

const readyAccountMenus = {
  worker: {
    roleLabel: "Pekerja",
    fallbackName: "Pekerja Rintara",
    fallbackInitials: "PR",
    items: [
      {
        href: "/worker/dashboard",
        label: "Dashboard pekerja",
        icon: Home,
      },
      {
        href: "/worker/applications",
        label: "Lamaran saya",
        icon: ClipboardList,
      },
      {
        href: "/worker/passport",
        label: "Paspor Rintara",
        icon: FileCheck2,
      },
      {
        href: "/worker/profile",
        label: "Profil pekerja",
        icon: UserRound,
      },
    ],
  },
  employer: {
    roleLabel: "Pemberi kerja",
    fallbackName: "Pemberi Kerja Rintara",
    fallbackInitials: "PK",
    items: [
      {
        href: "/employer/dashboard",
        label: "Dashboard pemberi kerja",
        icon: Home,
      },
      {
        href: "/employer/jobs/new",
        label: "Pasang pekerjaan",
        icon: PlusCircle,
      },
      {
        href: "/employer/jobs",
        label: "Pekerjaan saya",
        icon: BriefcaseBusiness,
      },
      {
        href: "/employer/opportunity-credits",
        label: "Kredit Kesempatan",
        icon: BadgeCheck,
      },
      {
        href: "/employer/settings/profile",
        label: "Profil pemberi kerja",
        icon: Building2,
      },
    ],
  },
  admin: {
    roleLabel: "Administrator",
    fallbackName: "Admin Rintara",
    fallbackInitials: "AR",
    items: [
      {
        href: "/admin",
        label: "Panel admin",
        icon: ShieldCheck,
      },
      {
        href: "/admin/reports",
        label: "Laporan",
        icon: ClipboardList,
      },
    ],
  },
} satisfies Record<PublicAccountRole, ReadyAccountMenu>;

function initialsFor(displayName: string, fallback: string) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || fallback;
}

function accountPresentation(accountState: PublicAccountState) {
  if (
    (accountState.kind === "ready" ||
      accountState.kind === "inactive" ||
      accountState.kind === "onboarding") &&
    accountState.role
  ) {
    const config = readyAccountMenus[accountState.role];
    const displayName = accountState.displayName ?? config.fallbackName;

    return {
      displayName,
      initials: initialsFor(displayName, config.fallbackInitials),
      roleLabel:
        accountState.kind === "inactive"
          ? `${config.roleLabel} · akun dibatasi`
          : accountState.kind === "onboarding"
            ? `${config.roleLabel} · penyiapan akun`
            : config.roleLabel,
    };
  }

  if (accountState.kind === "onboarding") {
    return {
      displayName: "Akun Rintara",
      initials: null,
      roleLabel: "Penyiapan akun",
    };
  }

  return {
    displayName: "Akun Rintara",
    initials: null,
    roleLabel: "Status akun belum terbaca",
  };
}

function AccountMenuLink({ item }: { item: AccountMenuItem }) {
  const Icon = item.icon;

  return (
    <DropdownMenuItem
      asChild
      className="cursor-pointer gap-3 rounded-lg px-3 text-sm font-medium"
    >
      <Link href={item.href} prefetch={false}>
        <Icon className="size-4.5 text-primary" aria-hidden="true" />
        {item.label}
      </Link>
    </DropdownMenuItem>
  );
}

export function PublicAccountMenu({
  accountState,
  retry,
  onSignedOut,
}: {
  accountState: Exclude<
    PublicAccountState,
    { kind: "checking" } | { kind: "anonymous" }
  >;
  retry: () => void;
  onSignedOut: () => void;
}) {
  const router = useRouter();
  const signingOutRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [isSigningOut, startSignOutTransition] = useTransition();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const presentation = accountPresentation(accountState);

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
        setOpen(false);
        onSignedOut();
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
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-full border-primary/25 bg-card/90 p-0.5 shadow-[0_10px_24px_-18px_rgb(16_80_52/0.75)] hover:border-primary/55 hover:bg-secondary/70"
          aria-label={`Buka menu akun ${presentation.roleLabel}`}
          title="Menu akun"
        >
          <Avatar className="size-9 after:border-primary/15">
            <AvatarFallback className="bg-primary text-xs font-semibold tracking-[-0.01em] text-primary-foreground">
              {presentation.initials ?? (
                <UserRound className="size-4.5" aria-hidden="true" />
              )}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[18.5rem] rounded-xl p-2 shadow-[0_24px_55px_-32px_rgb(16_37_27/0.58)]"
      >
        <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2.5 font-normal">
          <Avatar size="lg" className="after:border-primary/15">
            <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">
              {presentation.initials ?? (
                <UserRound className="size-4.5" aria-hidden="true" />
              )}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {presentation.displayName}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {presentation.roleLabel}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {accountState.kind === "ready"
          ? readyAccountMenus[accountState.role].items.map((item) => (
              <AccountMenuLink key={item.href} item={item} />
            ))
          : null}

        {accountState.kind === "onboarding" ? (
          <AccountMenuLink
            item={{
              href: "/account/continue",
              label: "Lanjutkan penyiapan akun",
              icon: UserRound,
            }}
          />
        ) : null}

        {accountState.kind === "inactive" ? (
          <AccountMenuLink
            item={{
              href: "/account-restricted",
              label: "Lihat status akun",
              icon: ShieldCheck,
            }}
          />
        ) : null}

        {accountState.kind === "unavailable" ? (
          <>
            <p className="px-3 py-2 text-sm leading-5 text-muted-foreground">
              Coba periksa kembali status akun sebelum membuka halaman privat.
            </p>
            <DropdownMenuItem
              className="cursor-pointer gap-3 rounded-lg px-3 text-sm font-medium"
              onSelect={(event) => {
                event.preventDefault();
                retry();
              }}
            >
              <RotateCw className="size-4.5 text-primary" aria-hidden="true" />
              Periksa kembali
            </DropdownMenuItem>
            <AccountMenuLink
              item={{
                href: "/account/continue",
                label: "Buka ruang kerja",
                icon: Home,
              }}
            />
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer gap-3 rounded-lg px-3 text-sm font-medium"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
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
