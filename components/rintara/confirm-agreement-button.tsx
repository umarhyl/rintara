"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, LoaderCircle } from "lucide-react";
import { confirmAgreement } from "@/server/domain/agreements/actions";
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
  FORBIDDEN: "Kamu tidak dapat mengonfirmasi kesepakatan ini.",
  INVALID_STATE_TRANSITION:
    "Kesepakatan ini sudah tidak menunggu konfirmasi. Muat ulang halaman untuk melihat status terbaru.",
  NOT_FOUND: "Kesepakatan tidak ditemukan.",
  VALIDATION_FAILED: "Identitas kesepakatan tidak valid.",
};

function messageFor(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return errorMessages[error.code] ?? "Kesepakatan belum bisa dikonfirmasi.";
  }

  return "Koneksi terputus saat mengonfirmasi. Coba lagi sebentar lagi.";
}

export function ConfirmAgreementButton({
  agreementId,
  disabled = false,
}: {
  agreementId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const submissionLockRef = useRef(false);

  function handleConfirm() {
    if (disabled || isPending || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setError(null);

    startTransition(async () => {
      try {
        await confirmAgreement(agreementId);
        setOpen(false);
        router.refresh();
      } catch (caughtError) {
        submissionLockRef.current = false;
        setError(messageFor(caughtError));
      }
    });
  }

  return (
    <div className="grid gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" className="h-11" disabled={disabled || isPending}>
            <Check aria-hidden="true" />
            Saya setuju dengan ketentuan
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <span className="mb-1 grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle aria-hidden="true" />
            </span>
            <DialogTitle>Konfirmasi kesepakatan?</DialogTitle>
            <DialogDescription className="leading-6">
              Konfirmasi dicatat satu kali dan tidak mengubah isi Mini
              Agreement. Setelah kedua pihak setuju, langkah kerja akan aktif.
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
              onClick={handleConfirm}
            >
              {isPending ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Mengonfirmasi
                </>
              ) : (
                "Ya, saya setuju"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
