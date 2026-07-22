import { redirect } from "next/navigation";
import { ApplicationError } from "@/server/errors/application-error";
import { getVerifiedAuthSubject } from "@/server/auth/verified-subject";

export const dynamic = "force-dynamic";

export default async function ContinueAccountPage() {
  try {
    await getVerifiedAuthSubject();
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "UNAUTHENTICATED") {
      redirect("/sign-in");
    }

    throw error;
  }

  try {
    const { getCurrentUserDashboardContext } = await import("@/server/queries/current-user");
    const account = await getCurrentUserDashboardContext();

    if (account.role === "worker") redirect("/worker/dashboard");
    if (account.role === "employer") redirect("/employer/dashboard");
    redirect("/admin");
  } catch (error) {
    if (error instanceof ApplicationError) {
      if (error.code === "ONBOARDING_REQUIRED") redirect("/onboarding/role");
      if (error.code === "ACCOUNT_INACTIVE") redirect("/account-restricted");
      if (error.code === "UNAUTHENTICATED") redirect("/sign-in");
    }

    throw error;
  }
}
