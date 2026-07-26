import { PublicShell } from "@/components/rintara/public-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobsLoading() {
  return (
    <PublicShell>
      <div
        className="mx-auto max-w-[80rem] px-4 py-10 sm:px-6 lg:px-8"
        aria-busy="true"
        aria-label="Memuat daftar pekerjaan"
      >
        <Skeleton className="h-11 w-full max-w-2xl rounded-xl" />
        <Skeleton className="mt-4 h-6 w-full max-w-xl rounded-lg" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="hidden space-y-5 lg:block">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-20 rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-56 rounded-xl" />
            ))}
          </div>
        </div>
        <span className="sr-only">Memuat pekerjaan</span>
      </div>
    </PublicShell>
  );
}
