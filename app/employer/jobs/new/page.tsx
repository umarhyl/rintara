import type { ReactNode } from "react";
import { Eye, Info, LockKeyhole, ShieldCheck } from "lucide-react";

import { ConfirmAction } from "@/components/rintara/confirm-action";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireDashboardPageRole } from "@/server/auth/page-access";

const creationSteps = [
  "Informasi publik",
  "Detail privat",
  "Upah & kelayakan",
  "Tinjau",
];

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function FormSection({
  number,
  title,
  description,
  icon,
  children,
}: {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 border-b border-border/70 px-5 py-8 last:border-b-0 sm:px-8 lg:grid-cols-[9.5rem_1fr] lg:gap-10 lg:px-10 lg:py-10">
      <div>
        <div className="flex items-center gap-3 text-primary">
          <span className="grid size-9 place-items-center rounded-full border border-primary/25 bg-primary/5">
            {icon}
          </span>
          <span className="text-xs font-semibold tracking-[0.16em]">{number}</span>
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.025em]">{title}</h2>
        <p className="mt-2 text-base leading-7 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function NewJobPage() {
  await requireDashboardPageRole("employer", "/employer/jobs/new");

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Pekerjaan baru"
        title="Susun pekerjaan yang jelas sejak awal"
        description="Jelaskan tugas, waktu, dan upah dalam satu alur. Draft hanya tersimpan ketika kamu memilih Simpan draft."
      />

      <div className="border-y border-border/70 py-5">
        <ol className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-4" aria-label="Bagian formulir pekerjaan">
          {creationSteps.map((step, index) => (
            <li key={step} className="relative flex items-center gap-3 pr-5">
              {index < creationSteps.length - 1 ? (
                <span
                  className="absolute left-6 right-0 top-3 hidden h-px bg-border md:block"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border border-primary bg-background text-[0.68rem] font-semibold text-primary"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="relative z-10 bg-background pr-3 text-sm font-medium">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <form className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/80 shadow-[0_24px_70px_-54px_rgb(15_23_42/0.45)] backdrop-blur-sm">
          <FormSection
            number="01"
            title="Informasi publik"
            description="Bagian ini dapat dilihat oleh siapa pun yang membuka pekerjaan."
            icon={<Eye className="size-4" aria-hidden="true" />}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Judul pekerjaan" id="title">
                <Input
                  id="title"
                  placeholder="Contoh: Kru acara akhir pekan"
                  className="h-11"
                />
              </Field>
              <Field label="Kategori" id="category">
                <Select>
                  <SelectTrigger id="category" className="h-11 w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event Helper</SelectItem>
                    <SelectItem value="cleaning">Light Cleaning</SelectItem>
                    <SelectItem value="admin">Simple Administration</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Deskripsi dan ruang lingkup tugas" id="description">
                  <Textarea
                    id="description"
                    placeholder="Jelaskan hasil yang diharapkan dan batas tugas"
                    className="min-h-32"
                  />
                </Field>
              </div>
              <Field label="Area umum" id="area">
                <Input id="area" placeholder="Kecamatan, kota" className="h-11" />
              </Field>
              <Field label="Batas waktu lamaran" id="deadline">
                <Input id="deadline" type="datetime-local" className="h-11" />
              </Field>
              <Field label="Mulai kerja" id="start">
                <Input id="start" type="datetime-local" className="h-11" />
              </Field>
              <Field label="Selesai kerja" id="end">
                <Input id="end" type="datetime-local" className="h-11" />
              </Field>
            </div>
          </FormSection>

          <FormSection
            number="02"
            title="Detail privat"
            description="Alamat lengkap baru terbuka setelah satu pekerja diterima."
            icon={<LockKeyhole className="size-4" aria-hidden="true" />}
          >
            <div className="grid gap-5">
              <Field label="Alamat lengkap" id="address">
                <Textarea
                  id="address"
                  placeholder="Alamat tempat kerja lengkap"
                  className="min-h-24"
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Peralatan yang disediakan" id="provided-tools">
                  <Input
                    id="provided-tools"
                    placeholder="Meja registrasi dan alat tulis"
                    className="h-11"
                  />
                </Field>
                <Field label="Peralatan yang perlu dibawa" id="required-tools">
                  <Input
                    id="required-tools"
                    placeholder="Tulis tidak ada jika seluruhnya disediakan"
                    className="h-11"
                  />
                </Field>
              </div>
            </div>
          </FormSection>

          <FormSection
            number="03"
            title="Upah & kelayakan"
            description="Ketentuan pembayaran dicatat dalam Kesepakatan Kerja."
            icon={<ShieldCheck className="size-4" aria-hidden="true" />}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nominal upah (rupiah)" id="wage">
                <Input
                  id="wage"
                  inputMode="numeric"
                  placeholder="200000"
                  className="h-11"
                />
              </Field>
              <Field label="Satuan" id="wage-unit">
                <Select>
                  <SelectTrigger id="wage-unit" className="h-11 w-full">
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Per jam</SelectItem>
                    <SelectItem value="day">Per hari</SelectItem>
                    <SelectItem value="job">Per pekerjaan</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Metode pembayaran" id="payment-method">
                <Select>
                  <SelectTrigger id="payment-method" className="h-11 w-full">
                    <SelectValue placeholder="Pilih metode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer bank</SelectItem>
                    <SelectItem value="cash">Tunai</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Waktu pembayaran" id="payment-time">
                <Select>
                  <SelectTrigger id="payment-time" className="h-11 w-full">
                    <SelectValue placeholder="Pilih waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="after">Setelah pekerjaan selesai</SelectItem>
                    <SelectItem value="day">Maksimal 1 hari setelah selesai</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="sm:col-span-2">
                <Alert className="border-amber-300/70 bg-amber-50/80 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                  <Info aria-hidden="true" />
                  <AlertTitle>Panduan upah belum tersedia</AlertTitle>
                  <AlertDescription className="dark:text-amber-100/70">
                    Kategori ini belum memiliki panduan upah aktif. Kesempatan
                    Pertama belum dapat diterbitkan sampai referensi tersedia.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex items-start gap-3 border-t border-border/70 pt-5 sm:col-span-2">
                <Checkbox id="first-opportunity" className="mt-1" disabled />
                <div>
                  <Label htmlFor="first-opportunity">Jadikan Kesempatan Pertama</Label>
                  <p className="mt-1 max-w-2xl text-base leading-7 text-muted-foreground">
                    Kelayakan dihitung dari Bukti Kerja terverifikasi dalam kategori
                    ini. Kesempatan Pertama tetap merupakan pekerjaan berbayar.
                  </p>
                </div>
              </div>
            </div>
          </FormSection>
        </div>

        <aside className="rounded-[1.75rem] bg-foreground p-6 text-background shadow-[0_28px_70px_-42px_rgb(15_23_42/0.7)] xl:sticky xl:top-24">
          <p className="text-xs font-semibold tracking-[0.16em] text-background/70">
            LANGKAH BERIKUTNYA
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
            Periksa sebelum terbit
          </h2>
          <ol className="mt-6 grid gap-5 text-base leading-7 text-background/70">
            <li className="grid grid-cols-[1.5rem_1fr] gap-3">
              <span className="text-background/65">01</span>
              <span>Pastikan informasi publik tidak memuat alamat lengkap.</span>
            </li>
            <li className="grid grid-cols-[1.5rem_1fr] gap-3">
              <span className="text-background/65">02</span>
              <span>Kategori, risiko, dan upah akan diperiksa ketika diterbitkan.</span>
            </li>
            <li className="grid grid-cols-[1.5rem_1fr] gap-3">
              <span className="text-background/65">03</span>
              <span>
                Ketentuan terbit tidak dapat diedit. Batalkan dan buat draft baru
                jika perlu perubahan.
              </span>
            </li>
          </ol>
          <div className="mt-7 grid gap-3 border-t border-background/15 pt-6 [&>button]:w-full">
            <ConfirmAction
              triggerLabel="Tinjau dan terbitkan"
              title="Terbitkan pekerjaan ini?"
              description="Pekerja dapat melihat ketentuan dan melamar setelah pekerjaan terbit. Ketentuan saat pekerja diterima akan disimpan sebagai Kesepakatan Kerja."
              confirmLabel="Terbitkan pekerjaan"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 border-background/20 bg-transparent text-background hover:border-background/35 hover:bg-background/10 hover:text-background"
            >
              Simpan draft
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}
