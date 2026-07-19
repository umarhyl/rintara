import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  MapPin,
  RefreshCcw,
} from "lucide-react";
import { notFound } from "next/navigation";

import { ConfirmAction } from "@/components/rintara/confirm-action";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { demoApplicants } from "@/lib/demo-data";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboardPageRole(
    "employer",
    `/employer/jobs/${encodeURIComponent(id)}/applicants`,
  );
  if (id !== "kru-acara-akhir-pekan") notFound();

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Kru Acara Akhir Pekan"
        title="Pilih dari catatan yang relevan"
        description="Kelayakan kategori diperiksa kembali saat satu pekerja diterima. Upah dan ketentuan pekerjaan tetap sama untuk setiap pelamar."
        action={
          <div className="text-left sm:text-right">
            <p className="text-3xl font-semibold tracking-[-0.04em]">02</p>
            <p className="text-sm text-muted-foreground">pelamar aktif</p>
          </div>
        }
      />

      <div className="border-y border-border/70">
        {demoApplicants.map((applicant, index) => (
          <article
            key={applicant.id}
            className="grid gap-6 border-b border-border/70 py-8 last:border-b-0 lg:grid-cols-[3.5rem_minmax(0,1fr)_14rem] lg:gap-8 lg:py-10"
          >
            <div className="flex items-start gap-3 lg:block">
              <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
                0{index + 1}
              </span>
              <span
                className="mt-2 hidden h-14 w-px bg-gradient-to-b from-primary/60 to-transparent lg:block"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                    {applicant.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4 text-primary" aria-hidden="true" />
                      {applicant.area}
                    </span>
                    <span className="flex items-center gap-2">
                      <FileCheck2 className="size-4 text-primary" aria-hidden="true" />
                      {applicant.proofCount === 0
                        ? "Belum memiliki Bukti Kerja"
                        : `${applicant.proofCount} Bukti Kerja di kategori lain`}
                    </span>
                  </div>
                </div>
                <StatusBadge status={applicant.eligible ? "success" : "warning"}>
                  {applicant.eligible ? (
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                  ) : null}
                  {applicant.eligible
                    ? "Memenuhi syarat kategori"
                    : "Perlu diperiksa ulang"}
                </StatusBadge>
              </div>

              <blockquote className="mt-6 border-l-2 border-primary/30 pl-5 text-base leading-7 text-foreground/85">
                “{applicant.note}”
              </blockquote>
            </div>

            <div className="flex flex-col justify-center gap-3 border-t border-border/70 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              <Button variant="outline" type="button" className="w-full justify-between">
                Lihat Paspor
                <ArrowRight aria-hidden="true" />
              </Button>
              <div className="[&>button]:w-full">
                <ConfirmAction
                  triggerLabel="Terima pekerja"
                  title={`Terima ${applicant.name}?`}
                  description="Satu pekerja akan diterima, semua lamaran lain ditolak, dan pekerjaan menjadi terisi. Kesepakatan Kerja dibuat dari ketentuan yang sudah diterbitkan."
                  confirmLabel="Ya, terima pekerja"
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <RefreshCcw className="text-primary" aria-hidden="true" />
        <AlertTitle>Status dapat berubah saat ditinjau</AlertTitle>
        <AlertDescription>
          Jika pekerja lain telah lebih dulu diterima, muat ulang halaman untuk
          melihat hasil terbaru. Tidak ada penerimaan sebagian yang disimpan.
        </AlertDescription>
      </Alert>
    </div>
  );
}
