"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import { Eye, Info, LockKeyhole, ShieldCheck, CircleAlert } from "lucide-react";

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

import { createJobDraft, updateJobDraft, publishJob } from "@/server/domain/jobs/actions";

type JobDraftInput = {
  title: string;
  categoryId: string;
  areaId: string;
  description: string;
  taskScope: string;
  publicLocationLabel: string;
  startsAt: string;
  estimatedMinutes: number;
  applicationDeadline: string;
  fullAddress: string;
  toolsProvided?: string;
  toolsRequired?: string;
  wageAmount: number;
  wageUnit: string;
  paymentMethod: string;
  paymentTiming: string;
  riskLevel: string;
  isFirstOpportunity: boolean;
};

type WageGuidelineReference = {
  areaId: string;
  categoryId: string;
  minimumAmount: number;
  recommendedAmount: number;
  unit: string;
  sourceLabel: string;
  isSimulated: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
};

type ReferenceData = {
  areas: { id: string; name: string }[];
  categories: { id: string; name: string; riskLevel: string; firstOpportunityAllowed: boolean }[];
  wageGuidelines: WageGuidelineReference[];
};

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
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-32 rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-10">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.02em] text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {number}
            </span>
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-base text-muted-foreground">{description}</p>
        </div>
        <div className="hidden rounded-2xl bg-muted/50 p-3 text-muted-foreground sm:block">
          {icon}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  children,
  error,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string[];
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error[0]}</p>}
    </div>
  );
}

