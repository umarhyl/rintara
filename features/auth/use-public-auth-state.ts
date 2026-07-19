"use client";

import { useEffect, useState } from "react";

export type PublicAuthState = "checking" | "anonymous" | "signed-in";
type SettledPublicAuthState = Exclude<PublicAuthState, "checking">;

let pendingRequest: Promise<PublicAuthState> | null = null;
let cachedState: SettledPublicAuthState | null = null;
let cacheExpiresAt = 0;
let cacheGeneration = 0;
const AUTH_STATE_CACHE_MS = 15_000;

export function primePublicAuthState(state: SettledPublicAuthState) {
  cacheGeneration += 1;
  cachedState = state;
  cacheExpiresAt = Date.now() + AUTH_STATE_CACHE_MS;
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
      }
      pendingRequest = null;
    }
  })();

  return pendingRequest;
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
