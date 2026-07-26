"use client";

import { useRef, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { cancelJob } from "@/server/domain/jobs/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FORBIDDEN: "Akun ini tidak dapat membatalkan pekerjaan.",
  JOB_NOT_FOUND: "Pekerjaan tidak ditemukan.",
  INVALID_STATE_TRANSITION: "Pekerjaan ini belum dapat dibatalkan dari status saat ini.",
};

function messageFor(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return errorMessages[error.code] ?? "Pekerjaan belum dapat dibatalkan.";
  }

  return "Koneksi terputus saat membatalkan pekerjaan. Coba lagi sebentar lagi.";
}

export function CancelJobButton({
  jobId,
  disabled = false,
}: {
  jobId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const submissionLockRef = useRef(false);

  function handleCancel() {
    if (
      disabled ||
      isPending ||
      reason.trim().length < 10 ||
      submissionLockRef.current
    ) {
      return;
    }
    submissionLockRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        await cancelJob(jobId, { reason });
        setOpen(false);
        setReason("");
      } catch (caughtError) {
        submissionLockRef.current = false;
        setError(messageFor(caughtError));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="h-11"
          variant="destructive"
          disabled={disabled}
        >
          Batalkan pekerjaan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan pekerjaan ini?</DialogTitle>
          <DialogDescription className="leading-6">
            Pekerjaan tidak lagi menerima lamaran. Lamaran aktif akan ditutup
            tanpa menghapus riwayat.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="cancellation-reason">Alasan pembatalan</Label>
          <Textarea
            id="cancellation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            placeholder="Contoh: jadwal pekerjaan berubah dan belum bisa dipastikan ulang."
            className="min-h-24"
          />
        </div>
        {error ? (
          <p
            className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-11">
              Kembali
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="h-11"
            variant="destructive"
            disabled={isPending || reason.trim().length < 10}
            onClick={handleCancel}
          >
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Membatalkan
              </>
            ) : (
              "Ya, batalkan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
