"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { redeemOpportunityCredit } from "@/server/domain/rewards/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/rintara/status-badge";
import type {
  BoostTargetJob,
  EmployerCreditView,
} from "@/server/queries/rewards/employer-credits";

function messageFor(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    const messages: Record<string, string> = {
      BOOST_ALREADY_ACTIVE:
        "Pekerjaan ini sudah memiliki boost aktif. Kredit belum digunakan.",
      CREDIT_NOT_AVAILABLE: "Kredit ini sudah tidak tersedia.",
      IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_INPUT:
        "Permintaan ini sudah pernah digunakan untuk input berbeda.",
      JOB_NOT_OWNED: "Pekerjaan bukan milik akun ini.",
      JOB_NOT_PUBLISHED: "Pekerjaan harus terbit dan terlihat.",
    };
    return messages[error.code] ?? "Boost belum bisa diaktifkan.";
  }

  return "Koneksi terputus. Coba lagi sebentar lagi.";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

export function RedeemCreditForm({
  credits,
  targetJobs,
}: {
  credits: EmployerCreditView[];
  targetJobs: BoostTargetJob[];
}) {
  const router = useRouter();
  const availableCredits = credits.filter((credit) => credit.status === "earned");
  const availableJobs = targetJobs.filter((job) => !job.hasActiveBoost);
  const [creditId, setCreditId] = useState(availableCredits[0]?.id ?? "");
  const [jobId, setJobId] = useState(availableJobs[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const submissionLockRef = useRef(false);

  function handleRedeem() {
    if (!creditId || !jobId || isPending || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await redeemOpportunityCredit({
          creditId,
          jobId,
          idempotencyKey,
        });
        setSuccess(
          `Boost aktif sampai ${new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Jakarta",
          }).format(new Date(result.endsAt))}.`,
        );
        setIdempotencyKey(crypto.randomUUID());
        router.refresh();
      } catch (caughtError) {
        setError(messageFor(caughtError));
      } finally {
        submissionLockRef.current = false;
      }
    });
  }

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="border-b border-border/70 p-5 sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Pilih kredit
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Setiap kredit berasal dari satu Kesempatan Pertama yang selesai dan
            hanya dapat ditebus satu kali.
          </p>
        </header>

        <div className="p-5 sm:p-6">
          {availableCredits.length > 0 ? (
            <RadioGroup
              value={creditId}
              onValueChange={setCreditId}
              aria-label="Pilih kredit aktif"
              className="gap-0 border-y border-border/70"
            >
              {availableCredits.map((credit, index) => (
                <Label
                  key={credit.id}
                  htmlFor={credit.id}
                  className={`group flex min-h-20 cursor-pointer items-center gap-4 px-1 py-4 transition-colors duration-200 hover:bg-muted/45 has-[[data-state=checked]]:bg-primary/5 ${
                    index > 0 ? "border-t border-border/70" : ""
                  }`}
                >
                  <RadioGroupItem id={credit.id} value={credit.id} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold tracking-[-0.01em]">
                      {credit.sourceJobTitle}
                    </span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      Diperoleh {formatDate(credit.earnedAt)}
                    </span>
                  </span>
                  <StatusBadge status="success">Aktif</StatusBadge>
                </Label>
              ))}
            </RadioGroup>
          ) : (
            <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
              Belum ada Kredit Kesempatan aktif yang dapat digunakan.
            </p>
          )}

          <div className="mt-6 grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-[10rem_1fr] sm:items-center">
            <Label htmlFor="boost-job">Pekerjaan terbit</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger id="boost-job" className="h-11 w-full">
                <SelectValue placeholder="Pilih pekerjaan tanpa boost aktif" />
              </SelectTrigger>
              <SelectContent>
                {availableJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Boost 24 jam
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Boost yang sudah aktif tidak dapat ditumpuk. Jika server menemukan
          konflik, kredit tidak digunakan.
        </p>
        <Button
          type="button"
          className="mt-5 h-11 w-full"
          disabled={!creditId || !jobId || isPending}
          onClick={handleRedeem}
        >
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Mengaktifkan
            </>
          ) : (
            "Gunakan 1 kredit"
          )}
        </Button>
        {error ? (
          <p className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-xl border border-success/25 bg-success/10 p-3 text-sm text-success" role="status">
            {success}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
