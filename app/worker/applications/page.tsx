import Link from "next/link";
import { ArrowRight, Clock3, FileText, Handshake } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/components/rintara/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoApplications as applications } from "@/lib/demo-data";
import { requireDashboardPageRole } from "@/server/auth/page-access";

function ApplicationList() {
  return (
    <ol className="border-y border-border/80" aria-label="Lamaran aktif">
      {applications.map((item, index) => {
        const accepted = item.status === "accepted";

        return (
          <li
            key={item.id}
            className="group relative grid gap-5 border-b border-border/70 py-7 last:border-b-0 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center sm:gap-6"
          >
            <div className="relative hidden h-full sm:block" aria-hidden="true">
              {index < applications.length - 1 ? (
                <span className="absolute left-1/2 top-7 h-[calc(100%+2rem)] w-px -translate-x-1/2 bg-border" />
              ) : null}
              <span
                className={`relative mx-auto mt-2 block size-3 rounded-full ring-4 ring-background ${
                  accepted ? "bg-success" : "bg-primary"
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {accepted ? "Siap dilanjutkan" : "Menunggu keputusan"}
                </p>
                <StatusBadge status={accepted ? "success" : "info"}>{item.statusLabel}</StatusBadge>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] transition-colors duration-500 group-hover:text-primary">
                {item.jobTitle}
              </h2>
              <p className="mt-1 text-base leading-7 text-muted-foreground">
                {item.employer} <span aria-hidden="true">·</span> {item.date}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button
                variant={accepted ? "default" : "outline"}
                className="rounded-full px-5 [&_svg]:group-hover/button:translate-x-0.5"
                asChild
              >
                <Link href={item.nextHref}>
                  {item.nextLabel}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default async function ApplicationsPage() {
  await requireDashboardPageRole("worker", "/worker/applications");

  const acceptedCount = applications.filter((item) => item.status === "accepted").length;

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
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{applications.length}</p>
        </div>
        <div className="border-t border-border/70 px-1 py-5 sm:border-l sm:border-t-0 sm:px-6">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4 text-primary" aria-hidden="true" /> Menunggu keputusan
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{applications.length - acceptedCount}</p>
        </div>
        <div className="border-t border-border/70 px-1 py-5 sm:border-l sm:border-t-0 sm:px-6">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Handshake className="size-4 text-success" aria-hidden="true" /> Siap disepakati
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{acceptedCount}</p>
        </div>
      </section>

      <Tabs defaultValue="active">
        <TabsList variant="line" className="h-12 gap-6 border-b border-border/70 p-0">
          <TabsTrigger value="active" className="px-0">Aktif</TabsTrigger>
          <TabsTrigger value="history" className="px-0">Riwayat</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <ApplicationList />
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
