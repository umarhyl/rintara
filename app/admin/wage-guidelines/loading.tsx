import { Skeleton } from "@/components/ui/skeleton";

function FormSectionSkeleton({ fields }: { fields: number }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border/70 p-5 sm:p-6">
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl rounded-md" />
      </div>
      <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className="grid gap-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-11 rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-11 w-36 rounded-xl sm:col-span-2" />
      </div>
    </section>
  );
}

export default function WageGuidelinesLoading() {
  return (
    <div
      className="grid gap-7"
      aria-busy="true"
      aria-label="Memuat konfigurasi marketplace"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-5 w-full max-w-xl rounded-md" />
        </div>
        <Skeleton className="h-8 w-56 rounded-md" />
      </div>

      <FormSectionSkeleton fields={4} />
      <FormSectionSkeleton fields={3} />
      <FormSectionSkeleton fields={8} />

      <section className="grid gap-5">
        <div className="border-b border-border/70 pb-4">
          <Skeleton className="h-7 w-56 rounded-md" />
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <article
              key={item}
              className="rounded-xl border border-border bg-card p-5"
            >
              <Skeleton className="h-5 w-32 rounded-md" />
              <div className="mt-4 grid gap-4 border-y border-border/70 py-4">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="grid gap-2">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <span className="sr-only">Memuat konfigurasi marketplace…</span>
    </div>
  );
}
