import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() { return <main className="mx-auto grid min-h-[60vh] max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Memuat halaman"><Skeleton className="h-9 w-2/3 max-w-lg" /><Skeleton className="h-5 w-full max-w-2xl" /><div className="grid gap-4 sm:grid-cols-3">{[1,2,3].map((item) => <Skeleton key={item} className="h-36 rounded-xl" />)}</div><Skeleton className="h-72 rounded-xl" /><span className="sr-only">Memuat konten Rintara…</span></main>; }
