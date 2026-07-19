import { ArrowUpRight, Search, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/rintara/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const users = [
  { name: "Ayu Pratama", initials: "AP", role: "Pekerja", status: "Aktif" },
  { name: "Sinar Event Studio", initials: "SE", role: "Pemberi kerja", status: "Aktif" },
  { name: "Raka Pranata", initials: "RP", role: "Pekerja", status: "Ditangguhkan" },
];

export default async function UsersPage() {
  await requireDashboardPageRole("admin", "/admin/users");

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Akses & akun"
        title="Pengguna"
        description="Tinjau peran dan status akun secara eksplisit. Setiap pembatasan memerlukan alasan serta jejak audit."
      />

      <section className="grid gap-4 border-y border-border/70 py-5 lg:grid-cols-[minmax(18rem,1fr)_auto] lg:items-center" aria-label="Pencarian pengguna">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Cari pengguna" placeholder="Cari nama atau referensi akun" className="h-12 rounded-full bg-card/75 pl-11" />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">42</span> akun aktif
        </p>
      </section>

      <section aria-labelledby="user-list-title" className="overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/72 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Direktori akun</p>
            <h2 id="user-list-title" className="mt-1 text-lg font-semibold">Status terbaru</h2>
          </div>
          <UserRound className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>

        <div className="divide-y divide-border/70">
          {users.map((user) => (
            <article key={user.name} className="group grid gap-4 px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center sm:px-6">
              <span className="grid size-11 place-items-center rounded-full border border-border bg-background/70 text-xs font-semibold text-primary" aria-hidden="true">
                {user.initials}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold leading-6">{user.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{user.role}</p>
              </div>
              <div>
                <StatusBadge status={user.status === "Aktif" ? "success" : "danger"}>{user.status}</StatusBadge>
              </div>
              <Button variant="outline" type="button" className="w-full sm:w-auto">
                Tinjau akun
                <ArrowUpRight aria-hidden="true" />
              </Button>
            </article>
          ))}
        </div>
      </section>

      <aside className="grid gap-4 rounded-[1.5rem] bg-slate-950 px-5 py-6 text-white sm:grid-cols-[auto_1fr] sm:items-start sm:px-6">
        <ShieldCheck className="size-5 text-blue-300" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">Peran dan status berasal dari data tepercaya</h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-400">
            Pemeriksaan wewenang tetap dilakukan untuk setiap tindakan. Pembatasan akun tidak menghapus riwayat pekerjaan atau audit.
          </p>
        </div>
      </aside>
    </div>
  );
}
