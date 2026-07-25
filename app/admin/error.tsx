"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route failed", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <section
      className="grid min-h-[24rem] place-items-center rounded-[1.5rem] border border-border/75 bg-card/80 p-7 text-center"
      role="alert"
    >
      <div className="max-w-md">
        <AlertTriangle className="mx-auto size-9 text-destructive" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
          Halaman admin belum bisa dimuat
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Periksa koneksi database atau sesi admin, lalu coba muat ulang.
        </p>
        <Button type="button" onClick={reset} className="mt-6">
          <RotateCw aria-hidden="true" />
          Coba lagi
        </Button>
      </div>
    </section>
  );
}
