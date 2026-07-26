"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicAuthState } from "@/features/auth/use-public-auth-state";

export function EmployerPublishAction() {
  const authState = usePublicAuthState();

  if (authState === "checking") {
    return (
      <Button variant="outline" disabled aria-label="Memeriksa status akun">
        <LoaderCircle className="animate-spin" aria-hidden="true" />
        Memeriksa akun
      </Button>
    );
  }

  const signedIn = authState === "signed-in";

  return (
    <Button variant="outline" asChild>
      <Link href={signedIn ? "/account/continue" : "/register"} prefetch={false}>
        {signedIn ? "Buka ruang kerja" : "Pasang pekerjaan"}
        <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );
}
