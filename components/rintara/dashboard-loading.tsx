import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoading() {
  return <div className="grid gap-7" aria-busy="true" aria-label="Memuat halaman akun"><div className="grid gap-3"><Skeleton className="h-8 w-52 rounded-xl" /><Skeleton className="h-5 w-full max-w-xl rounded-lg" /></div><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-36 rounded-2xl" />)}</div><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><Skeleton className="h-80 rounded-2xl" /><Skeleton className="h-80 rounded-2xl" /></div><span className="sr-only">Memuat konten akun…</span></div>;
}
