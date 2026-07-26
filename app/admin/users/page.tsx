import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/components/rintara/status-badge";
import { requireDashboardPageRole } from "@/server/auth/page-access";
import { adminListUsers } from "@/server/queries/admin/moderation";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const roleLabels: Record<string, string> = {
  worker: "Pekerja",
  employer: "Pemberi kerja",
  admin: "Admin",
};

const accountStatusLabels: Record<string, string> = {
  active: "Aktif",
  suspended: "Ditangguhkan",
  deleted: "Dihapus",
};

export default async function UsersPage() {
  await requireDashboardPageRole("admin", "/admin/users");
  const users = await adminListUsers();

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Pengguna"
        description="Tinjau peran dan status akun. Setiap pembatasan dicatat dalam audit."
      />

      <section className="border-y border-border/70 py-5" aria-label="Ringkasan daftar pengguna">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{users.length}</span> akun
        </p>
      </section>

      <section aria-labelledby="user-list-title" className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
          <h2 id="user-list-title" className="text-lg font-semibold">
            Daftar akun
          </h2>
        </div>

        <div className="divide-y divide-border/70">
          {users.map((user) => {
            const displayName =
              user.workerDisplayName || user.employerDisplayName || user.id;
            return (
              <article key={user.id} className="group grid gap-4 px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-6">
                <span className="grid size-11 place-items-center rounded-xl border border-border bg-background text-xs font-semibold text-primary" aria-hidden="true">
                  {initials(displayName)}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-6">{displayName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {roleLabels[user.role] ?? "Peran lain"}
                  </p>
                </div>
                <div>
                  <StatusBadge status={user.status === "active" ? "success" : "danger"}>
                    {accountStatusLabels[user.status] ?? "Status lain"}
                  </StatusBadge>
                </div>
              </article>
            );
          })}
          {users.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
              Belum ada akun untuk ditampilkan.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
