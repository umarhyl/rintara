"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type AuthMode = "sign-in" | "register";

type AuthSurfaceState = {
  email: string;
  setEmail: (value: string) => void;
  signInPassword: string;
  setSignInPassword: (value: string) => void;
  registerPassword: string;
  setRegisterPassword: (value: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
  busy: boolean;
  setBusy: (value: boolean) => void;
  visualMode: AuthMode | null;
  setVisualMode: (value: AuthMode) => void;
};

const AuthSurfaceContext = createContext<AuthSurfaceState | null>(null);

export function AuthSurfaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visualMode, setVisualMode] = useState<AuthMode | null>(null);

  const value = useMemo(
    () => ({
      email,
      setEmail,
      signInPassword,
      setSignInPassword,
      registerPassword,
      setRegisterPassword,
      termsAccepted,
      setTermsAccepted,
      busy,
      setBusy,
      visualMode,
      setVisualMode,
    }),
    [
      busy,
      email,
      registerPassword,
      signInPassword,
      termsAccepted,
      visualMode,
    ],
  );

  return (
    <AuthSurfaceContext.Provider value={value}>
      {children}
    </AuthSurfaceContext.Provider>
  );
}

export function useAuthSurfaceState() {
  const value = useContext(AuthSurfaceContext);

  if (!value) {
    throw new Error(
      "useAuthSurfaceState must be used inside AuthSurfaceProvider.",
    );
  }

  return value;
}
