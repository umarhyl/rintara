import "server-only";

import { redirect } from "next/navigation";
import { ApplicationError } from "@/server/errors/application-error";
import type { RequestContext, RintaraRole } from "./types";
import { safeApplicationPath } from "./redirects";
import { getVerifiedAuthSubject } from "./verified-subject";

export type DashboardPageContext = RequestContext & {
  displayName: string;
};

function signInPath(nextPath: string): string {
  const next = safeApplicationPath(nextPath, "/account/continue");
  return `/sign-in?next=${encodeURIComponent(next)}`;
}

function redirectProtectedAccessError(
  error: unknown,
  nextPath: string,
): never {
  if (!(error instanceof ApplicationError)) {
    throw error;
  }

  if (error.code === "UNAUTHENTICATED") {
    redirect(signInPath(nextPath));
  }

  if (error.code === "ONBOARDING_REQUIRED") {
    redirect("/onboarding/role");
  }

  if (error.code === "ACCOUNT_INACTIVE") {
    redirect("/account-restricted");
  }

  throw error;
}

/**
 * Guards a role-scoped page with trusted account data from the server.
 *
 * Keep the database-backed query behind this dynamic import. This lets route
 * modules load during framework analysis without eagerly parsing database
 * configuration.
 */
export async function requireDashboardPageRole(
  role: RintaraRole,
  nextPath: string,
): Promise<DashboardPageContext> {
  let account: DashboardPageContext;

  try {
    await getVerifiedAuthSubject();
  } catch (error) {
    redirectProtectedAccessError(error, nextPath);
  }

  try {
    const { getCurrentUserDashboardContext } = await import(
      "@/server/queries/current-user"
    );
    account = await getCurrentUserDashboardContext();
  } catch (error) {
    redirectProtectedAccessError(error, nextPath);
  }

  if (account.role !== role) {
    redirect("/account/continue");
  }

  return account;
}

/**
 * Allows onboarding only for an authenticated identity whose Rintara profile
 * is not complete yet. Completed accounts resume through their role router.
 */
export async function requireOnboardingPage(): Promise<void> {
  try {
    await getVerifiedAuthSubject();
  } catch (error) {
    redirectProtectedAccessError(error, "/onboarding/role");
  }

  try {
    const { getCurrentUserDashboardContext } = await import(
      "@/server/queries/current-user"
    );
    await getCurrentUserDashboardContext();
  } catch (error) {
    if (
      error instanceof ApplicationError &&
      error.code === "ONBOARDING_REQUIRED"
    ) {
      return;
    }

    redirectProtectedAccessError(error, "/onboarding/role");
  }

  redirect("/account/continue");
}
