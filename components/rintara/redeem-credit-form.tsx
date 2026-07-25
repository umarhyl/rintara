"use client";

import { useState, useTransition } from "react";
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

  function handleRedeem() {
    if (!creditId || !jobId || isPending) return;
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
      }
    });
  }

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/75 backdrop-blur-sm">
        <header className="border-b border-border/70 px-6 py-7 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Pilih sumber
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Kredit aktif
          </h2>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            Setiap kredit berasal dari satu Kesempatan Pertama yang selesai dan
            hanya dapat ditebus satu kali.
          </p>
        </header>

        <div className="px-6 py-7 sm:px-8">
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
                  className={`group flex min-h-24 cursor-pointer items-center gap-4 px-1 py-5 transition-colors duration-300 hover:bg-muted/45 has-[[data-state=checked]]:bg-primary/5 ${
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
            <p className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
              Belum ada Kredit Kesempatan aktif yang dapat digunakan.
            </p>
          )}

          <div className="mt-8 grid gap-3 border-t border-border/70 pt-7 sm:grid-cols-[10rem_1fr] sm:items-center">
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

      <aside className="rounded-[1.5rem] bg-foreground p-6 text-background shadow-[0_28px_70px_-44px_rgb(15_23_42/0.7)] lg:sticky lg:top-24">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-background/70">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Ringkasan boost
        </p>
        <p className="mt-5 text-5xl font-semibold tracking-[-0.06em]">24</p>
        <p className="mt-1 text-sm text-background/70">jam sejak aktivasi</p>

        <p className="mt-5 text-base leading-7 text-background/65">
          Boost yang sudah aktif tidak dapat ditumpuk. Jika server menemukan
          konflik, kredit tidak digunakan.
        </p>
        <Button
          type="button"
          className="theme-static-light mt-6 h-11 w-full bg-background text-foreground hover:bg-background/90"
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
          <p className="mt-4 rounded-xl border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-100" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-xl border border-green-300/30 bg-green-300/10 p-3 text-sm text-green-100" role="status">
            {success}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
