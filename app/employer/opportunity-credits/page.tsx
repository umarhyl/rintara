import { Clock3, FileCheck2, TicketCheck } from "lucide-react";

import { RedeemCreditForm } from "@/components/rintara/redeem-credit-form";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { getMyCreditSummary } from "@/server/queries/rewards/employer-credits";

export default async function CreditsPage() {
  await requireDashboardPageRole("employer", "/employer/opportunity-credits");
  const summary = await getMyCreditSummary();

  const summaries = [
    {
      label: "Kredit aktif",
      value: `${summary.activeCreditCount} / 3`,
      description: "Batas maksimum tiga kredit aktif",
      icon: TicketCheck,
    },
    {
      label: "Kesempatan selesai",
      value: String(summary.completedOpportunityCount),
      description: summary.hasOpportunityGiverBadge
        ? "Badge pemberi kesempatan aktif"
        : "Belum ada badge",
      icon: FileCheck2,
    },
    {
      label: "Boost aktif",
      value: String(summary.activeBoostCount),
      description: "Pekerjaan dengan prioritas 24 jam",
      icon: Clock3,
    },
  ];

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Jejak pemberi kesempatan"
        title="Ubah satu kredit menjadi 24 jam visibilitas"
        description="Kredit Kesempatan adalah manfaat produk, bukan uang, tidak dapat dipindahkan, dan digunakan satu kali untuk pekerjaan terbit milikmu."
      />

      <section
        aria-label="Ringkasan Kredit Kesempatan"
        className="grid border-y border-border/70 sm:grid-cols-3"
      >
        {summaries.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`grid grid-cols-[auto_1fr] gap-4 py-5 sm:px-6 ${
                index > 0 ? "border-t border-border/70 sm:border-l sm:border-t-0" : ""
              } ${index === 0 ? "sm:pl-0" : ""}`}
            >
              <Icon className="mt-1 size-4 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <RedeemCreditForm
        credits={summary.credits}
        targetJobs={summary.targetJobs}
      />
    </div>
  );
}
