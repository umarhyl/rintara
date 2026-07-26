import { notFound } from "next/navigation";
import { AgreementConfirmationView } from "@/components/rintara/agreement-confirmation-view";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { ApplicationError } from "@/server/errors/application-error";
import {
  getAgreement,
  type AgreementView,
} from "@/server/queries/agreements/get-agreement";

export const dynamic = "force-dynamic";

export default async function EmployerAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDashboardPageRole(
    "employer",
    `/employer/agreements/${encodeURIComponent(id)}`,
  );

  let agreement: AgreementView;

  try {
    agreement = await getAgreement(id);
  } catch (error) {
    if (
      error instanceof ApplicationError &&
      (error.code === "NOT_FOUND" || error.code === "VALIDATION_FAILED")
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <AgreementConfirmationView agreement={agreement} role="employer" />
  );
}
