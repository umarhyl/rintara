import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parsePublicAccountState } from "@/features/auth/use-public-auth-state";
import { parseWorkerJobApplicationState } from "@/features/jobs/worker-job-application-state";

describe("public job application account flow", () => {
  test("parses only the supported presentation states and roles", () => {
    expect(
      parsePublicAccountState({
        authenticated: false,
        state: "ready",
        role: "worker",
      }),
    ).toEqual({ kind: "anonymous" });
    expect(
      parsePublicAccountState({
        authenticated: true,
        state: "onboarding",
        role: null,
      }),
    ).toEqual({ kind: "onboarding", role: null, displayName: null });
    expect(
      parsePublicAccountState({
        authenticated: true,
        state: "onboarding",
        role: "worker",
      }),
    ).toEqual({
      kind: "onboarding",
      role: "worker",
      displayName: null,
    });
    expect(
      parsePublicAccountState({
        authenticated: true,
        state: "ready",
        role: "worker",
        displayName: "  Sari Utami  ",
      }),
    ).toEqual({
      kind: "ready",
      role: "worker",
      displayName: "Sari Utami",
    });
    expect(
      parsePublicAccountState({
        authenticated: true,
        state: "inactive",
        role: "employer",
      }),
    ).toEqual({
      kind: "inactive",
      role: "employer",
      displayName: null,
    });
    expect(
      parsePublicAccountState({
        authenticated: true,
        state: "ready",
        role: "untrusted-role",
      }),
    ).toEqual({ kind: "unavailable" });
    expect(parsePublicAccountState({ authenticated: true })).toEqual({
      kind: "unavailable",
    });
  });

  test("derives detailed account presentation from verified server state", () => {
    const route = readFileSync("app/auth/status/route.ts", "utf8");
    const query = readFileSync(
      "server/queries/public-account-state.ts",
      "utf8",
    );
    const detailIndex = route.indexOf(
      'request.nextUrl.searchParams.get("detail")',
    );
    const queryIndex = route.indexOf(
      "const accountState = await getPublicAccountPresentationState()",
    );

    expect(route).toContain(
      'request.headers.get("x-rintara-verified-session") === "authenticated"',
    );
    expect(detailIndex).toBeGreaterThan(-1);
    expect(queryIndex).toBeGreaterThan(detailIndex);
    expect(route).toContain('state: "unavailable"');
    expect(route).not.toContain('searchParams.get("role")');
    expect(route).not.toContain('headers.get("x-rintara-role")');
    expect(route).not.toContain("@/server/db");

    expect(query).toContain(
      "const authSubject = await getVerifiedAuthSubject()",
    );
    expect(query).toContain(".where(eq(users.authSubject, authSubject))");
    expect(query).toContain("hasCompleteRoleProfile(account)");
    expect(query).toContain("workerDisplayName: workerProfiles.displayName");
    expect(query).toContain(
      "employerDisplayName: employerProfiles.displayName",
    );
    expect(query).toContain('account.status !== "active"');
    expect(query).toContain('state: "onboarding"');
    expect(query).toContain('state: "ready"');
    expect(query).toContain('state: "inactive"');
  });

  test("shows a safe action for every account state", () => {
    const action = readFileSync(
      "components/rintara/job-apply-auth-action.tsx",
      "utf8",
    );
    const hook = readFileSync(
      "features/auth/use-public-auth-state.ts",
      "utf8",
    );

    expect(action).toContain("usePublicAccountState");
    expect(action).toContain('accountState.kind === "checking"');
    expect(action).toContain('accountState.kind === "anonymous"');
    expect(action).toContain('accountState.kind === "onboarding"');
    expect(action).toContain('accountState.kind === "inactive"');
    expect(action).toContain('accountState.kind === "unavailable"');
    expect(action).toContain(
      'accountState.kind === "ready" && accountState.role === "worker"',
    );
    expect(action).toContain(
      "fetch(`/jobs/${jobId}/application-status`",
    );
    expect(action).toContain('check.value.state === "eligible"');
    expect(action).toContain('value.state === "ineligible"');
    expect(action).toContain('value.state === "unavailable"');
    expect(action).toContain('value.applicationStatus');
    expect(action).toContain("<JobApplicationForm jobId={jobId} />");
    expect(action).toContain(
      'href={{ pathname: "/sign-in", query: { next: `/jobs/${jobId}` } }}',
    );
    expect(action).toContain('href: "/employer/dashboard"');
    expect(action).toContain('href: "/admin"');
    expect(action).toContain('href="/account-restricted"');
    expect(action).toContain("onClick={retry}");
    expect(action).not.toContain("supabase.auth");

    expect(hook).toContain(
      'export type PublicAuthState = "checking" | "anonymous" | "signed-in"',
    );
    expect(hook).toContain('fetch("/auth/status?detail=account"');
    expect(hook).toContain("AUTH_STATE_RETRY_CACHE_MS");
    expect(hook).toContain(
      'state.kind === "ready" || state.kind === "anonymous"',
    );
    expect(hook).toContain("return 0;");
  });

  test("accepts only safe worker application presentation states", () => {
    expect(parseWorkerJobApplicationState({ state: "eligible" })).toEqual({
      state: "eligible",
    });
    expect(
      parseWorkerJobApplicationState({
        state: "existing",
        applicationStatus: "accepted",
        agreementId: "agreement-id",
      }),
    ).toEqual({
      state: "existing",
      applicationStatus: "accepted",
      agreementId: "agreement-id",
    });
    expect(
      parseWorkerJobApplicationState({
        state: "existing",
        applicationStatus: "unknown",
      }),
    ).toBeNull();
    expect(parseWorkerJobApplicationState({ state: "admin" })).toBeNull();
    expect(parseWorkerJobApplicationState(null)).toBeNull();
  });

  test("keeps the application-state read private and server-authorized", () => {
    const route = readFileSync(
      "app/jobs/[id]/application-status/route.ts",
      "utf8",
    );
    const query = readFileSync(
      "server/queries/applications/worker-job-application.ts",
      "utf8",
    );

    expect(route).toContain('"Cache-Control": "private, no-store, max-age=0"');
    expect(route).toContain('Vary: "Cookie"');
    expect(route).toContain("getWorkerJobApplicationState(id)");
    expect(route).not.toContain("error.message");
    expect(query).toContain("assertActiveUser");
    expect(query).toContain('"worker"');
    expect(query).toContain("workProofs.verificationStatus");
    expect(query).toContain("workProofs.revokedAt");
    expect(query).not.toContain("jobPrivateDetails");
    expect(query).not.toContain("fullAddress");
  });

  test("keeps recoverable form input and offers recovery routes", () => {
    const form = readFileSync(
      "components/rintara/job-application-form.tsx",
      "utf8",
    );
    const resetIndex = form.indexOf("formRef.current?.reset()");
    const catchIndex = form.indexOf("catch (caughtError)");

    for (const code of [
      "UNAUTHENTICATED",
      "ONBOARDING_REQUIRED",
      "ROLE_REQUIRED",
      "ACCOUNT_INACTIVE",
      "FORBIDDEN",
      "APPLICATION_ALREADY_EXISTS",
      "FIRST_OPPORTUNITY_INELIGIBLE",
      "JOB_NOT_AVAILABLE",
      "VALIDATION_FAILED",
    ]) {
      expect(form, code).toContain(`case "${code}"`);
    }

    expect(form).toContain("if (submittingRef.current) return");
    expect(form).toContain("submittingRef.current = true");
    expect(form).toContain("submittingRef.current = false");
    expect(form).toContain("encodeURIComponent(nextPath)");
    expect(form).toContain('href: "/account-restricted"');
    expect(form).toContain('href: "/account/continue"');
    expect(form).toContain('href: "/worker/applications"');
    expect(form).toContain('name="note"');
    expect(form).not.toContain('value={');
    expect(resetIndex).toBeGreaterThan(-1);
    expect(catchIndex).toBeGreaterThan(resetIndex);
    expect(form.slice(catchIndex)).not.toContain("formRef.current?.reset()");
  });

  test("retains the server authorization guard as the final boundary", () => {
    const action = readFileSync(
      "server/domain/applications/actions.ts",
      "utf8",
    );
    const activeUserIndex = action.indexOf(
      "const context = await requireActiveUser()",
    );
    const roleIndex = action.indexOf('context.role !== "worker"');
    const transactionIndex = action.indexOf("db.transaction");

    expect(activeUserIndex).toBeGreaterThan(-1);
    expect(roleIndex).toBeGreaterThan(activeUserIndex);
    expect(transactionIndex).toBeGreaterThan(roleIndex);
    expect(action).toContain(
      'throw new ApplicationError("FORBIDDEN", "Only workers can apply to jobs.")',
    );
  });
});
