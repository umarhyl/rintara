"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobApplicationForm } from "@/components/rintara/job-application-form";
import {
  type PublicAccountRole,
  usePublicAccountState,
} from "@/features/auth/use-public-auth-state";

const workspaceByRole: Record<
  PublicAccountRole,
  { href: string; label: string; title: string; description: string }
> = {
  worker: {
    href: "/worker/dashboard",
    label: "Buka dasbor pekerja",
    title: "Akun pekerja siap",
    description: "Tulis catatan singkat untuk mengirim lamaran.",
  },
  employer: {
    href: "/employer/dashboard",
    label: "Buka ruang pemberi kerja",
    title: "Kamu masuk sebagai pemberi kerja",
    description:
      "Lamaran hanya dapat dikirim dari akun pekerja. Kelola pekerjaanmu dari ruang pemberi kerja.",
  },
  admin: {
    href: "/admin",
    label: "Buka ruang admin",
    title: "Kamu masuk sebagai admin",
    description:
      "Akun admin tidak dapat mengirim lamaran. Lanjutkan pekerjaanmu dari ruang admin.",
  },
};

function ApplyMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1.5 text-sm leading-6 text-[#c9d8cd]">{description}</p>
    </div>
  );
}

export function JobApplyAuthAction({ jobId }: { jobId: string }) {
  const { accountState, retry } = usePublicAccountState();
  const nextPath = `/jobs/${jobId}`;

  if (accountState.kind === "ready" && accountState.role === "worker") {
    return <JobApplicationForm jobId={jobId} />;
  }

  if (accountState.kind === "checking") {
    return (
      <div className="grid gap-4" aria-busy="true">
        <Button
          className="theme-static-light h-11 bg-[#73e2a7] text-[#0c1711] shadow-none"
          disabled
        >
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          Memeriksa akun
        </Button>
      </div>
    );
  }

  if (accountState.kind === "anonymous") {
    return (
      <div className="grid gap-4">
        <ApplyMessage
          title="Masuk sebagai pekerja"
          description="Setelah masuk, kamu dapat menulis satu catatan lamaran singkat. Jangan cantumkan rekening atau alamat pribadi."
        />
        <Button
          className="theme-static-light h-11 bg-[#73e2a7] text-[#0c1711] shadow-none hover:bg-[#def4c6]"
          asChild
        >
          <Link
            href={{ pathname: "/sign-in", query: { next: `/jobs/${jobId}` } }}
            prefetch={false}
          >
            Masuk untuk melamar <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  if (accountState.kind === "onboarding") {
    const onboardingPath =
      accountState.role === "worker"
        ? "/onboarding/worker"
        : accountState.role === "employer"
          ? "/onboarding/employer"
          : "/onboarding/role";
    const selectedEmployer = accountState.role === "employer";

    return (
      <div className="grid gap-4">
        <ApplyMessage
          title={
            selectedEmployer
              ? "Selesaikan profil pemberi kerja"
              : "Lengkapi akun untuk melamar"
          }
          description={
            selectedEmployer
              ? "Profilmu belum lengkap. Setelah selesai, kamu dapat mengelola pekerjaan dari ruang pemberi kerja."
              : "Selesaikan peran dan profil pekerja terlebih dahulu. Kamu akan kembali ke pekerjaan ini setelahnya."
          }
        />
        <Button
          className="theme-static-light h-11 bg-[#73e2a7] text-[#0c1711] shadow-none hover:bg-[#def4c6]"
          asChild
        >
          <Link
            href={{
              pathname: onboardingPath,
              query: { next: nextPath },
            }}
            prefetch={false}
          >
            Lanjutkan penyiapan akun <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  if (accountState.kind === "inactive") {
    return (
      <div className="grid gap-4">
        <ApplyMessage
          title="Akun tidak dapat mengirim lamaran"
          description="Periksa status akunmu dan langkah pemulihan yang tersedia sebelum melanjutkan."
        />
        <Button
          className="theme-static-light h-11 bg-[#73e2a7] text-[#0c1711] shadow-none hover:bg-[#def4c6]"
          asChild
        >
          <Link href="/account-restricted">
            Lihat status akun <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  if (accountState.kind === "unavailable") {
    return (
      <div className="grid gap-4">
        <ApplyMessage
          title="Status akun belum terbaca"
          description="Koneksi mungkin sedang terganggu. Muat ulang status akun tanpa kehilangan halaman pekerjaan ini."
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={retry}
        >
          <RotateCw aria-hidden="true" />
          Coba lagi
        </Button>
      </div>
    );
  }

  const workspace = workspaceByRole[accountState.role];

  return (
    <div className="grid gap-4">
      <ApplyMessage
        title={workspace.title}
        description={workspace.description}
      />
      <Button
        className="theme-static-light h-11 bg-[#73e2a7] text-[#0c1711] shadow-none hover:bg-[#def4c6]"
        asChild
      >
        <Link href={workspace.href}>
          {workspace.label} <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
