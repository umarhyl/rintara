import { BadgeCheck, FileCheck2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/rintara/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { demoProofs as proofs } from "@/lib/demo-data";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export default async function PassportPage() {
  await requireDashboardPageRole("worker", "/worker/passport");

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Jejak terverifikasi"
        title="Paspor Rintara"
        description="Riwayat pengalaman dibentuk otomatis dari Bukti Kerja terverifikasi."
      />

      <section
        className="relative isolate overflow-hidden rounded-[2rem] bg-[#0a1c3f] text-white shadow-[0_30px_80px_-48px_rgb(15_42_104/0.92)]"
        aria-labelledby="passport-summary"
      >
        <div className="pointer-events-none absolute -left-24 -top-32 -z-10 size-96 rounded-full bg-blue-500/15 blur-3xl" aria-hidden="true" />

        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-7 sm:p-9 lg:p-11">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-blue-200/70">
              <FileCheck2 className="size-4" aria-hidden="true" /> Catatan pengalamanmu
            </div>
            <h2 id="passport-summary" className="mt-8 max-w-xl text-balance text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">
              Setiap pekerjaan selesai menjadi jejak yang bisa dipercaya.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-blue-100/70">
              Bukti Kerja tidak dapat diedit atau diunggah sendiri. Rintara menerbitkannya setelah penyelesaian diverifikasi pemberi kerja.
            </p>
            <div className="mt-9 flex items-center gap-3 text-sm text-blue-100/70">
              <ShieldCheck className="size-4 text-emerald-300" aria-hidden="true" />
              Riwayat berasal dari proses kerja yang terverifikasi
            </div>
          </div>

          <dl className="grid border-t border-white/12 bg-white/[0.045] backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-1 lg:border-l lg:border-t-0">
            <div className="flex min-h-40 flex-col justify-between p-6 sm:p-7">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/65">Bukti Kerja</dt>
              <dd>
                <span className="block text-5xl font-semibold tracking-[-0.06em]">{proofs.length}</span>
                <span className="mt-2 block text-sm text-blue-100/65">Terverifikasi dari 1 kategori</span>
              </dd>
            </div>
            <div className="flex min-h-40 flex-col justify-between border-t border-white/12 p-6 sm:border-l sm:border-t-0 sm:p-7 lg:border-l-0 lg:border-t">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/65">Kategori berpengalaman</dt>
              <dd>
                <span className="block text-xl font-semibold">Light Cleaning</span>
                <span className="mt-2 block text-base leading-7 text-blue-100/65">Kategori lain tetap dapat menjadi First Opportunity.</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="proof-history">
        <div className="grid gap-5 border-b border-border/75 pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Arsip otomatis</p>
            <h2 id="proof-history" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Riwayat Bukti Kerja</h2>
          </div>
          <p className="text-sm text-muted-foreground">{proofs.length} bukti diterbitkan</p>
        </div>

        <ol className="mt-1" aria-label="Bukti Kerja terverifikasi">
          {proofs.map((proof, index) => (
            <li key={proof.id} className="group relative grid gap-5 border-b border-border/70 py-7 sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:gap-6">
              <div className="relative hidden h-full sm:block" aria-hidden="true">
                {index < proofs.length - 1 ? <span className="absolute left-1/2 top-8 h-[calc(100%+1.75rem)] w-px -translate-x-1/2 bg-border" /> : null}
                <span className="relative mx-auto mt-2 grid size-9 place-items-center rounded-full border border-success/25 bg-success-soft text-success">
                  <BadgeCheck className="size-4" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">{proof.category}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] transition-colors duration-500 group-hover:text-primary">{proof.jobTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {proof.employer} <span aria-hidden="true">·</span> {proof.area}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Selesai pada <time>{proof.completedAt}</time>
                </p>
              </div>
              <StatusBadge status="success">Terverifikasi</StatusBadge>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
