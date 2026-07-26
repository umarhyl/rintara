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
    },
    {
      label: "Kesempatan selesai",
      value: String(summary.completedOpportunityCount),
      description: summary.hasOpportunityGiverBadge
        ? "Badge pemberi kesempatan aktif"
        : "Belum ada badge",
    },
    {
      label: "Boost aktif",
      value: String(summary.activeBoostCount),
      description: "Pekerjaan dengan prioritas 24 jam",
    },
  ];

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Kredit Kesempatan"
        description="Gunakan satu kredit untuk boost 24 jam pada pekerjaan terbit milikmu. Kredit bukan uang dan tidak dapat dipindahkan."
      />

      <section
        aria-label="Ringkasan Kredit Kesempatan"
        className="grid border-y border-border/75 sm:grid-cols-3"
      >
        {summaries.map((item, index) => {
          return (
            <div
              key={item.label}
              className={`py-4 sm:px-5 ${
                index > 0 ? "border-t border-border/70 sm:border-l sm:border-t-0" : ""
              } ${index === 0 ? "sm:pl-0" : ""}`}
            >
              <p className="text-sm font-medium text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
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
