import Link from "next/link";
import { ArrowRight, Clock3, FileText, Handshake } from "lucide-react";
import { EmptyState } from "@/components/rintara/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { WithdrawApplicationButton } from "@/components/rintara/withdraw-application-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import {
  listMyApplications,
  type WorkerApplicationListItem,
} from "@/server/queries/applications/worker-applications";

function formatWage(amount: number, unit: WorkerApplicationListItem["wageUnit"]) {
  const unitLabel = unit === "hour" ? "jam" : unit === "day" ? "hari" : "pekerjaan";
  return `${new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)} / ${unitLabel}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function statusLabel(status: WorkerApplicationListItem["status"]) {
  if (status === "submitted") return "Menunggu";
  if (status === "accepted") return "Diterima";
  if (status === "rejected") return "Ditolak";
  return "Ditarik";
}

function statusTone(status: WorkerApplicationListItem["status"]) {
  if (status === "submitted") return "info";
  if (status === "accepted") return "success";
  if (status === "rejected") return "warning";
  return "neutral";
}

function ApplicationCard({ application }: { application: WorkerApplicationListItem }) {
  return (
    <article className="grid gap-5 border-y border-border bg-card/45 px-5 py-6 sm:grid-cols-[1fr_auto] sm:items-start sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={statusTone(application.status)}>
            {statusLabel(application.status)}
          </StatusBadge>
          {application.isFirstOpportunity ? (
            <StatusBadge tone="warning">Kesempatan Pertama</StatusBadge>
          ) : null}
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.025em]">
          <Link href={`/jobs/${application.jobId}`} className="hover:underline">
            {application.jobTitle}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {application.employerDisplayName} · {application.publicLocationLabel}
        </p>
        <dl className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <dt className="text-xs">Kategori</dt>
            <dd className="mt-1 font-medium text-foreground">{application.categoryName}</dd>
          </div>
          <div>
            <dt className="text-xs">Jadwal</dt>
            <dd className="mt-1 font-medium text-foreground">{formatDate(application.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs">Upah tetap</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatWage(application.wageAmount, application.wageUnit)}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Dikirim {formatDate(application.submittedAt)}
        </p>
      </div>
      {application.status === "submitted" ? (
        <WithdrawApplicationButton applicationId={application.id} />
      ) : null}
    </article>
  );
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { cursor } = await searchParams;
  await requireDashboardPageRole("worker", "/worker/applications");
  const applicationPage = await listMyApplications({
    cursor: typeof cursor === "string" ? cursor : undefined,
  });
  const applications = applicationPage.items;
  const activeApplications = applications.filter(
    (application) =>
      application.status === "submitted" || application.status === "accepted",
  );
  const historicalApplications = applications.filter(
    (application) =>
      application.status === "rejected" || application.status === "withdrawn",
  );
  const submittedCount = applications.filter(
    (application) => application.status === "submitted",
  ).length;
  const acceptedCount = applications.filter(
    (application) => application.status === "accepted",
  ).length;

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
            <FileText className="size-4 text-primary" aria-hidden="true" /> Aktif
            di halaman ini
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{activeApplications.length}</p>
        </div>
        <div className="border-t border-border/70 px-1 py-5 sm:border-l sm:border-t-0 sm:px-6">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4 text-primary" aria-hidden="true" /> Menunggu
            di halaman ini
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{submittedCount}</p>
        </div>
        <div className="border-t border-border/70 px-1 py-5 sm:border-l sm:border-t-0 sm:px-6">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Handshake className="size-4 text-success" aria-hidden="true" /> Diterima
            di halaman ini
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
          {activeApplications.length > 0 ? (
            <div className="grid gap-4">
              {activeApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada lamaran aktif"
              description="Lamaran yang sedang menunggu keputusan atau sudah diterima akan tampil di sini."
              actionLabel="Cari pekerjaan"
              actionHref="/jobs"
            />
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          {historicalApplications.length > 0 ? (
            <div className="grid gap-4">
              {historicalApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada riwayat lain"
              description="Lamaran yang ditolak atau ditarik akan muncul di sini."
              actionLabel="Cari pekerjaan"
              actionHref="/jobs"
            />
          )}
        </TabsContent>
      </Tabs>

      {applicationPage.nextCursor ? (
        <nav aria-label="Navigasi daftar lamaran">
          <Button variant="outline" asChild>
            <Link
              href={`/worker/applications?cursor=${encodeURIComponent(applicationPage.nextCursor)}`}
            >
              Lamaran berikutnya <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
