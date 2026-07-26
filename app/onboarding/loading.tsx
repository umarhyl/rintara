import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <main
      className="grid min-h-screen bg-background lg:grid-cols-[minmax(25rem,0.82fr)_minmax(34rem,1.18fr)]"
      aria-busy="true"
      aria-label="Memuat proses pendaftaran"
    >
      <section className="hidden min-h-screen bg-[#1b512d] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <Skeleton className="h-11 w-32 bg-white/12" />
        <div className="grid max-w-lg gap-5">
          <Skeleton className="h-4 w-44 bg-white/12" />
          <Skeleton className="h-28 w-full bg-white/12" />
          <Skeleton className="h-24 w-4/5 bg-white/12" />
        </div>
        <Skeleton className="h-4 w-52 bg-white/12" />
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-24 sm:px-8 lg:px-12">
        <div className="w-full max-w-[34rem] rounded-xl border border-border bg-card p-6 sm:p-9 lg:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-11 w-4/5" />
          <Skeleton className="mt-5 h-14 w-full" />
          <div className="mt-8 grid gap-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </section>
      <span className="sr-only">Memuat pilihan dan formulir profil…</span>
    </main>
  );
}
