"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { withdrawApplication } from "@/server/domain/applications/actions";
import { Button } from "@/components/ui/button";

const errorMessages: Record<string, string> = {
  APPLICATION_NOT_FOUND: "Lamaran tidak ditemukan.",
  APPLICATION_NOT_WITHDRAWABLE: "Lamaran ini sudah tidak dapat ditarik.",
  FORBIDDEN: "Kamu tidak dapat menarik lamaran ini.",
};

function messageFor(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return errorMessages[error.code] ?? "Lamaran belum bisa ditarik.";
  }

  return "Koneksi terputus saat menarik lamaran. Coba lagi sebentar lagi.";
}

export function WithdrawApplicationButton({
  applicationId,
}: {
  applicationId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleWithdraw() {
    setError(null);
    startTransition(async () => {
      try {
        await withdrawApplication(applicationId);
      } catch (caughtError) {
        setError(messageFor(caughtError));
      }
    });
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-full"
        disabled={isPending}
        onClick={handleWithdraw}
      >
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Menarik
          </>
        ) : (
          "Tarik lamaran"
        )}
      </Button>
      {error ? (
        <p className="text-xs leading-5 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
