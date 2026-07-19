import { requireOnboardingPage } from "@/server/auth/page-access";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireOnboardingPage();

  return children;
}
