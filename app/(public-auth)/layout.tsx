import { AuthSurfaceProvider } from "@/features/auth/components/auth-surface-state";
import { AuthVisualFrame } from "@/features/auth/components/auth-shell";

export default function PublicAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthVisualFrame>
      <AuthSurfaceProvider>{children}</AuthSurfaceProvider>
    </AuthVisualFrame>
  );
}
