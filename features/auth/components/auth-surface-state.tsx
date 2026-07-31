"use client";

import { createContext, useContext, useMemo, useState } from "react";

type AuthSurfaceState = {
  email: string;
  setEmail: (value: string) => void;
  signInPassword: string;
  setSignInPassword: (value: string) => void;
  registerPassword: string;
  setRegisterPassword: (value: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
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
    }),
    [email, registerPassword, signInPassword, termsAccepted],
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
