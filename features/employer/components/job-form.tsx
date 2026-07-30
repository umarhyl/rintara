"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import {
  CalendarClock,
  CircleAlert,
  Info,
  LoaderCircle,
} from "lucide-react";

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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  submitCreateJobDraft,
  submitPublishJob,
  submitUpdateJobDraft,
} from "@/app/employer/jobs/actions";

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
  arrivalInstructions?: string;
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

const selectionCutoffFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function selectionCutoffFor(startsAt: string) {
  if (!startsAt) return null;

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) return null;

  return new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

type JobFormFailure = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const errorFieldIds: Record<string, string> = {
  categoryId: "category",
  areaId: "area",
  toolsProvided: "providedTools",
  toolsRequired: "requiredTools",
};

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24 rounded-xl bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="flex items-center gap-3 text-xl font-semibold tracking-[-0.02em] text-foreground">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {number}
          </span>
          {title}
        </h2>
        <p className="mt-2 max-w-[62ch] text-base leading-6 text-muted-foreground">
          {description}
        </p>
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
      {error?.length ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

function fieldA11y(id: string, error?: string[]) {
  const invalid = Boolean(error?.length);

  return {
    id,
    "aria-invalid": invalid,
    "aria-describedby": invalid ? `${id}-error` : undefined,
  };
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
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const persistedJobIdRef = useRef(jobId);
  const [formOpenedAt] = useState(Date.now);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    categoryId: initialData?.categoryId || "",
    areaId: initialData?.areaId || "",
    description: initialData?.description || "",
    taskScope: initialData?.taskScope || "",
    publicLocationLabel: initialData?.publicLocationLabel || "",
    startsAt: initialData?.startsAt
      ? toLocalDateTimeInput(initialData.startsAt)
      : "",
    estimatedMinutes: initialData?.estimatedMinutes || "",
    applicationDeadline: initialData?.applicationDeadline
      ? toLocalDateTimeInput(initialData.applicationDeadline)
      : "",
    fullAddress: initialData?.fullAddress || "",
    arrivalInstructions: initialData?.arrivalInstructions || "",
    providedTools: initialData?.toolsProvided || "",
    requiredTools: initialData?.toolsRequired || "",
    wageAmount: initialData?.wageAmount || "",
    wageUnit: initialData?.wageUnit || "",
    paymentMethod: initialData?.paymentMethod || "",
    paymentTiming: initialData?.paymentTiming || "",
    isFirstOpportunity: initialData?.isFirstOpportunity || false,
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [submissionIntent, setSubmissionIntent] = useState<
    "draft" | "publish" | null
  >(null);
  const isSubmitting = submissionIntent !== null;
  const referenceDataUnavailable =
    referenceData.areas.length === 0 || referenceData.categories.length === 0;

  const showFailure = (
    failure: JobFormFailure,
    intent: "draft" | "publish",
  ) => {
    const fieldErrors = failure.fieldErrors ?? {};
    setErrors(fieldErrors);
    setFormError({
      title:
        intent === "publish"
          ? "Pekerjaan belum diterbitkan"
          : "Draf belum tersimpan",
      message: failure.message,
    });

    const firstField = Object.keys(fieldErrors)[0];
    if (firstField) {
      window.requestAnimationFrame(() => {
        document
          .getElementById(errorFieldIds[firstField] ?? firstField)
          ?.focus();
      });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const fieldName =
      e.target.name === "providedTools"
        ? "toolsProvided"
        : e.target.name === "requiredTools"
          ? "toolsRequired"
          : e.target.name;
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((current) => {
      if (!current[fieldName]) return current;
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const selectedCategory = useMemo(() => referenceData.categories.find(c => c.id === formData.categoryId), [formData.categoryId, referenceData.categories]);
  const selectionCutoff = useMemo(
    () => selectionCutoffFor(formData.startsAt),
    [formData.startsAt],
  );
  const selectionCutoffHasPassed =
    selectionCutoff !== null && selectionCutoff.getTime() <= formOpenedAt;
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
      arrivalInstructions: formData.arrivalInstructions || undefined,
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
    if (referenceDataUnavailable || !formRef.current?.reportValidity()) return;
    submittingRef.current = true;
    setSubmissionIntent("draft");
    setErrors({});
    setFormError(null);

    try {
      const payload = prepareInput();

      if (persistedJobIdRef.current) {
        const result = await submitUpdateJobDraft(
          persistedJobIdRef.current,
          payload,
        );
        if (!result.ok) {
          showFailure(result, "draft");
          return;
        }
        router.push("/employer/jobs");
      } else {
        const result = await submitCreateJobDraft(payload);
        if (!result.ok) {
          showFailure(result, "draft");
          return;
        }
        persistedJobIdRef.current = result.jobId;
        router.push("/employer/jobs");
      }
    } catch {
      setFormError({
        title: "Draf belum tersimpan",
        message:
          "Hubungan ke server terputus. Periksa jaringan lalu coba lagi.",
      });
    } finally {
      submittingRef.current = false;
      setSubmissionIntent(null);
    }
  };

  const onPublish = async () => {
    if (submittingRef.current) return;
    if (referenceDataUnavailable || !formRef.current?.reportValidity()) {
      setPublishDialogOpen(false);
      return;
    }
    submittingRef.current = true;
    setSubmissionIntent("publish");
    setErrors({});
    setFormError(null);

    try {
      const payload = prepareInput();
      
      let currentJobId = persistedJobIdRef.current;
      if (currentJobId) {
        const updateResult = await submitUpdateJobDraft(currentJobId, payload);
        if (!updateResult.ok) {
          showFailure(updateResult, "publish");
          setPublishDialogOpen(false);
          return;
        }
      } else {
        const createResult = await submitCreateJobDraft(payload);
        if (!createResult.ok) {
          showFailure(createResult, "publish");
          setPublishDialogOpen(false);
          return;
        }
        currentJobId = createResult.jobId;
        persistedJobIdRef.current = currentJobId;
      }

      const publishResult = await submitPublishJob(currentJobId);
      if (!publishResult.ok) {
        showFailure(publishResult, "publish");
        setPublishDialogOpen(false);
        return;
      }
      router.push(`/employer/jobs/${currentJobId}`);
    } catch {
      setFormError({
        title: "Pekerjaan belum diterbitkan",
        message:
          "Hubungan ke server terputus. Periksa jaringan lalu coba lagi.",
      });
      setPublishDialogOpen(false);
    } finally {
      submittingRef.current = false;
      setSubmissionIntent(null);
    }
  };

  return (
    <form
      ref={formRef}
      className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-8"
      aria-busy={isSubmitting}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid gap-7">
        {formError ? (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertTitle>{formError.title}</AlertTitle>
            <AlertDescription>{formError.message}</AlertDescription>
          </Alert>
        ) : null}

        {referenceDataUnavailable ? (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertTitle>Form belum dapat digunakan</AlertTitle>
            <AlertDescription>
              Area atau kategori aktif belum tersedia. Hubungi admin lalu muat
              ulang halaman ini.
            </AlertDescription>
          </Alert>
        ) : null}

        <FormSection
          number="1"
          title="Informasi publik"
          description="Akan tampil di halaman pencarian dan dilihat oleh seluruh pekerja."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Judul pekerjaan" id="title" error={errors.title}>
                <Input
                  {...fieldA11y("title", errors.title)}
                  name="title"
                  value={formData.title}
                  onChange={handleTextChange}
                  placeholder="Contoh: Kru Event Pameran Buku"
                  className="h-11 rounded-xl"
                  minLength={5}
                  maxLength={160}
                  required
                />
              </Field>
            </div>
            <Field label="Kategori" id="category" error={errors.categoryId}>
              <Select value={formData.categoryId} onValueChange={(val) => handleSelectChange("categoryId", val)}>
                <SelectTrigger
                  {...fieldA11y("category", errors.categoryId)}
                  className="h-11 w-full rounded-xl"
                >
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
                <SelectTrigger
                  {...fieldA11y("area", errors.areaId)}
                  className="h-11 w-full rounded-xl"
                >
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
                <Textarea
                  {...fieldA11y("description", errors.description)}
                  name="description"
                  value={formData.description}
                  onChange={handleTextChange}
                  placeholder="Tujuan pekerjaan..."
                  className="min-h-24 rounded-xl"
                  minLength={20}
                  maxLength={2000}
                  required
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Ruang lingkup tugas" id="taskScope" error={errors.taskScope}>
                <Textarea
                  {...fieldA11y("taskScope", errors.taskScope)}
                  name="taskScope"
                  value={formData.taskScope}
                  onChange={handleTextChange}
                  placeholder="Rincian tugas spesifik..."
                  className="min-h-24 rounded-xl"
                  minLength={10}
                  maxLength={1000}
                  required
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Label lokasi publik" id="publicLocationLabel" error={errors.publicLocationLabel}>
                <Input
                  {...fieldA11y(
                    "publicLocationLabel",
                    errors.publicLocationLabel,
                  )}
                  name="publicLocationLabel"
                  value={formData.publicLocationLabel}
                  onChange={handleTextChange}
                  placeholder="Kecamatan, kota"
                  className="h-11 rounded-xl"
                  minLength={3}
                  maxLength={60}
                  required
                />
              </Field>
            </div>
            <Field label="Mulai kerja" id="startsAt" error={errors.startsAt}>
              <Input
                {...fieldA11y("startsAt", errors.startsAt)}
                type="datetime-local"
                name="startsAt"
                value={formData.startsAt}
                onChange={handleTextChange}
                className="h-11 rounded-xl"
                required
              />
            </Field>
            <Field label="Estimasi durasi (Menit)" id="estimatedMinutes" error={errors.estimatedMinutes}>
              <Input
                {...fieldA11y("estimatedMinutes", errors.estimatedMinutes)}
                type="number"
                name="estimatedMinutes"
                value={formData.estimatedMinutes}
                onChange={handleTextChange}
                className="h-11 rounded-xl"
                min={15}
                max={10080}
                step={1}
                required
              />
            </Field>
            <Field label="Batas waktu lamaran" id="applicationDeadline" error={errors.applicationDeadline}>
              <Input
                {...fieldA11y(
                  "applicationDeadline",
                  errors.applicationDeadline,
                )}
                type="datetime-local"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleTextChange}
                className="h-11 rounded-xl"
                required
              />
            </Field>
            <div
              className="flex min-h-20 items-start gap-3 rounded-xl bg-secondary/70 p-4 sm:col-span-2"
              aria-live="polite"
            >
              <CalendarClock
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">Batas pemilihan pekerja</p>
                <p className="mt-1 text-base leading-6 text-muted-foreground">
                  {selectionCutoffHasPassed
                    ? "Waktu mulai terlalu dekat. Pilih waktu mulai kerja lebih dari 24 jam dari sekarang agar batas lamaran masih dapat diatur."
                    : selectionCutoff
                      ? `${selectionCutoffFormatter.format(selectionCutoff)}. Batas lamaran harus lebih awal dari waktu ini.`
                    : "Isi waktu mulai kerja untuk melihat batas pemilihan otomatis."}
                </p>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          number="2"
          title="Detail privat"
          description="Alamat lengkap baru terbuka setelah satu pekerja diterima."
        >
          <div className="grid gap-5">
            <Field label="Alamat lengkap" id="fullAddress" error={errors.fullAddress}>
              <Textarea
                {...fieldA11y("fullAddress", errors.fullAddress)}
                name="fullAddress"
                value={formData.fullAddress}
                onChange={handleTextChange}
                placeholder="Alamat tempat kerja lengkap"
                className="min-h-24 rounded-xl"
                minLength={10}
                maxLength={300}
                required
              />
            </Field>
            <Field
              label="Petunjuk kedatangan (opsional)"
              id="arrivalInstructions"
              error={errors.arrivalInstructions}
            >
              <Textarea
                {...fieldA11y(
                  "arrivalInstructions",
                  errors.arrivalInstructions,
                )}
                name="arrivalInstructions"
                value={formData.arrivalInstructions}
                onChange={handleTextChange}
                placeholder="Contoh: masuk melalui lobi utama dan temui koordinator."
                className="min-h-20 rounded-xl"
                maxLength={500}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Peralatan disediakan" id="providedTools" error={errors.toolsProvided}>
                <Input
                  {...fieldA11y("providedTools", errors.toolsProvided)}
                  name="providedTools"
                  value={formData.providedTools}
                  onChange={handleTextChange}
                  placeholder="Meja registrasi"
                  className="h-11 rounded-xl"
                  maxLength={200}
                />
              </Field>
              <Field label="Peralatan dibawa" id="requiredTools" error={errors.toolsRequired}>
                <Input
                  {...fieldA11y("requiredTools", errors.toolsRequired)}
                  name="requiredTools"
                  value={formData.requiredTools}
                  onChange={handleTextChange}
                  placeholder="Tidak ada"
                  className="h-11 rounded-xl"
                  maxLength={200}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection
          number="3"
          title="Upah & kelayakan"
          description="Ketentuan pembayaran dicatat dalam Kesepakatan Kerja."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nominal upah (Rupiah)" id="wageAmount" error={errors.wageAmount}>
              <Input
                {...fieldA11y("wageAmount", errors.wageAmount)}
                type="number"
                name="wageAmount"
                value={formData.wageAmount}
                onChange={handleTextChange}
                className="h-11 rounded-xl"
                min={10000}
                max={100000000}
                step={1}
                required
              />
            </Field>
            <Field label="Satuan" id="wageUnit" error={errors.wageUnit}>
              <Select value={formData.wageUnit} onValueChange={(val) => handleSelectChange("wageUnit", val)}>
                <SelectTrigger
                  {...fieldA11y("wageUnit", errors.wageUnit)}
                  className="h-11 w-full rounded-xl"
                >
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
              <Input
                {...fieldA11y("paymentMethod", errors.paymentMethod)}
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleTextChange}
                placeholder="Transfer BCA / Tunai"
                className="h-11 rounded-xl"
                minLength={2}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Waktu pembayaran" id="paymentTiming" error={errors.paymentTiming}>
              <Input
                {...fieldA11y("paymentTiming", errors.paymentTiming)}
                name="paymentTiming"
                value={formData.paymentTiming}
                onChange={handleTextChange}
                placeholder="Setelah selesai"
                className="h-11 rounded-xl"
                minLength={2}
                maxLength={100}
                required
              />
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
                <Alert className="border-amber-300/70 bg-amber-50/80 text-amber-950">
                  <Info aria-hidden="true" />
                  <AlertTitle>Perhatian Upah</AlertTitle>
                  <AlertDescription>
                    {wageWarning}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-xl bg-secondary/70 p-4 sm:col-span-2">
              <Checkbox 
                id="isFirstOpportunity" 
                checked={formData.isFirstOpportunity} 
                onCheckedChange={(c) => setFormData(p => ({ ...p, isFirstOpportunity: !!c }))}
                aria-describedby="isFirstOpportunity-help"
                disabled={
                  !formData.isFirstOpportunity &&
                  Boolean(
                    !selectedCategory?.firstOpportunityAllowed ||
                      !activeGuideline ||
                      (formData.wageAmount &&
                        Number(formData.wageAmount) <
                          activeGuideline.minimumAmount),
                  )
                }
              />
              <div>
                <Label htmlFor="isFirstOpportunity">Jadikan Kesempatan Pertama</Label>
                <p id="isFirstOpportunity-help" className="mt-1 max-w-2xl text-base leading-7 text-muted-foreground">
                  Hanya bisa dicentang jika sesuai Panduan Upah dan kategori ini mendukung Kesempatan Pertama.
                </p>
              </div>
            </div>
          </div>
        </FormSection>
      </div>

      <aside className="h-fit rounded-xl bg-primary/[0.07] p-5 text-foreground sm:p-6 xl:sticky xl:top-20">
        <p className="text-sm font-semibold text-primary">Langkah berikutnya</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
          Periksa sebelum terbit
        </h2>
        <ol className="mt-4 grid gap-3 text-base leading-6 text-muted-foreground">
          <li className="grid grid-cols-[1.5rem_1fr] gap-3">
            <span className="font-semibold text-primary">01</span>
            <span>Pastikan informasi publik tidak memuat alamat lengkap.</span>
          </li>
          <li className="grid grid-cols-[1.5rem_1fr] gap-3">
            <span className="font-semibold text-primary">02</span>
            <span>Kategori, risiko, dan upah akan diperiksa ketika diterbitkan.</span>
          </li>
          <li className="grid grid-cols-[1.5rem_1fr] gap-3">
            <span className="font-semibold text-primary">03</span>
            <span>Ketentuan terbit tidak dapat diedit. Batalkan dan buat draft baru jika perlu perubahan.</span>
          </li>
        </ol>
        <div className="mt-6 grid gap-3 [&>button]:w-full">
          <Dialog
            open={publishDialogOpen}
            onOpenChange={(open) => {
              if (!isSubmitting) setPublishDialogOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                disabled={isSubmitting || referenceDataUnavailable}
                onClick={(event) => {
                  if (!formRef.current?.reportValidity()) {
                    event.preventDefault();
                  }
                }}
                className="w-full rounded-xl"
              >
                Terbitkan pekerjaan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Terbitkan pekerjaan ini?</DialogTitle>
                <DialogDescription className="text-base leading-7">
                  Ketentuan akan terlihat oleh pekerja dan tidak dapat diedit
                  setelah terbit. Alamat lengkap tetap privat sampai satu
                  pekerja diterima.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl bg-secondary/70 p-4 text-sm leading-6 text-muted-foreground">
                Pastikan jadwal, tugas, upah, serta batas lamaran sudah benar.
                Jika ketentuan terbit perlu diubah, pekerjaan harus dibatalkan
                lalu dibuat sebagai draf baru.
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={isSubmitting}
                  >
                    Periksa lagi
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  className="h-11"
                  disabled={isSubmitting}
                  onClick={onPublish}
                >
                  {submissionIntent === "publish" ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  {submissionIntent === "publish"
                    ? "Menerbitkan..."
                    : "Ya, terbitkan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={isSubmitting || referenceDataUnavailable}
            variant="outline"
            className="h-11 rounded-xl border-primary/25 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
          >
            {submissionIntent === "draft" ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {submissionIntent === "draft" ? "Menyimpan draft..." : "Simpan draft"}
          </Button>
          <p
            className={submissionIntent ? "text-sm text-muted-foreground" : "sr-only"}
            role="status"
            aria-live="polite"
          >
            {submissionIntent === "publish"
              ? "Sedang memeriksa dan menerbitkan pekerjaan."
              : submissionIntent === "draft"
                ? "Sedang menyimpan perubahan draft."
                : ""}
          </p>
        </div>
      </aside>
    </form>
  );
}
