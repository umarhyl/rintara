"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import {
  adminResolveReport,
  adminStartReportReview,
} from "@/server/domain/reports/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function optionalId(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function AdminReportActions({
  reportId,
  status,
  hasJobTarget,
  hasUserTarget,
}: {
  reportId: string;
  status: "open" | "reviewing" | "resolved" | "rejected";
  hasJobTarget: boolean;
  hasUserTarget: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [hideJob, setHideJob] = useState(false);
  const [cancelJob, setCancelJob] = useState(false);
  const [suspendUser, setSuspendUser] = useState(false);
  const [revokeWorkProofId, setRevokeWorkProofId] = useState("");
  const [revokeCreditId, setRevokeCreditId] = useState("");
  const [deactivateBoostId, setDeactivateBoostId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const submissionLockRef = useRef(false);

  useEffect(() => {
    submissionLockRef.current = false;
  }, [reportId, status]);

  function startReview() {
    if (isPending || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        await adminStartReportReview(reportId);
        router.refresh();
      } catch {
        submissionLockRef.current = false;
        setError("Laporan belum bisa mulai ditinjau.");
      }
    });
  }

  function resolve(outcome: "resolved" | "rejected") {
    if (
      isPending ||
      note.trim().length < 10 ||
      submissionLockRef.current
    ) {
      return;
    }
    submissionLockRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        await adminResolveReport({
          reportId,
          outcome,
          moderatorNote: note,
          actions: {
            hideJob,
            cancelJob,
            suspendUser,
            revokeWorkProofId: optionalId(revokeWorkProofId),
            revokeCreditId: optionalId(revokeCreditId),
            deactivateBoostId: optionalId(deactivateBoostId),
          },
        });
        router.refresh();
      } catch {
        submissionLockRef.current = false;
        setError("Keputusan belum bisa disimpan. Pastikan catatan minimal 10 karakter.");
      }
    });
  }

  if (status === "open") {
    return (
      <div className="grid gap-3">
        <Button type="button" onClick={startReview} disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          Mulai tinjau
        </Button>
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
    );
  }

  if (status !== "reviewing") {
    return <p className="text-sm text-muted-foreground">Laporan sudah memiliki keputusan.</p>;
  }

  return (
    <div className="grid gap-5">
      <div className="divide-y divide-border/70 border-y border-border/70">
        {hasJobTarget ? (
          <>
            <label className="flex min-h-14 items-center gap-3 py-3">
              <Checkbox checked={hideJob} onCheckedChange={(value) => setHideJob(value === true)} />
              <span>Sembunyikan pekerjaan</span>
            </label>
            <label className="flex min-h-14 items-center gap-3 py-3">
              <Checkbox checked={cancelJob} onCheckedChange={(value) => setCancelJob(value === true)} />
              <span>Batalkan pekerjaan belum selesai</span>
            </label>
          </>
        ) : null}
        {hasUserTarget ? (
          <label className="flex min-h-14 items-center gap-3 py-3">
            <Checkbox checked={suspendUser} onCheckedChange={(value) => setSuspendUser(value === true)} />
            <span>Tangguhkan akun terlapor</span>
          </label>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={`revoke-proof-${reportId}`}>ID Work Proof dicabut</Label>
          <Input
            id={`revoke-proof-${reportId}`}
            value={revokeWorkProofId}
            onChange={(event) => setRevokeWorkProofId(event.target.value)}
            placeholder="UUID Work Proof"
            inputMode="text"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`revoke-credit-${reportId}`}>ID kredit dicabut</Label>
          <Input
            id={`revoke-credit-${reportId}`}
            value={revokeCreditId}
            onChange={(event) => setRevokeCreditId(event.target.value)}
            placeholder="UUID kredit"
            inputMode="text"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`deactivate-boost-${reportId}`}>ID boost dinonaktifkan</Label>
          <Input
            id={`deactivate-boost-${reportId}`}
            value={deactivateBoostId}
            onChange={(event) => setDeactivateBoostId(event.target.value)}
            placeholder="UUID boost"
            inputMode="text"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`moderator-note-${reportId}`}>Catatan keputusan faktual</Label>
        <Textarea
          id={`moderator-note-${reportId}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-28"
          placeholder="Ringkas bukti dan alasan keputusan"
        />
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="destructive" disabled={isPending || note.trim().length < 10} onClick={() => resolve("rejected")}>
          Tolak laporan
        </Button>
        <Button type="button" disabled={isPending || note.trim().length < 10} onClick={() => resolve("resolved")}>
          Selesaikan laporan
        </Button>
      </div>
    </div>
  );
}
