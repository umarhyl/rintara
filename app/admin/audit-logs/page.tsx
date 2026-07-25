import { Activity, CheckCircle2, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { adminListAuditLogs } from "@/server/queries/admin/moderation";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function shortId(value: string | null) {
  return value ? `${value.slice(0, 8)}...` : "system";
}

export default async function AuditLogsPage() {
  await requireDashboardPageRole("admin", "/admin/audit-logs");
  const logs = await adminListAuditLogs();

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Jejak integritas"
        title="Audit log"
        description="Tinjau operasi penting melalui pengenal yang aman. Kode check-in, alamat privat, dan detail sensitif tidak ditampilkan."
      />

      <section aria-label="Pencarian audit" className="grid gap-4 border-y border-border/70 py-5 lg:grid-cols-[minmax(18rem,1fr)_auto_auto] lg:items-center">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Cari audit log" placeholder="Cari operasi atau referensi target" className="h-12 rounded-full bg-card/75 pl-11" />
        </div>
        <Button variant="outline" type="button" className="rounded-full">
          <SlidersHorizontal aria-hidden="true" />
          Filter waktu
        </Button>
        <p className="text-sm text-muted-foreground lg:pl-2">Urutan terbaru</p>
      </section>

      <aside className="grid gap-4 rounded-[1.5rem] bg-slate-950 px-5 py-6 text-white sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-6">
        <ShieldCheck className="size-5 text-blue-300" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">Metadata aman untuk penelusuran</h2>
          <p className="mt-1 text-base leading-7 text-slate-400">Identitas dibatasi dan setiap entri bersifat tetap untuk menjaga riwayat tindakan.</p>
        </div>
        <span className="font-mono text-xs text-slate-500">UTC</span>
      </aside>

      <section aria-labelledby="audit-list-title" className="overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/72 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Aktivitas terbaru</p>
            <h2 id="audit-list-title" className="mt-1 text-lg font-semibold">Jejak operasi</h2>
          </div>
          <Activity className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>

        <ol className="relative divide-y divide-border/70 md:hidden">
          {logs.map((log) => (
            <li key={log.id} className="relative grid grid-cols-[1.25rem_1fr] gap-4 px-5 py-5 before:absolute before:bottom-0 before:left-[1.53rem] before:top-0 before:w-px before:bg-border first:before:top-7 last:before:bottom-auto last:before:h-7">
              <span className="relative z-10 mt-1 size-3 rounded-full bg-success ring-4 ring-card" aria-hidden="true" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="break-all font-mono text-xs font-semibold">{log.action}</p>
                  <StatusBadge status="success">Tercatat</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatDate(log.createdAt)}</p>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Aktor</dt>
                    <dd className="mt-1 break-all font-mono">{shortId(log.actorId)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Target</dt>
                    <dd className="mt-1 break-all font-mono">{log.entityType}:{shortId(log.entityId)}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/35">
                <TableHead className="pl-6">Waktu</TableHead>
                <TableHead>Operasi</TableHead>
                <TableHead>Aktor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="pr-6">Hasil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="h-17">
                  <TableCell className="whitespace-nowrap pl-6 text-muted-foreground">{formatDate(log.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs font-medium">{log.action}</TableCell>
                  <TableCell className="font-mono text-xs">{shortId(log.actorId)}</TableCell>
                  <TableCell className="font-mono text-xs">{log.entityType}:{shortId(log.entityId)}</TableCell>
                  <TableCell className="pr-6">
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                      Tercatat
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
