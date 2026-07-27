"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, UserCheck } from "lucide-react";
import { acceptApplication } from "@/server/domain/applications/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const errorMessages: Record<string, string> = {
  APPLICATION_NOT_FOUND: "Lamaran tidak ditemukan.",
  APPLICATION_NOT_SUBMITTED: "Lamaran ini sudah tidak menunggu tinjauan.",
  CONCURRENT_ACCEPTANCE_CONFLICT:
    "Pekerjaan ini baru saja terisi. Muat ulang untuk melihat status terbaru.",
  FIRST_OPPORTUNITY_INELIGIBLE:
    "Pekerja ini sudah memiliki Bukti Kerja di kategori ini.",
  FORBIDDEN: "Kamu tidak dapat menerima lamaran untuk pekerjaan ini.",
  JOB_NOT_AVAILABLE: "Pekerjaan ini sudah tidak tersedia untuk penerimaan.",
  JOB_NOT_FOUND: "Pekerjaan tidak ditemukan.",
};

function messageFor(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return errorMessages[error.code] ?? "Lamaran belum bisa diterima.";
  }

  return "Koneksi terputus saat menerima lamaran. Coba lagi sebentar lagi.";
}

function errorCodeFor(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

export function AcceptApplicationButton({
  applicationId,
  workerDisplayName,
  disabledReason,
}: {
  applicationId: string;
  workerDisplayName: string;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const submissionLockRef = useRef(false);
  const disabled = Boolean(disabledReason) || isPending;

  function handleAccept() {
    if (disabled || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setError(null);

    startTransition(async () => {
      try {
        const result = await acceptApplication(applicationId);
        setOpen(false);
        router.push(`/employer/agreements/${result.agreementId}`);
      } catch (caughtError) {
        submissionLockRef.current = false;
        setError(messageFor(caughtError));
        if (
          [
            "APPLICATION_NOT_SUBMITTED",
            "CONCURRENT_ACCEPTANCE_CONFLICT",
            "JOB_NOT_AVAILABLE",
          ].includes(errorCodeFor(caughtError) ?? "")
        ) {
          router.refresh();
        }
      }
    });
  }

  return (
    <div className="grid gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" className="h-11" disabled={disabled}>
            <UserCheck aria-hidden="true" />
            Terima pekerja
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <span className="mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 aria-hidden="true" />
            </span>
            <DialogTitle>Terima {workerDisplayName}?</DialogTitle>
            <DialogDescription className="leading-6">
              Satu pekerja akan diterima, lamaran lain yang masih menunggu akan
              ditandai tidak dipilih, dan syarat pekerjaan saat ini akan menjadi
              snapshot Mini Agreement.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p
              className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm leading-6 text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={isPending}
              >
                Kembali
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="h-11"
              disabled={isPending}
              onClick={handleAccept}
            >
              {isPending ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Menerima
                </>
              ) : (
                "Konfirmasi penerimaan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {disabledReason ? (
        <p className="text-xs leading-5 text-destructive">{disabledReason}</p>
      ) : null}
    </div>
  );
}
