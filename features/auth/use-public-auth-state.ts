"use client";

import { useCallback, useEffect, useState } from "react";

export type PublicAuthState = "checking" | "anonymous" | "signed-in";
type SettledPublicAuthState = Exclude<PublicAuthState, "checking">;
export type PublicAccountRole = "worker" | "employer" | "admin";
export type PublicAccountState =
  | { kind: "checking" }
  | { kind: "anonymous" }
  | {
      kind: "onboarding";
      role: "worker" | "employer" | null;
      displayName: string | null;
    }
  | {
      kind: "ready";
      role: PublicAccountRole;
      displayName: string | null;
    }
  | {
      kind: "inactive";
      role: PublicAccountRole;
      displayName: string | null;
    }
  | { kind: "unavailable" };
type SettledPublicAccountState = Exclude<
  PublicAccountState,
  { kind: "checking" }
>;

let pendingRequest: Promise<PublicAuthState> | null = null;
let cachedState: SettledPublicAuthState | null = null;
let cacheExpiresAt = 0;
let cacheGeneration = 0;
let pendingAccountRequest: Promise<SettledPublicAccountState> | null = null;
let cachedAccountState: SettledPublicAccountState | null = null;
let accountCacheExpiresAt = 0;
let accountCacheGeneration = 0;
const AUTH_STATE_CACHE_MS = 15_000;
const AUTH_STATE_RETRY_CACHE_MS = 2_000;

function accountCacheDuration(state: SettledPublicAccountState): number {
  if (state.kind === "ready" || state.kind === "anonymous") {
    return AUTH_STATE_CACHE_MS;
  }

  if (state.kind === "unavailable") {
    return AUTH_STATE_RETRY_CACHE_MS;
  }

  // Onboarding and account restriction can change on the next route. Keeping
  // them past a remount could show a stale recovery CTA after completion.
  return 0;
}

export function primePublicAuthState(state: SettledPublicAuthState) {
  cacheGeneration += 1;
  accountCacheGeneration += 1;
  cachedState = state;
  cacheExpiresAt = Date.now() + AUTH_STATE_CACHE_MS;
  cachedAccountState = state === "anonymous" ? { kind: "anonymous" } : null;
  accountCacheExpiresAt =
    state === "anonymous" ? Date.now() + AUTH_STATE_CACHE_MS : 0;
}

function requestPublicAuthState(): Promise<PublicAuthState> {
  if (cachedState && Date.now() < cacheExpiresAt) {
    return Promise.resolve(cachedState);
  }
  if (pendingRequest) return pendingRequest;

  const requestGeneration = cacheGeneration;
  pendingRequest = (async () => {
    let nextState: SettledPublicAuthState = "anonymous";

    try {
      const response = await fetch("/auth/status", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) return nextState;

      const data: unknown = await response.json();
      nextState = typeof data === "object" &&
        data !== null &&
        "authenticated" in data &&
        data.authenticated === true
        ? "signed-in"
        : "anonymous";
      return nextState;
    } catch {
      return nextState;
    } finally {
      if (requestGeneration === cacheGeneration) {
        cachedState = nextState;
        cacheExpiresAt = Date.now() + AUTH_STATE_CACHE_MS;
        if (nextState === "anonymous") {
          cachedAccountState = { kind: "anonymous" };
          accountCacheExpiresAt = cacheExpiresAt;
        }
      }
      pendingRequest = null;
    }
  })();

  return pendingRequest;
}

function isAccountRole(value: unknown): value is PublicAccountRole {
  return value === "worker" || value === "employer" || value === "admin";
}

function parseDisplayName(data: object): string | null {
  if (!("displayName" in data) || typeof data.displayName !== "string") {
    return null;
  }

  const displayName = data.displayName.trim();
  return displayName.length > 0 ? displayName : null;
}

export function parsePublicAccountState(
  data: unknown,
): SettledPublicAccountState {
  if (
    typeof data !== "object" ||
    data === null ||
    !("authenticated" in data)
  ) {
    return { kind: "unavailable" };
  }

  if (data.authenticated !== true) {
    return { kind: "anonymous" };
  }

  const state = "state" in data ? data.state : undefined;
  const role = "role" in data ? data.role : undefined;
  const displayName = parseDisplayName(data);

  if (state === "onboarding") {
    return {
      kind: "onboarding",
      role: role === "worker" || role === "employer" ? role : null,
      displayName,
    };
  }

  if ((state === "ready" || state === "inactive") && isAccountRole(role)) {
    return { kind: state, role, displayName };
  }

  return { kind: "unavailable" };
}

function requestPublicAccountState(): Promise<SettledPublicAccountState> {
  if (cachedAccountState && Date.now() < accountCacheExpiresAt) {
    return Promise.resolve(cachedAccountState);
  }
  if (pendingAccountRequest) return pendingAccountRequest;

  const requestGeneration = accountCacheGeneration;
  const request = (async () => {
    let nextState: SettledPublicAccountState = { kind: "unavailable" };
    let authenticated: boolean | null = null;

    try {
      const response = await fetch("/auth/status?detail=account", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data: unknown = await response.json();
      authenticated =
        typeof data === "object" &&
        data !== null &&
        "authenticated" in data &&
        typeof data.authenticated === "boolean"
          ? data.authenticated
          : null;
      nextState = parsePublicAccountState(data);
    } catch {
      nextState = { kind: "unavailable" };
    }

    if (requestGeneration !== accountCacheGeneration) {
      return cachedAccountState ?? nextState;
    }

    cachedAccountState = nextState;
    accountCacheExpiresAt = Date.now() + accountCacheDuration(nextState);

    if (authenticated !== null) {
      cachedState = authenticated ? "signed-in" : "anonymous";
      cacheExpiresAt = Date.now() + AUTH_STATE_CACHE_MS;
    }

    return nextState;
  })();

  pendingAccountRequest = request;
  void request.then(() => {
    if (pendingAccountRequest === request) {
      pendingAccountRequest = null;
    }
  });

  return request;
}

export function usePublicAuthState(): PublicAuthState {
  const [state, setState] = useState<PublicAuthState>(() =>
    cachedState && Date.now() < cacheExpiresAt ? cachedState : "checking",
  );

  useEffect(() => {
    let active = true;

    void requestPublicAuthState().then((nextState) => {
      if (active) {
        setState(
          cacheGeneration > 0 && cachedState ? cachedState : nextState,
        );
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function usePublicAccountState(): {
  accountState: PublicAccountState;
  retry: () => void;
} {
  const [accountState, setAccountState] = useState<PublicAccountState>(() => {
    if (cachedAccountState && Date.now() < accountCacheExpiresAt) {
      return cachedAccountState;
    }
    if (
      cachedState === "anonymous" &&
      Date.now() < cacheExpiresAt
    ) {
      return { kind: "anonymous" };
    }
    return { kind: "checking" };
  });

  useEffect(() => {
    let active = true;
    const requestGeneration = accountCacheGeneration;

    void requestPublicAccountState().then((nextState) => {
      if (active && requestGeneration === accountCacheGeneration) {
        setAccountState(nextState);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const retry = useCallback(() => {
    accountCacheGeneration += 1;
    cachedAccountState = null;
    accountCacheExpiresAt = 0;
    pendingAccountRequest = null;
    setAccountState({ kind: "checking" });

    const requestGeneration = accountCacheGeneration;
    void requestPublicAccountState().then((nextState) => {
      if (requestGeneration === accountCacheGeneration) {
        setAccountState(nextState);
      }
    });
  }, []);

  return { accountState, retry };
}
