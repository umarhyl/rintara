import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ApplicationError } from "@/server/errors/application-error";
import { getVerifiedAuthSubject } from "@/server/auth/verified-subject";
import { safeApplicationPath } from "@/server/auth/redirects";
import { REGISTRATION_ONBOARDING_COOKIE } from "@/server/auth/environment";

export const dynamic = "force-dynamic";

export default async function ContinueAccountPage() {
  const cookieStore = await cookies();
  const registrationOnboardingPath = safeApplicationPath(
    cookieStore.get(REGISTRATION_ONBOARDING_COOKIE)?.value ?? null,
    "/register",
  );
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
      if (error.code === "ONBOARDING_REQUIRED") {
        redirect(registrationOnboardingPath);
      }
      if (error.code === "ACCOUNT_INACTIVE") redirect("/account-restricted");
      if (error.code === "UNAUTHENTICATED") redirect("/sign-in");
    }

    throw error;
  }
}
