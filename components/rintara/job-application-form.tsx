"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Send } from "lucide-react";
import { submitApplication } from "@/server/domain/applications/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const errorMessages: Record<string, string> = {
  APPLICATION_ALREADY_EXISTS: "Kamu sudah melamar pekerjaan ini.",
  FIRST_OPPORTUNITY_INELIGIBLE:
    "Pekerjaan ini khusus untuk pekerja tanpa Bukti Kerja terverifikasi di kategori ini.",
  JOB_NOT_AVAILABLE: "Pekerjaan ini sudah tidak menerima lamaran.",
  VALIDATION_FAILED: "Periksa catatan lamaranmu lalu coba lagi.",
  FORBIDDEN: "Hanya akun pekerja yang dapat melamar pekerjaan.",
};

function messageFor(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return errorMessages[error.code] ?? "Lamaran belum bisa dikirim.";
  }

  return "Koneksi terputus saat mengirim lamaran. Coba lagi sebentar lagi.";
}

export function JobApplicationForm({ jobId }: { jobId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);

    startTransition(async () => {
      try {
        const result = await submitApplication(jobId, {
          note: formData.get("note"),
        });
        setApplicationId(result.applicationId);
        formRef.current?.reset();
      } catch (caughtError) {
        setError(messageFor(caughtError));
        submittingRef.current = false;
        return;
      }

      submittingRef.current = false;
    });
  }

  if (applicationId) {
    return (
      <div className="grid gap-5">
        <div className="rounded-2xl border border-success/30 bg-success/15 p-4 text-sm leading-6 text-blue-50">
          Lamaran terkirim. Statusnya bisa kamu pantau dari halaman lamaran.
        </div>
        <Button
          className="theme-static-light h-12 rounded-full bg-white text-slate-950 shadow-none hover:bg-blue-50"
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
          className="mt-2 min-h-32 border-white/15 bg-white/[0.08] text-white placeholder:text-blue-100/45"
        />
        <p className="mt-2 text-xs leading-5 text-blue-100/60">
          Jangan menawar upah atau menulis data privat seperti alamat lengkap.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-300/25 bg-red-400/10 p-3 text-sm leading-6 text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="theme-static-light h-12 rounded-full bg-white text-slate-950 shadow-none hover:bg-blue-50"
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