export function JobForm({
  referenceData,
  initialData,
  jobId,
}: {
  referenceData: ReferenceData;
  initialData?: Partial<JobDraftInput>;
  jobId?: string;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    categoryId: initialData?.categoryId || "",
    areaId: initialData?.areaId || "",
    description: initialData?.description || "",
    taskScope: initialData?.taskScope || "",
    publicLocationLabel: initialData?.publicLocationLabel || "",
    startsAt: initialData?.startsAt ? new Date(initialData.startsAt).toISOString().slice(0, 16) : "",
    estimatedMinutes: initialData?.estimatedMinutes || "",
    applicationDeadline: initialData?.applicationDeadline ? new Date(initialData.applicationDeadline).toISOString().slice(0, 16) : "",
    fullAddress: initialData?.fullAddress || "",
    providedTools: initialData?.toolsProvided || "",
    requiredTools: initialData?.toolsRequired || "",
    wageAmount: initialData?.wageAmount || "",
    wageUnit: initialData?.wageUnit || "",
    paymentMethod: initialData?.paymentMethod || "",
    paymentTiming: initialData?.paymentTiming || "",
    isFirstOpportunity: initialData?.isFirstOpportunity || false,
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedCategory = useMemo(() => referenceData.categories.find(c => c.id === formData.categoryId), [formData.categoryId, referenceData.categories]);
  const activeGuideline = useMemo(() => {
    const guidelineDate = formData.startsAt
      ? new Date(formData.startsAt).toISOString().slice(0, 10)
      : null;

    return referenceData.wageGuidelines.find(
      (wg) =>
        wg.categoryId === formData.categoryId &&
        wg.areaId === formData.areaId &&
        wg.unit === formData.wageUnit &&
        (!guidelineDate ||
          (wg.effectiveFrom <= guidelineDate &&
            (!wg.effectiveTo || wg.effectiveTo > guidelineDate))),
    );
  }, [formData.categoryId, formData.areaId, formData.wageUnit, formData.startsAt, referenceData.wageGuidelines]);

  let wageWarning = "";
  if (!activeGuideline && formData.categoryId && formData.areaId && formData.wageUnit) {
    wageWarning = "Kategori ini belum memiliki panduan upah aktif untuk area, satuan upah, dan tanggal kerja tersebut. Kesempatan Pertama belum dapat diterbitkan sampai referensi tersedia.";
  } else if (activeGuideline && formData.wageAmount && Number(formData.wageAmount) < activeGuideline.minimumAmount) {
    wageWarning = `Upah di bawah referensi minimum (Minimum: Rp ${activeGuideline.minimumAmount.toLocaleString("id-ID")}). Tidak bisa diterbitkan sebagai Kesempatan Pertama.`;
  }

  const prepareInput = () => {
    return {
      title: formData.title,
      categoryId: formData.categoryId,
      areaId: formData.areaId,
      description: formData.description,
      taskScope: formData.taskScope,
      publicLocationLabel: formData.publicLocationLabel,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
      estimatedMinutes: Number(formData.estimatedMinutes),
      applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : undefined,
      fullAddress: formData.fullAddress,
      toolsProvided: formData.providedTools || undefined,
      toolsRequired: formData.requiredTools || undefined,
      wageAmount: Number(formData.wageAmount),
      wageUnit: formData.wageUnit,
      paymentMethod: formData.paymentMethod,
      paymentTiming: formData.paymentTiming,
      riskLevel: selectedCategory?.riskLevel || "low",
      isFirstOpportunity: formData.isFirstOpportunity,
    };
  };

  const onSaveDraft = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setErrors({});
    setGlobalError(null);

    try {
      const payload = prepareInput();
      
      if (jobId) {
        await updateJobDraft(jobId, payload);
        router.push("/employer/jobs");
      } else {
        await createJobDraft(payload);
        router.push("/employer/jobs");
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "fieldErrors" in error) {
        setErrors((error as { fieldErrors: Record<string, string[]> }).fieldErrors);
      } else {
        setGlobalError((error as Error).message || "Terjadi kesalahan.");
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const onPublish = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setErrors({});
    setGlobalError(null);

    try {
      const payload = prepareInput();
      
      let currentJobId = jobId;
      if (currentJobId) {
        await updateJobDraft(currentJobId, payload);
      } else {
        const res = await createJobDraft(payload);
        currentJobId = res.jobId;
      }
      
      await publishJob(currentJobId!);
      router.push(`/employer/jobs/${currentJobId}`);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "fieldErrors" in error) {
        setErrors((error as { fieldErrors: Record<string, string[]> }).fieldErrors);
      } else {
        setGlobalError((error as Error).message || "Terjadi kesalahan saat mempublikasikan.");
      }
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16 xl:grid-cols-[1fr_400px]">
      <div className="grid gap-10 sm:gap-12">
        {globalError && (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertTitle>Gagal Menyimpan</AlertTitle>
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <FormSection
          number="01"
          title="Informasi publik"
          description="Akan tampil di halaman pencarian dan dilihat oleh seluruh pekerja."
          icon={<Eye className="size-4" aria-hidden="true" />}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Judul pekerjaan" id="title" error={errors.title}>
                <Input name="title" value={formData.title} onChange={handleTextChange} placeholder="Contoh: Kru Event Pameran Buku" className="h-11" />
              </Field>
            </div>
            <Field label="Kategori" id="category" error={errors.categoryId}>
              <Select value={formData.categoryId} onValueChange={(val) => handleSelectChange("categoryId", val)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {referenceData.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Area umum" id="area" error={errors.areaId}>
              <Select value={formData.areaId} onValueChange={(val) => handleSelectChange("areaId", val)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Pilih area" />
                </SelectTrigger>
                <SelectContent>
                  {referenceData.areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Deskripsi pekerjaan" id="description" error={errors.description}>
                <Textarea name="description" value={formData.description} onChange={handleTextChange} placeholder="Tujuan pekerjaan..." className="min-h-32" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Ruang lingkup tugas" id="taskScope" error={errors.taskScope}>
                <Textarea name="taskScope" value={formData.taskScope} onChange={handleTextChange} placeholder="Rincian tugas spesifik..." className="min-h-32" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Label lokasi publik" id="publicLocationLabel" error={errors.publicLocationLabel}>
                <Input name="publicLocationLabel" value={formData.publicLocationLabel} onChange={handleTextChange} placeholder="Kecamatan, kota" className="h-11" />
              </Field>
            </div>
            <Field label="Mulai kerja" id="startsAt" error={errors.startsAt}>
              <Input type="datetime-local" name="startsAt" value={formData.startsAt} onChange={handleTextChange} className="h-11" />
            </Field>
            <Field label="Estimasi durasi (Menit)" id="estimatedMinutes" error={errors.estimatedMinutes}>
              <Input type="number" name="estimatedMinutes" value={formData.estimatedMinutes} onChange={handleTextChange} className="h-11" />
            </Field>
            <Field label="Batas waktu lamaran" id="applicationDeadline" error={errors.applicationDeadline}>
              <Input type="datetime-local" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleTextChange} className="h-11" />
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
            <Field label="Alamat lengkap" id="fullAddress" error={errors.fullAddress}>
              <Textarea name="fullAddress" value={formData.fullAddress} onChange={handleTextChange} placeholder="Alamat tempat kerja lengkap" className="min-h-24" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Peralatan disediakan" id="providedTools" error={errors.toolsProvided}>
                <Input name="providedTools" value={formData.providedTools} onChange={handleTextChange} placeholder="Meja registrasi" className="h-11" />
              </Field>
              <Field label="Peralatan dibawa" id="requiredTools" error={errors.toolsRequired}>
                <Input name="requiredTools" value={formData.requiredTools} onChange={handleTextChange} placeholder="Tidak ada" className="h-11" />
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
            <Field label="Nominal upah (Rupiah)" id="wageAmount" error={errors.wageAmount}>
              <Input type="number" name="wageAmount" value={formData.wageAmount} onChange={handleTextChange} className="h-11" />
            </Field>
            <Field label="Satuan" id="wageUnit" error={errors.wageUnit}>
              <Select value={formData.wageUnit} onValueChange={(val) => handleSelectChange("wageUnit", val)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Per jam</SelectItem>
                  <SelectItem value="day">Per hari</SelectItem>
                  <SelectItem value="job">Per pekerjaan</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Metode pembayaran" id="paymentMethod" error={errors.paymentMethod}>
              <Input name="paymentMethod" value={formData.paymentMethod} onChange={handleTextChange} placeholder="Transfer BCA / Tunai" className="h-11" />
            </Field>
            <Field label="Waktu pembayaran" id="paymentTiming" error={errors.paymentTiming}>
              <Input name="paymentTiming" value={formData.paymentTiming} onChange={handleTextChange} placeholder="Setelah selesai" className="h-11" />
            </Field>

            {activeGuideline ? (
              <div className="sm:col-span-2">
                <Alert>
                  <Info aria-hidden="true" />
                  <AlertTitle>Panduan Upah yang berlaku</AlertTitle>
                  <AlertDescription>
                    Referensi minimum Rp{" "}
                    {activeGuideline.minimumAmount.toLocaleString("id-ID")} dan
                    rekomendasi Rp{" "}
                    {activeGuideline.recommendedAmount.toLocaleString("id-ID")}{" "}
                    per {activeGuideline.unit}. Sumber:{" "}
                    {activeGuideline.sourceLabel}
                    {activeGuideline.isSimulated
                      ? " · data simulasi, bukan ketentuan upah resmi"
                      : ""}
                    .
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}

            {wageWarning && (
              <div className="sm:col-span-2">
                <Alert className="border-amber-300/70 bg-amber-50/80 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                  <Info aria-hidden="true" />
                  <AlertTitle>Perhatian Upah</AlertTitle>
                  <AlertDescription className="dark:text-amber-100/70">
                    {wageWarning}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex items-start gap-3 border-t border-border/70 pt-5 sm:col-span-2">
              <Checkbox 
                id="isFirstOpportunity" 
                checked={formData.isFirstOpportunity} 
                onCheckedChange={(c) => setFormData(p => ({ ...p, isFirstOpportunity: !!c }))}
                disabled={Boolean(
                  !selectedCategory?.firstOpportunityAllowed ||
                    !activeGuideline ||
                    (formData.wageAmount &&
                      Number(formData.wageAmount) < activeGuideline.minimumAmount),
                )}
              />
              <div>
                <Label htmlFor="isFirstOpportunity">Jadikan Kesempatan Pertama</Label>
                <p className="mt-1 max-w-2xl text-base leading-7 text-muted-foreground">
                  Hanya bisa dicentang jika sesuai Panduan Upah dan kategori ini mendukung Kesempatan Pertama.
                </p>
              </div>
            </div>
          </div>
        </FormSection>
      </div>

      <aside className="rounded-[1.75rem] bg-foreground p-6 text-background shadow-[0_28px_70px_-42px_rgb(15_23_42/0.7)] xl:sticky xl:top-24">
        <p className="text-xs font-semibold tracking-[0.16em] text-background/70">LANGKAH BERIKUTNYA</p>
        <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">Periksa sebelum terbit</h2>
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
            <span>Ketentuan terbit tidak dapat diedit. Batalkan dan buat draft baru jika perlu perubahan.</span>
          </li>
        </ol>
        <div className="mt-7 grid gap-3 border-t border-background/15 pt-6 [&>button]:w-full">
          <Button type="button" onClick={onPublish} className="w-full text-foreground bg-background hover:bg-background/90">
            Terbitkan pekerjaan
          </Button>
          <Button type="button" onClick={onSaveDraft} variant="outline" className="h-11 border-background/20 bg-transparent text-background hover:border-background/35 hover:bg-background/10 hover:text-background">
            Simpan draft
          </Button>
        </div>
      </aside>
    </div>
  );
}
