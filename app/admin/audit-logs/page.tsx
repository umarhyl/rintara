import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
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
  return value ? `${value.slice(0, 8)}...` : "sistem";
}

export default async function AuditLogsPage() {
  await requireDashboardPageRole("admin", "/admin/audit-logs");
  const logs = await adminListAuditLogs();

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Audit log"
        description="Tinjau operasi melalui pengenal aman. Kode check-in, alamat privat, dan detail sensitif tidak ditampilkan."
      />

      <section aria-label="Ringkasan audit" className="flex flex-wrap items-center justify-between gap-3 border-y border-border/70 py-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{logs.length}</span> entri terbaru
        </p>
        <p className="text-sm text-muted-foreground">Urutan terbaru</p>
      </section>

      <section aria-labelledby="audit-list-title" className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
          <h2 id="audit-list-title" className="text-lg font-semibold">
            Aktivitas operasi
          </h2>
        </div>

        <ol className="divide-y divide-border/70 md:hidden">
          {logs.map((log) => (
            <li key={log.id} className="px-5 py-5">
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
          {logs.length === 0 ? (
            <li className="px-5 py-8 text-sm text-muted-foreground">
              Belum ada jejak operasi.
            </li>
          ) : null}
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
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Belum ada jejak operasi.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
