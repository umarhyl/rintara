"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  CircleX,
  HandCoins,
  ImageUp,
  KeyRound,
  LoaderCircle,
} from "lucide-react";
import {
  confirmCashPaymentReceipt,
  markCashPaymentPaid,
} from "@/server/domain/payment-confirmations/actions";
import {
  checkIn,
  checkOut,
  generateCheckInCode,
  verifyCompletion,
} from "@/server/domain/work/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  WORK_EVIDENCE_INVALID:
    "Gunakan satu foto JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.",
  WORK_EVIDENCE_REQUIRED:
    "Unggah satu foto hasil pekerjaan sebelum check-out.",
  RATE_LIMITED:
    "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  CASH_PAYMENT_CONFIRMATION_NOT_AVAILABLE:
    "Konfirmasi pembayaran tunai belum tersedia untuk pekerjaan ini.",
  CASH_PAYMENT_CONFIRMATION_NOT_PENDING:
    "Status konfirmasi pembayaran sudah berubah. Muat ulang halaman.",
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

export function WorkEvidenceUpload({
  agreementId,
  hasEvidence,
  disabled,
}: {
  agreementId: string;
  hasEvidence: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [privacyAttested, setPrivacyAttested] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file || !privacyAttested || pending || disabled) return;

    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("photo", file);
    formData.set("privacyAttested", String(privacyAttested));

    try {
      const response = await fetch(
        `/api/work-evidence/${encodeURIComponent(agreementId)}`,
        {
          method: "POST",
          body: formData,
        },
      );
      const payload = (await response.json()) as {
        code?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(
          payload.code
            ? messages[payload.code] ?? payload.message ?? "Foto belum dapat disimpan."
            : "Foto belum dapat disimpan.",
        );
        return;
      }

      setFile(null);
      setPrivacyAttested(false);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Koneksi terputus saat mengunggah foto. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="grid gap-4 rounded-xl border border-border bg-muted/25 p-4"
      aria-labelledby="work-evidence-upload-title"
    >
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Camera className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 id="work-evidence-upload-title" className="font-semibold">
            Foto hasil pekerjaan
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Wajib satu foto tanpa orang atau informasi pribadi. JPG, PNG, atau
            WebP maksimal 5 MB.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="work-evidence-photo">
          {hasEvidence ? "Ganti foto sebelum check-out" : "Pilih foto"}
        </Label>
        <Input
          ref={inputRef}
          id="work-evidence-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={disabled || pending}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(null);
          }}
          className="h-auto min-h-12 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-medium file:text-primary"
        />
      </div>

      <div className="flex min-h-11 items-start gap-3">
        <Checkbox
          id="work-evidence-privacy"
          checked={privacyAttested}
          onCheckedChange={(value) => setPrivacyAttested(value === true)}
          disabled={disabled || pending}
          className="mt-1"
        />
        <Label
          htmlFor="work-evidence-privacy"
          className="cursor-pointer text-sm font-normal leading-6"
        >
          Saya memiliki izin memotret area ini dan memastikan foto tidak
          memuat orang, dokumen, atau informasi pribadi.
        </Label>
      </div>

      <Button
        type="button"
        variant={hasEvidence ? "outline" : "default"}
        className="h-11"
        disabled={disabled || pending || !file || !privacyAttested}
        onClick={handleUpload}
      >
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Memproses foto
          </>
        ) : (
          <>
            <ImageUp aria-hidden="true" />
            {hasEvidence ? "Ganti foto" : "Unggah foto"}
          </>
        )}
      </Button>

      {hasEvidence ? (
        <p className="text-sm font-medium text-success" role="status">
          Foto tersimpan. Kamu dapat check-out.
        </p>
      ) : null}
      {error ? (
        <p
          className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
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

export function MarkCashPaymentPaidButton({
  agreementId,
  isRetry = false,
}: {
  agreementId: string;
  isRetry?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const submissionLockRef = useRef(false);

  function handleSubmit() {
    if (isPending || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        await markCashPaymentPaid(agreementId);
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
        <Button type="button" className="h-11 w-full" disabled={isPending}>
          <HandCoins aria-hidden="true" />
          {isRetry ? "Tandai sudah dibayar lagi" : "Tandai tunai sudah dibayar"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Uang tunai sudah diberikan?</DialogTitle>
          <DialogDescription>
            Rintara hanya mencatat pernyataanmu dan tidak memproses pembayaran.
            Pekerja memiliki waktu 48 jam untuk mengonfirmasi sudah atau belum
            menerima.
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
          <Button type="button" disabled={isPending} onClick={handleSubmit}>
            {isPending ? (
              <><LoaderCircle className="animate-spin" aria-hidden="true" />Menyimpan</>
            ) : "Ya, sudah diberikan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmCashPaymentReceiptButtons({
  agreementId,
  allowReceived = true,
}: {
  agreementId: string;
  allowReceived?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const submissionLockRef = useRef(false);

  function handleResponse(received: boolean) {
    if (isPending || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        await confirmCashPaymentReceipt({ agreementId, received });
        router.refresh();
      } catch (caughtError) {
        submissionLockRef.current = false;
        setError(messageFor(caughtError));
      }
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {allowReceived ? (
        <Button
          type="button"
          className="h-11"
          disabled={isPending}
          onClick={() => handleResponse(true)}
        >
          <Check aria-hidden="true" />
          Sudah saya terima
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="h-11"
        disabled={isPending}
        onClick={() => handleResponse(false)}
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <CircleX aria-hidden="true" />
        )}
        Belum saya terima
      </Button>
      {error ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
