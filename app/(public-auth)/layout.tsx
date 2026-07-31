import { AuthSurfaceProvider } from "@/features/auth/components/auth-surface-state";

export default function PublicAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthSurfaceProvider>{children}</AuthSurfaceProvider>;
}
