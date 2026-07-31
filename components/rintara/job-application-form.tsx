"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Send } from "lucide-react";
import { submitApplication } from "@/server/domain/applications/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ApplicationFeedback = {
  message: string;
  action?: {
    href: string;
    label: string;
  };
};

function feedbackFor(
  error: unknown,
  nextPath: string,
): ApplicationFeedback {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    switch (error.code) {
      case "UNAUTHENTICATED":
        return {
          message: "Sesi masukmu berakhir. Masuk lagi untuk melanjutkan.",
          action: {
            href: `/sign-in?next=${encodeURIComponent(nextPath)}`,
            label: "Masuk lagi",
          },
        };
      case "ONBOARDING_REQUIRED":
      case "ROLE_REQUIRED":
        return {
          message:
            "Lengkapi peran dan profil pekerja sebelum mengirim lamaran.",
          action: {
            href: `/onboarding/role?next=${encodeURIComponent(nextPath)}`,
            label: "Lanjutkan penyiapan akun",
          },
        };
      case "ACCOUNT_INACTIVE":
        return {
          message:
            "Akunmu sedang dibatasi dan belum dapat mengirim lamaran.",
          action: {
            href: "/account-restricted",
            label: "Lihat status akun",
          },
        };
      case "FORBIDDEN":
        return {
          message: "Lamaran hanya dapat dikirim dari akun pekerja.",
          action: {
            href: "/account/continue",
            label: "Buka ruang akun",
          },
        };
      case "APPLICATION_ALREADY_EXISTS":
        return {
          message: "Kamu sudah melamar pekerjaan ini.",
          action: {
            href: "/worker/applications",
            label: "Lihat lamaran",
          },
        };
      case "FIRST_OPPORTUNITY_INELIGIBLE":
        return {
          message:
            "Pekerjaan ini khusus untuk pekerja tanpa Bukti Kerja terverifikasi di kategori ini.",
          action: {
            href: "/jobs",
            label: "Cari pekerjaan lain",
          },
        };
      case "JOB_NOT_AVAILABLE":
        return {
          message: "Pekerjaan ini sudah tidak menerima lamaran.",
          action: {
            href: "/jobs",
            label: "Lihat pekerjaan lain",
          },
        };
      case "VALIDATION_FAILED":
        return {
          message: "Periksa catatan lamaranmu lalu coba lagi.",
        };
      default:
        return { message: "Lamaran belum bisa dikirim. Coba lagi." };
    }
  }

  return {
    message: "Koneksi terputus saat mengirim lamaran. Coba lagi sebentar lagi.",
  };
}

export function JobApplicationForm({ jobId }: { jobId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const [feedback, setFeedback] = useState<ApplicationFeedback | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const nextPath = `/jobs/${jobId}`;

  function handleSubmit(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await submitApplication(jobId, {
          note: formData.get("note"),
        });
        setApplicationId(result.applicationId);
        formRef.current?.reset();
      } catch (caughtError) {
        setFeedback(feedbackFor(caughtError, nextPath));
        submittingRef.current = false;
        return;
      }

      submittingRef.current = false;
    });
  }

  if (applicationId) {
    return (
      <div className="grid gap-5">
        <div className="rounded-xl border border-[#73e2a7]/35 bg-[#73e2a7]/10 p-4 text-sm leading-6 text-white">
          Lamaran terkirim. Statusnya bisa kamu pantau dari halaman lamaran.
        </div>
        <Button
          className="theme-static-light h-12 bg-[#73e2a7] text-[#0c1711] shadow-none hover:bg-[#def4c6]"
          asChild
        >
          <Link href="/worker/applications">
            Lihat lamaran <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-5">
      <div>
        <label htmlFor="application-note" className="text-sm font-semibold text-white">
          Catatan lamaran
        </label>
        <Textarea
          id="application-note"
          name="note"
          minLength={20}
          maxLength={1000}
          required
          disabled={isPending}
          placeholder="Tulis ketersediaanmu dan alasan kamu cocok untuk tugas ini."
          className="mt-2 min-h-32 w-full max-w-full min-w-0 resize-none break-words whitespace-pre-wrap border-white/20 bg-white/[0.08] text-white placeholder:text-[#c9d8cd]/70"
        />
        <p className="mt-2 text-xs leading-5 text-[#c9d8cd]">
          Jangan menawar upah atau menulis data privat seperti alamat lengkap.
        </p>
      </div>

      {feedback ? (
        <div
          className="rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm leading-6 text-red-100"
          role="alert"
        >
          <p>{feedback.message}</p>
          {feedback.action ? (
            <Link
              href={feedback.action.href}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-white underline decoration-white/45 underline-offset-4 hover:decoration-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              prefetch={false}
            >
              {feedback.action.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        className="theme-static-light h-12 bg-[#73e2a7] text-[#0c1711] shadow-none hover:bg-[#def4c6]"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Mengirim lamaran
          </>
        ) : (
          <>
            Kirim lamaran <Send aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
