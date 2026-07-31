"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
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
import { cn } from "@/lib/utils";

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

type PaymentKind = "" | "cash" | "non_cash";

const nonCashPaymentMethods = [
  { value: "QRIS", label: "QRIS" },
  { value: "Transfer bank", label: "Transfer bank" },
  { value: "Dompet digital", label: "Dompet digital" },
] as const;

function paymentKindFromMethod(paymentMethod?: string): PaymentKind {
  if (!paymentMethod) return "";

  return /^(tunai|cash)/i.test(paymentMethod) ? "cash" : "non_cash";
}

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
  paymentMethod: "paymentKind",
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [paymentKind, setPaymentKind] = useState<PaymentKind>(() =>
    paymentKindFromMethod(initialData?.paymentMethod),
  );

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
      const step1Fields = ["title", "categoryId", "areaId", "description", "taskScope", "publicLocationLabel", "startsAt", "estimatedMinutes", "applicationDeadline"];
      const step2Fields = ["fullAddress", "arrivalInstructions", "providedTools", "toolsProvided", "requiredTools", "toolsRequired"];
      if (step1Fields.includes(firstField)) {
        setCurrentStep(1);
      } else if (step2Fields.includes(firstField)) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }

      window.requestAnimationFrame(() => {
        document
          .getElementById(errorFieldIds[firstField] ?? firstField)
          ?.focus();
      });
    }
  };

  const validateStep = (step: number): boolean => {
    setErrors({});
    setFormError(null);
    const newErrors: Record<string, string[]> = {};

    if (step === 1) {
      if (!formData.title || formData.title.trim().length < 5) {
        newErrors.title = ["Judul pekerjaan minimal 5 karakter."];
      }
      if (!formData.categoryId) {
        newErrors.categoryId = ["Pilih kategori pekerjaan."];
      }
      if (!formData.areaId) {
        newErrors.areaId = ["Pilih area umum pekerjaan."];
      }
      if (!formData.description || formData.description.trim().length < 20) {
        newErrors.description = ["Deskripsi pekerjaan minimal 20 karakter."];
      }
      if (!formData.taskScope || formData.taskScope.trim().length < 10) {
        newErrors.taskScope = ["Ruang lingkup tugas minimal 10 karakter."];
      }
      if (!formData.publicLocationLabel || formData.publicLocationLabel.trim().length < 3) {
        newErrors.publicLocationLabel = ["Label lokasi publik minimal 3 karakter."];
      }
      if (!formData.startsAt) {
        newErrors.startsAt = ["Isi waktu mulai kerja."];
      }
      if (!formData.estimatedMinutes || Number(formData.estimatedMinutes) < 15) {
        newErrors.estimatedMinutes = ["Estimasi durasi minimal 15 menit."];
      }
      if (!formData.applicationDeadline) {
        newErrors.applicationDeadline = ["Isi batas waktu lamaran."];
      }
    } else if (step === 2) {
      if (!formData.fullAddress || formData.fullAddress.trim().length < 10) {
        newErrors.fullAddress = ["Alamat lengkap minimal 10 karakter."];
      }
    } else if (step === 3) {
      if (!formData.wageAmount || Number(formData.wageAmount) < 10000) {
        newErrors.wageAmount = ["Upah minimal Rp 10.000."];
      }
      if (!formData.wageUnit) {
        newErrors.wageUnit = ["Pilih satuan upah."];
      }
      if (!formData.paymentMethod) {
        newErrors.paymentMethod = ["Pilih jenis dan metode pembayaran."];
      }
      if (!formData.paymentTiming || formData.paymentTiming.trim().length < 2) {
        newErrors.paymentTiming = ["Isi waktu pembayaran."];
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstField = Object.keys(newErrors)[0];
      if (firstField) {
        window.requestAnimationFrame(() => {
          document.getElementById(errorFieldIds[firstField] ?? firstField)?.focus();
        });
      }
      return false;
    }

    return true;
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

  const handlePaymentKindChange = (value: PaymentKind) => {
    setPaymentKind(value);
    setFormData((current) => ({
      ...current,
      paymentMethod: value === "cash" ? "Tunai (COD)" : "",
    }));
    setErrors((current) => {
      if (!current.paymentMethod) return current;
      const next = { ...current };
      delete next.paymentMethod;
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

  const steps = [
    { step: 1, title: "Informasi publik", desc: "Tugas & Jadwal" },
    { step: 2, title: "Detail privat", desc: "Alamat & Alat" },
    { step: 3, title: "Upah & kelayakan", desc: "Pembayaran & Ketentuan" },
  ] as const;

  return (
    <form
      ref={formRef}
      className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-8"
      aria-busy={isSubmitting}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid gap-6">
        {/* Stepper Header Navigation */}
        <nav aria-label="Langkah pembuatan pekerjaan">
          <ol className="grid grid-cols-3 gap-2 rounded-xl bg-card p-2.5 shadow-sm sm:gap-3 sm:p-3.5">
            {steps.map(({ step, title, desc }) => {
              const isActive = currentStep === step;
              const isCompleted = currentStep > step;
              return (
                <li key={step}>
                  <button
                    type="button"
                    onClick={() => {
                      if (step < currentStep || validateStep(currentStep)) {
                        setCurrentStep(step as 1 | 2 | 3);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors",
                      isActive && "bg-primary/10 text-primary font-semibold",
                      isCompleted && "text-foreground hover:bg-muted/50",
                      !isActive && !isCompleted && "text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold transition-colors",
                        isActive && "bg-primary text-primary-foreground",
                        isCompleted && "bg-primary/20 text-primary",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground",
                      )}
                    >
                      {isCompleted ? <Check className="size-4" /> : step}
                    </span>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium leading-tight">{title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

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

        {/* Section 1: Informasi Publik */}
        {currentStep === 1 ? (
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

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={onSaveDraft}
                disabled={isSubmitting || referenceDataUnavailable}
                className="h-11 rounded-xl border-primary/25 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
              >
                {submissionIntent === "draft" ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {submissionIntent === "draft" ? "Menyimpan draft..." : "Simpan draft"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (validateStep(1)) setCurrentStep(2);
                }}
                className="h-11 rounded-xl"
              >
                Lanjut ke Detail Privat <ArrowRight className="size-4" />
              </Button>
            </div>
          </FormSection>
        ) : null}

        {/* Section 2: Detail Privat */}
        {currentStep === 2 ? (
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

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="h-11 rounded-xl"
              >
                <ArrowLeft className="size-4" /> Kembali
              </Button>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveDraft}
                  disabled={isSubmitting || referenceDataUnavailable}
                  className="h-11 rounded-xl border-primary/25 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                >
                  {submissionIntent === "draft" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {submissionIntent === "draft" ? "Menyimpan draft..." : "Simpan draft"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep(2)) setCurrentStep(3);
                  }}
                  className="h-11 rounded-xl"
                >
                  Lanjut ke Upah & Kelayakan <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* Section 3: Upah & Kelayakan */}
        {currentStep === 3 ? (
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
              <Field label="Jenis pembayaran" id="paymentKind" error={errors.paymentMethod}>
                <Select
                  name="paymentKind"
                  value={paymentKind}
                  onValueChange={(value) =>
                    handlePaymentKindChange(value as PaymentKind)
                  }
                  required
                >
                  <SelectTrigger
                    {...fieldA11y("paymentKind", errors.paymentMethod)}
                    className="h-11 w-full rounded-xl"
                  >
                    <SelectValue placeholder="Pilih jenis pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai (COD)</SelectItem>
                    <SelectItem value="non_cash">Non-tunai</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {paymentKind === "non_cash" ? (
                <Field
                  label="Metode non-tunai"
                  id="paymentMethod"
                  error={errors.paymentMethod}
                >
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      handleSelectChange("paymentMethod", value)
                    }
                    required
                  >
                    <SelectTrigger
                      {...fieldA11y("paymentMethod", errors.paymentMethod)}
                      className="h-11 w-full rounded-xl"
                    >
                      <SelectValue placeholder="Pilih metode non-tunai" />
                    </SelectTrigger>
                    <SelectContent>
                      {nonCashPaymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                      {formData.paymentMethod &&
                      !nonCashPaymentMethods.some(
                        (method) => method.value === formData.paymentMethod,
                      ) ? (
                        <SelectItem value={formData.paymentMethod}>
                          {formData.paymentMethod}
                        </SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                  <p className="text-sm leading-5 text-muted-foreground">
                    Pembayaran dilakukan langsung di luar Rintara. Jangan
                    masukkan nomor rekening atau data akun pembayaran.
                  </p>
                </Field>
              ) : null}
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

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="h-11 rounded-xl"
              >
                <ArrowLeft className="size-4" /> Kembali
              </Button>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveDraft}
                  disabled={isSubmitting || referenceDataUnavailable}
                  className="h-11 rounded-xl border-primary/25 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                >
                  {submissionIntent === "draft" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {submissionIntent === "draft" ? "Menyimpan draft..." : "Simpan draft"}
                </Button>

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
                        if (!validateStep(3) || !formRef.current?.reportValidity()) {
                          event.preventDefault();
                        }
                      }}
                      className="h-11 rounded-xl"
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
              </div>
            </div>
          </FormSection>
        ) : null}
      </div>

      {/* Sidebar Guidance & Actions */}
      <aside className="h-fit rounded-xl bg-primary/[0.07] p-5 text-foreground sm:p-6 xl:sticky xl:top-20">
        <p className="text-sm font-semibold text-primary">Langkah {currentStep} dari 3</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
          {currentStep === 1
            ? "Informasi publik"
            : currentStep === 2
              ? "Detail lokasi & privat"
              : "Upah & kelayakan"}
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
          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={() => {
                if (validateStep(currentStep)) {
                  setCurrentStep((currentStep + 1) as 2 | 3);
                }
              }}
              className="w-full rounded-xl"
            >
              Langkah Berikutnya <ArrowRight className="size-4" />
            </Button>
          ) : (
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
                    if (!validateStep(3) || !formRef.current?.reportValidity()) {
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
          )}

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
