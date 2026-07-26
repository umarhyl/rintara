import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoading() {
  return (
    <div
      className="grid gap-6"
      aria-busy="true"
      aria-label="Memuat halaman akun"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-5 w-full max-w-lg rounded-md" />
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>

      <Skeleton className="h-24 rounded-xl" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-44 rounded-md" />
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <span className="sr-only">Memuat konten akun…</span>
    </div>
  );
}
