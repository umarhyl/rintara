import Image from "next/image";
import { Camera, LockKeyhole } from "lucide-react";

function formatUploadedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatBytes(value: number) {
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

export function WorkEvidenceView({
  evidence,
}: {
  evidence: {
    uploadedAt: string;
    byteSize: number;
    url: string;
  };
}) {
  return (
    <section
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-labelledby="work-evidence-title"
    >
      <header className="flex gap-3 border-b border-border/70 p-4 sm:p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Camera className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="work-evidence-title" className="font-semibold">
            Foto hasil pekerjaan
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Diunggah {formatUploadedAt(evidence.uploadedAt)} WIB ·{" "}
            {formatBytes(evidence.byteSize)}
          </p>
        </div>
      </header>
      <div className="relative aspect-[4/3] bg-muted">
        <Image
          src={evidence.url}
          alt="Foto hasil pekerjaan yang diunggah pekerja"
          fill
          unoptimized
          sizes="(max-width: 1023px) 100vw, 720px"
          className="object-contain"
        />
      </div>
      <p className="flex gap-2 border-t border-border/70 p-4 text-sm leading-6 text-muted-foreground">
        <LockKeyhole
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        Foto privat dan hanya tersedia bagi pekerja, pemberi kerja terkait,
        serta admin yang berwenang.
      </p>
    </section>
  );
}
