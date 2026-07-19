import { BookOpenCheck, CheckCircle2, CircleDashed, Plus } from "lucide-react";
import { PageHeader } from "@/components/rintara/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export default async function WageGuidelinesPage() {
  await requireDashboardPageRole("admin", "/admin/wage-guidelines");

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Referensi penerbitan"
        title="Panduan Upah"
        description="Kelola referensi per area dan kategori untuk menilai kelayakan Kesempatan Pertama. Setiap versi memerlukan sumber serta tanggal efektif."
        action={
          <Button type="button" className="rounded-full">
            <Plus aria-hidden="true" />
            Tambah panduan
          </Button>
        }
      />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-dashed border-border bg-card/55 px-6 py-12 sm:px-9 sm:py-16">
          <div className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/[0.07] blur-3xl" aria-hidden="true" />
          <BookOpenCheck className="size-7 text-primary" aria-hidden="true" />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-primary">Daftar referensi</p>
          <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-[-0.04em]">Belum ada panduan upah aktif</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Tambahkan sumber yang dapat ditinjau dan tanggal efektif sebelum sebuah panduan digunakan untuk menerbitkan Kesempatan Pertama.
          </p>
          <p className="mt-8 flex items-start gap-3 border-t border-border/70 pt-5 text-base leading-7 text-muted-foreground">
            <CircleDashed className="mt-0.5 size-4.5 shrink-0 text-amber-600" aria-hidden="true" />
            Penerbitan Kesempatan Pertama tetap tidak tersedia sampai referensi yang sesuai diaktifkan.
          </p>
        </section>

        <section aria-labelledby="guideline-route" className="rounded-[1.75rem] border border-border/75 bg-card/72 p-6 backdrop-blur-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Jejak penerbitan</p>
          <h2 id="guideline-route" className="mt-2 text-xl font-semibold tracking-[-0.025em]">Dari sumber ke panduan aktif</h2>
          <ol className="relative mt-8 grid gap-8 before:absolute before:bottom-3 before:left-[0.3rem] before:top-3 before:w-px before:bg-border">
            <li className="relative grid grid-cols-[1.1rem_1fr] gap-4">
              <span className="mt-1 size-2.5 rounded-full bg-primary ring-4 ring-card" aria-hidden="true" />
              <div>
                <p className="font-medium">Catat sumber</p>
                <p className="mt-1 text-base leading-7 text-muted-foreground">Simpan nama referensi, area, kategori, dan periode berlaku.</p>
              </div>
            </li>
            <li className="relative grid grid-cols-[1.1rem_1fr] gap-4">
              <span className="mt-1 size-2.5 rounded-full bg-primary ring-4 ring-card" aria-hidden="true" />
              <div>
                <p className="font-medium">Tinjau nilai</p>
                <p className="mt-1 text-base leading-7 text-muted-foreground">Pastikan satuan, nilai minimum, dan rekomendasi dapat dijelaskan.</p>
              </div>
            </li>
            <li className="relative grid grid-cols-[1.1rem_1fr] gap-4">
              <span className="mt-1 size-2.5 rounded-full bg-muted-foreground/50 ring-4 ring-card" aria-hidden="true" />
              <div>
                <p className="font-medium">Aktifkan versi</p>
                <p className="mt-1 text-base leading-7 text-muted-foreground">Panduan digunakan setelah pemeriksaan selesai dan jejak audit tercatat.</p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <section aria-labelledby="new-guideline-title" className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/82">
        <div className="grid gap-4 border-b border-border/70 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Draf baru</p>
            <h2 id="new-guideline-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Nilai panduan</h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">Isi referensi secara lengkap. Menyimpan draf belum membuat panduan tersedia untuk penerbitan.</p>
          </div>
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
            Perubahan akan dicatat
          </p>
        </div>

        <div className="grid gap-x-5 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7 lg:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="guideline-area">Area</Label>
            <Input id="guideline-area" placeholder="Kota atau kabupaten" className="h-11" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="guideline-category">Kategori</Label>
            <Select>
              <SelectTrigger id="guideline-category" className="h-11 w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Bantuan acara</SelectItem>
                <SelectItem value="cleaning">Kebersihan ringan</SelectItem>
                <SelectItem value="admin">Administrasi sederhana</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="guideline-unit">Satuan upah</Label>
            <Select>
              <SelectTrigger id="guideline-unit" className="h-11 w-full">
                <SelectValue placeholder="Pilih satuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Per jam</SelectItem>
                <SelectItem value="day">Per hari</SelectItem>
                <SelectItem value="task">Per pekerjaan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="minimum">Nilai minimum (rupiah)</Label>
            <Input id="minimum" inputMode="numeric" placeholder="0" className="h-11" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recommended">Nilai rekomendasi (rupiah)</Label>
            <Input id="recommended" inputMode="numeric" placeholder="0" className="h-11" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="source">Sumber referensi</Label>
            <Input id="source" placeholder="Nama sumber yang dapat ditinjau" className="h-11" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="effective-start">Mulai efektif</Label>
            <Input id="effective-start" type="date" className="h-11" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="effective-end">Berakhir <span className="font-normal text-muted-foreground">(opsional)</span></Label>
            <Input id="effective-end" type="date" className="h-11" />
          </div>
          <div className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-border/75 bg-muted/35 px-4">
            <Checkbox id="simulation" />
            <Label htmlFor="simulation" className="cursor-pointer font-normal leading-5">Tandai sebagai data simulasi</Label>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/70 bg-muted/25 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-base leading-7 text-muted-foreground">Panduan tidak akan aktif sebelum sumber dan nilainya ditinjau.</p>
          <Button type="button" className="rounded-full">Simpan sebagai draf</Button>
        </div>
      </section>
    </div>
  );
}
