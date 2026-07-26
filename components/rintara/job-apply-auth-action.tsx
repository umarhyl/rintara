"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  CircleX,
  Clock3,
  LoaderCircle,
  RotateCw,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobApplicationForm } from "@/components/rintara/job-application-form";
import {
  type PublicAccountRole,
  usePublicAccountState,
} from "@/features/auth/use-public-auth-state";
import {
  parseWorkerJobApplicationState,
  type WorkerJobApplicationState,
} from "@/features/jobs/worker-job-application-state";

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

type WorkerApplicationCheck =
  | { kind: "checking" }
  | { kind: "ready"; value: WorkerJobApplicationState }
  | { kind: "error" };

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

function WorkerApplicationStatus({
  value,
}: {
  value: Exclude<WorkerJobApplicationState, { state: "eligible" }>;
}) {
  if (value.state === "ineligible") {
    return (
      <div className="grid gap-4">
        <ApplyMessage
          title="Kesempatan ini tidak sesuai"
          description="Kamu sudah memiliki Bukti Kerja terverifikasi pada kategori ini. Kesempatan Pertama diprioritaskan untuk pekerja baru di kategori tersebut."
        />
        <Button
          className="theme-static-light h-11 bg-[#73e2a7] text-[#0c1711] shadow-none hover:bg-[#def4c6]"
          asChild
        >
          <Link href="/jobs?opportunity=general">
            Cari pekerjaan umum <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  if (value.state === "unavailable") {
    return (
      <div className="grid gap-4">
        <ApplyMessage
          title="Lamaran sudah ditutup"
          description="Status pekerjaan berubah atau batas lamaran telah lewat. Kamu masih dapat melihat kesempatan lain yang sedang aktif."
        />
        <Button
          className="theme-static-light h-11 bg-[#73e2a7] text-[#0c1711] shadow-none hover:bg-[#def4c6]"
          asChild
        >
          <Link href="/jobs">
            Lihat pekerjaan lain <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  const status = value.applicationStatus;
  const accepted = status === "accepted";
  const StatusIcon =
    status === "submitted"
      ? Clock3
      : accepted
        ? CircleCheck
        : status === "rejected"
          ? CircleX
          : Undo2;
  const destination =
    accepted && value.agreementId
      ? `/worker/agreements/${value.agreementId}`
      : status === "rejected" || status === "withdrawn"
        ? "/worker/applications?view=history"
        : "/worker/applications?view=active";
  const copy =
    status === "submitted"
      ? {
          title: "Lamaran sudah terkirim",
          description:
            "Pemberi kerja belum memberi keputusan. Pantau perubahan status dari halaman lamaranmu.",
          label: "Lihat lamaran aktif",
        }
      : accepted
        ? {
            title: "Lamaranmu diterima",
            description: value.agreementId
              ? "Lanjutkan ke Mini Agreement untuk memeriksa dan mengonfirmasi ketentuan yang sama."
              : "Keputusan sudah tercatat. Pantau langkah berikutnya dari halaman lamaranmu.",
            label: value.agreementId
              ? "Buka Mini Agreement"
              : "Lihat lamaran aktif",
          }
        : status === "rejected"
          ? {
              title: "Lamaran tidak dipilih",
              description:
                "Riwayatnya tetap tersimpan dan kamu dapat melanjutkan mencari pekerjaan lain.",
              label: "Lihat riwayat lamaran",
            }
          : {
              title: "Lamaran telah ditarik",
              description:
                "Riwayatnya tetap tersimpan. Satu pekerja hanya dapat mengirim satu lamaran untuk pekerjaan yang sama.",
              label: "Lihat riwayat lamaran",
            };

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-3">
        <StatusIcon
          className={`mt-0.5 size-5 shrink-0 ${
            accepted ? "text-[#73e2a7]" : "text-[#c9d8cd]"
          }`}
          aria-hidden="true"
        />
        <ApplyMessage title={copy.title} description={copy.description} />
      </div>
      <Button
        className="theme-static-light h-11 bg-[#73e2a7] text-[#0c1711] shadow-none hover:bg-[#def4c6]"
        asChild
      >
        <Link href={destination}>
          {copy.label} <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

function WorkerApplicationAction({ jobId }: { jobId: string }) {
  const [attempt, setAttempt] = useState(0);
  const [check, setCheck] = useState<WorkerApplicationCheck>({
    kind: "checking",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplicationState() {
      try {
        const response = await fetch(`/jobs/${jobId}/application-status`, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Application state request failed.");

        const value = parseWorkerJobApplicationState(await response.json());
        if (!value) throw new Error("Application state response is invalid.");

        setCheck({ kind: "ready", value });
      } catch {
        if (controller.signal.aborted) return;
        setCheck({ kind: "error" });
      }
    }

    void loadApplicationState();
    return () => controller.abort();
  }, [attempt, jobId]);

  if (check.kind === "checking") {
    return (
      <div className="grid gap-4" aria-busy="true" aria-live="polite">
        <Button
          className="theme-static-light h-11 bg-[#73e2a7] text-[#0c1711] shadow-none"
          disabled
        >
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          Memeriksa lamaran
        </Button>
      </div>
    );
  }

  if (check.kind === "error") {
    return (
      <div className="grid gap-4">
        <ApplyMessage
          title="Status lamaran belum terbaca"
          description="Koneksi mungkin sedang terganggu. Coba periksa lagi sebelum mengirim lamaran."
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={() => {
            setCheck({ kind: "checking" });
            setAttempt((current) => current + 1);
          }}
        >
          <RotateCw aria-hidden="true" />
          Periksa lagi
        </Button>
      </div>
    );
  }

  if (check.value.state === "eligible") {
    return <JobApplicationForm jobId={jobId} />;
  }

  return <WorkerApplicationStatus value={check.value} />;
}

export function JobApplyAuthAction({ jobId }: { jobId: string }) {
  const { accountState, retry } = usePublicAccountState();
  const nextPath = `/jobs/${jobId}`;

  if (accountState.kind === "ready" && accountState.role === "worker") {
    return <WorkerApplicationAction key={jobId} jobId={jobId} />;
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
