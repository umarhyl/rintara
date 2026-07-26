import { PublicShell } from "@/components/rintara/public-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <PublicShell>
      <div
        className="mx-auto w-full max-w-[80rem] px-4 py-11 sm:px-6 lg:px-8 lg:py-14"
        aria-busy="true"
        aria-label="Memuat kategori pekerjaan dan wilayah"
      >
        <Skeleton className="h-12 w-full max-w-2xl rounded-xl" />
        <Skeleton className="mt-4 h-6 w-full max-w-xl rounded-lg" />
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <div>
            <Skeleton className="h-14 w-full max-w-sm rounded-xl" />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="h-14 rounded-lg" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-14 w-full max-w-xs rounded-xl" />
            <div className="mt-7 grid gap-3">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <span className="sr-only">
          Memuat kategori pekerjaan dan wilayah aktif
        </span>
      </div>
    </PublicShell>
  );
}
