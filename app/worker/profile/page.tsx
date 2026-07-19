import { BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/rintara/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireDashboardPageRole } from "@/server/auth/page-access";

export default async function WorkerProfilePage() {
  await requireDashboardPageRole("worker", "/worker/profile");

  return (
    <div className="grid gap-9">
      <PageHeader
        eyebrow="Identitas kerja"
        title="Profil pekerja"
        description="Kelola informasi dasar dan minat pekerjaanmu."
      />

      <div className="grid gap-9 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-12">
        <aside className="relative isolate overflow-hidden rounded-[2rem] bg-[#0a1c3f] p-7 text-white shadow-[0_28px_72px_-44px_rgb(15_42_104/0.92)] lg:sticky lg:top-24">
          <span className="grid size-16 place-items-center rounded-full border border-white/15 bg-white/10 text-xl font-semibold backdrop-blur-sm" aria-hidden="true">
            AP
          </span>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/65">Pekerja</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Ayu Pratama</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-blue-100/65">
            <MapPin className="size-4" aria-hidden="true" /> Bandung
          </p>

          <div className="mt-8 grid gap-5 border-t border-white/15 pt-6 text-base leading-7 text-blue-100/70">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <p>Data kontak tidak ditampilkan di halaman publik.</p>
            </div>
            <div className="flex gap-3">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-blue-300" aria-hidden="true" />
              <p>Pengalaman terverifikasi hanya berasal dari Bukti Kerja.</p>
            </div>
          </div>
        </aside>

        <form className="min-w-0" aria-labelledby="profile-form-title">
          <section>
            <div className="border-b border-border/75 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Data privat</p>
              <h2 id="profile-form-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Informasi dasar</h2>
              <p className="mt-2 text-base leading-7 text-muted-foreground">Gunakan informasi yang mudah dikenali saat menjalani pekerjaan.</p>
            </div>

            <div className="grid gap-x-6 gap-y-5 pt-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama lengkap</Label>
                <Input id="name" name="name" defaultValue="Ayu Pratama" className="h-12" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Nomor telepon</Label>
                <Input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={20} placeholder="Masukkan nomor telepon" className="h-12" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="area">Area domisili</Label>
                <Select defaultValue="bandung" name="area">
                  <SelectTrigger id="area" className="h-12 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bandung">Bandung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="mt-10 border-t border-border/75 pt-8" aria-labelledby="profile-about-title">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Tentang kamu</p>
              <h2 id="profile-about-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Minat dan perkenalan</h2>
              <p className="mt-2 text-base leading-7 text-muted-foreground">Bagian ini membantu menyampaikan pekerjaan seperti apa yang ingin kamu jalani.</p>
            </div>

            <div className="mt-6 grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="interests">
                  Minat pekerjaan <span className="font-normal text-muted-foreground">(opsional)</span>
                </Label>
                <Input id="interests" name="interests" defaultValue="Event Helper, Light Cleaning" className="h-12" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="availability">Ketersediaan</Label>
                <Input id="availability" name="availabilityNote" maxLength={500} defaultValue="Hari kerja setelah pukul 16.00 dan akhir pekan" className="h-12" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">
                  Tentang saya <span className="font-normal text-muted-foreground">(opsional)</span>
                </Label>
                <Textarea id="bio" name="bio" defaultValue="Siap belajar, mengikuti arahan, dan bekerja sesuai jadwal." className="min-h-32" />
              </div>
            </div>
          </section>

          <div className="mt-8 flex justify-end border-t border-border/75 pt-6">
            <Button type="button" className="w-full rounded-full px-7 sm:w-auto">Simpan perubahan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
