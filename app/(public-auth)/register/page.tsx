import Image from "next/image";
import { AuthHeader } from "@/features/auth/components/auth-shell";
import { RegisterRoleGate } from "@/features/auth/components/register-role-gate";
import { safeApplicationPath } from "@/server/auth/redirects";

export const metadata = { title: "Buat akun" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawNextPath = typeof query.next === "string" ? query.next : null;
  const nextPath = rawNextPath
    ? safeApplicationPath(rawNextPath, "/account/continue")
    : undefined;

  return (
    <div className="min-h-[100dvh] bg-white">
      <AuthHeader className="relative z-20 bg-white" />

      <main
        data-register-canvas
        className="relative isolate min-h-[calc(100dvh-4.5rem)] overflow-hidden bg-white"
      >
        <Image
          src="/visuals/rintara-register-curves.svg"
          alt=""
          width={3018}
          height={1486}
          priority
          unoptimized
          className="pointer-events-none absolute left-1/2 top-0 h-[calc(100%+4rem)] w-[300%] max-w-none -translate-x-1/2 sm:left-[52%] sm:h-[128%] sm:w-[190%] md:left-[54%] md:w-[165%] xl:w-[157%]"
        />

        <section className="relative z-10 mx-auto min-h-[calc(100dvh-4.5rem)] w-full max-w-[48rem] px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-32 md:pt-[clamp(9.5rem,22vh,17rem)] lg:px-8">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]">
            <RegisterRoleGate nextPath={nextPath} />
          </div>
        </section>
      </main>
    </div>
  );
}
