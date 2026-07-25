"use client";

import { useState, useTransition } from "react";
import { Flag, LoaderCircle } from "lucide-react";
import { createReport } from "@/server/domain/reports/actions";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReportReason =
  | "suspicious_job"
  | "terms_mismatch"
  | "absence"
  | "unsafe_behavior"
  | "spam"
  | "other";

function messageFor(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code === "NOT_FOUND"
      ? "Target laporan tidak tersedia."
      : "Laporan belum bisa dikirim.";
  }
  return "Koneksi terputus. Coba lagi sebentar lagi.";
}

export function ReportProblem({
  jobId,
  agreementId,
  reportedUserId,
}: {
  jobId?: string;
  agreementId?: string;
  reportedUserId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!reason || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await createReport({
          reason,
          description,
          jobId,
          agreementId,
          reportedUserId,
        });
        setOpen(false);
        setReason("");
        setDescription("");
      } catch (caughtError) {
        setError(messageFor(caughtError));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-11">
          <Flag aria-hidden="true" />
          Laporkan masalah
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan masalah</DialogTitle>
          <DialogDescription className="text-base leading-7">
            Gunakan keterangan faktual. Laporan dapat menjeda penyelesaian
            pekerjaan terkait, tetapi Rintara tidak menyelesaikan sengketa hukum
            atau pembayaran.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="report-reason">Alasan laporan</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              <SelectTrigger
                id="report-reason"
                className="h-11 w-full"
                aria-label="Alasan laporan"
              >
                <SelectValue placeholder="Pilih alasan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terms_mismatch">Ketentuan tidak sesuai</SelectItem>
                <SelectItem value="absence">Masalah kehadiran</SelectItem>
                <SelectItem value="unsafe_behavior">Kekhawatiran keamanan</SelectItem>
                <SelectItem value="suspicious_job">Pekerjaan mencurigakan</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-description">
              Keterangan{" "}
              <span className="font-normal text-muted-foreground">
                (opsional)
              </span>
            </Label>
            <Textarea
              id="report-description"
              value={description}
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Jelaskan kejadian dan waktu secara ringkas"
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-11" disabled={isPending}>
              Kembali
            </Button>
          </DialogClose>
          <Button type="button" className="h-11" disabled={!reason || isPending} onClick={handleSubmit}>
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Mengirim
              </>
            ) : (
              "Kirim laporan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
