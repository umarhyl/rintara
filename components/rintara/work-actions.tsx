"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, LoaderCircle } from "lucide-react";
import {
  checkIn,
  checkOut,
  generateCheckInCode,
  verifyCompletion,
} from "@/server/domain/work/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const messages: Record<string, string> = {
  ACTIVE_REPORT_BLOCKS_COMPLETION:
    "Ada laporan aktif. Verifikasi dapat dilanjutkan setelah laporan selesai.",
  AGREEMENT_NOT_ACTIVE: "Mini Agreement belum aktif.",
  CODE_EXPIRED: "Kode sudah kedaluwarsa. Minta kode baru dari pemberi kerja.",
  CODE_INVALID: "Kode tidak cocok. Periksa enam digit dan coba lagi.",
  CODE_LOCKED: "Terlalu banyak percobaan gagal. Minta kode baru dari pemberi kerja.",
  FORBIDDEN: "Kamu tidak dapat melakukan tindakan ini.",
  INVALID_STATE_TRANSITION:
    "Status pekerjaan baru saja berubah. Muat ulang halaman untuk melihat aksi terbaru.",
  NOT_FOUND: "Sesi pekerjaan tidak ditemukan.",
  WORK_NOT_CHECKED_OUT: "Pekerja harus check-out sebelum verifikasi.",
};

function messageFor(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return messages[error.code] ?? "Tindakan belum bisa diproses.";
  }

  return "Koneksi terputus. Coba lagi sebentar lagi.";
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function GenerateCheckInCodeButton({
  agreementId,
  disabled,
}: {
  agreementId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; expiresAt: string } | null>(null);
  const submissionLockRef = useRef(false);

  function handleGenerate() {
    if (disabled || isPending || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const next = await generateCheckInCode(agreementId);
        setResult({ code: next.code, expiresAt: next.expiresAt });
        router.refresh();
        submissionLockRef.current = false;
      } catch (caughtError) {
        submissionLockRef.current = false;
        setError(messageFor(caughtError));
      }
    });
  }

  return (
    <div className="grid gap-4">
      <Button type="button" className="h-11 w-full" disabled={disabled || isPending} onClick={handleGenerate}>
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Membuat kode
          </>
        ) : (
          <>
            <KeyRound aria-hidden="true" />
            Buat kode check-in
          </>
        )}
      </Button>
      {result ? (
        <div className="rounded-xl border border-primary/25 bg-secondary/55 p-4 text-center">
          <p className="text-sm font-semibold text-primary">Tampil satu kali</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.16em]">
            {result.code}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Berlaku sampai {formatExpiry(result.expiresAt)} WIB. Jangan unggah kode
            ini ke ruang publik.
          </p>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckInForm({
  agreementId,
  disabled,
}: {
  agreementId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const submissionLockRef = useRef(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      disabled ||
      isPending ||
      code.length !== 6 ||
      submissionLockRef.current
    ) {
      return;
    }
    submissionLockRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        await checkIn({ agreementId, code });
        setCode("");
        router.refresh();
      } catch (caughtError) {
        submissionLockRef.current = false;
        setError(messageFor(caughtError));
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="code">Kode check-in</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          minLength={6}
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="h-12 rounded-xl text-center font-mono text-xl tracking-[0.25em]"
          disabled={disabled || isPending}
        />
      </div>
      {error ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11" disabled={disabled || isPending || code.length !== 6}>
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Check-in
          </>
        ) : (
          "Check-in"
        )}
      </Button>
    </form>
  );
}

export function CheckOutButton({
  agreementId,
  disabled,
}: {
  agreementId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const submissionLockRef = useRef(false);

  function handleCheckOut() {
    if (disabled || isPending || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        await checkOut({ agreementId, completionNote });
        setOpen(false);
        router.refresh();
      } catch (caughtError) {
        submissionLockRef.current = false;
        setError(messageFor(caughtError));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="h-11 w-full" disabled={disabled || isPending}>
          Check-out
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check-out pekerjaan?</DialogTitle>
          <DialogDescription>
            Waktu check-out akan dicatat dan pemberi kerja diminta memverifikasi
            penyelesaian.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="completion-note">Catatan penyelesaian</Label>
          <Textarea
            id="completion-note"
            value={completionNote}
            onChange={(event) => setCompletionNote(event.target.value.slice(0, 1000))}
            placeholder="Opsional"
            className="min-h-28"
            disabled={isPending}
          />
        </div>
        {error ? (
          <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Kembali
            </Button>
          </DialogClose>
          <Button type="button" disabled={isPending} onClick={handleCheckOut}>
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Check-out
              </>
            ) : (
              "Ya, check-out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VerifyCompletionButton({
  agreementId,
  disabled,
}: {
  agreementId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const submissionLockRef = useRef(false);

  function handleVerify() {
    if (disabled || isPending || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        await verifyCompletion(agreementId);
        setOpen(false);
        router.refresh();
      } catch (caughtError) {
        submissionLockRef.current = false;
        setError(messageFor(caughtError));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="h-11 w-full" disabled={disabled || isPending}>
          <Check aria-hidden="true" />
          Verifikasi pekerjaan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pekerjaan benar-benar selesai?</DialogTitle>
          <DialogDescription>
            Sesi, Mini Agreement, dan pekerjaan akan diselesaikan bersama. Satu
            Bukti Kerja diterbitkan ke Paspor Rintara pekerja.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Kembali
            </Button>
          </DialogClose>
          <Button type="button" disabled={isPending} onClick={handleVerify}>
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Memverifikasi
              </>
            ) : (
              "Ya, verifikasi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
