import Link from "next/link";
import { ArrowRight, Clock3, FileText, Handshake } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export default async function ApplicationsPage() {
  await requireDashboardPageRole("worker", "/worker/applications");

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Jejak lamaran"
        title="Lamaran saya"
        description="Pantau setiap kabar dan lanjutkan langkah yang sudah siap."
        action={
          <Button className="rounded-full px-5" asChild>
            <Link href="/jobs">
              Cari pekerjaan <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section className="grid overflow-hidden border-y border-border/75 bg-card/40 sm:grid-cols-3" aria-label="Ringkasan lamaran">
        <div className="px-1 py-5 sm:px-6">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4 text-primary" aria-hidden="true" /> Lamaran aktif
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">0</p>
        </div>
        <div className="border-t border-border/70 px-1 py-5 sm:border-l sm:border-t-0 sm:px-6">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4 text-primary" aria-hidden="true" /> Menunggu keputusan
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">0</p>
        </div>
        <div className="border-t border-border/70 px-1 py-5 sm:border-l sm:border-t-0 sm:px-6">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Handshake className="size-4 text-success" aria-hidden="true" /> Siap disepakati
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">0</p>
        </div>
      </section>

      <Tabs defaultValue="active">
        <TabsList variant="line" className="h-12 gap-6 border-b border-border/70 p-0">
          <TabsTrigger value="active" className="px-0">Aktif</TabsTrigger>
          <TabsTrigger value="history" className="px-0">Riwayat</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <EmptyState
            title="Belum ada lamaran dari backend"
            description="Data contoh sudah disembunyikan. Lamaran nyata akan tampil setelah operasi lamaran tersambung."
            actionLabel="Cari pekerjaan"
            actionHref="/jobs"
          />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <EmptyState
            title="Belum ada riwayat lain"
            description="Lamaran yang ditolak atau ditarik akan muncul di sini."
            actionLabel="Cari pekerjaan"
            actionHref="/jobs"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
