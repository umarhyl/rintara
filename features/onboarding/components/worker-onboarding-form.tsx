"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  MapPin,
} from "lucide-react";
import { submitWorkerOnboarding } from "@/app/auth/onboarding-actions";
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
import { MAX_WORKER_CATEGORY_INTERESTS } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { updateWorkerProfile } from "@/server/domain/profiles/actions";

type ReferenceOption = {
  id: string;
  name: string;
};

type InitialWorkerProfile = {
  displayName: string;
  areaId: string;
  areaName: string;
  bio: string | null;
  availabilityNote: string | null;
  categoryInterestIds: string[];
  verifiedCategoryIds: string[];
};

type FieldErrors = Record<string, string[] | undefined>;

export function WorkerProfileForm({
  areas,
  categories,
  nextPath,
  initialProfile,
}: {
  areas: ReferenceOption[];
  categories: ReferenceOption[];
  nextPath?: string;
  initialProfile?: InitialWorkerProfile;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const activeCategoryIds = new Set(categories.map(({ id }) => id));
  const areaIsActive = initialProfile
    ? areas.some(({ id }) => id === initialProfile.areaId)
    : true;
  const unavailableInterestCount =
    initialProfile?.categoryInterestIds.filter(
      (categoryId) => !activeCategoryIds.has(categoryId),
    ).length ?? 0;
  const [areaId, setAreaId] = useState(
    initialProfile && areaIsActive ? initialProfile.areaId : "",
  );
  const [categoryInterestIds, setCategoryInterestIds] = useState<string[]>(
    initialProfile?.categoryInterestIds.filter((categoryId) =>
      activeCategoryIds.has(categoryId),
    ) ?? [],
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function toggleCategory(categoryId: string, checked: boolean) {
    setCategoryInterestIds((current) => {
      if (checked) {
        return current.length < MAX_WORKER_CATEGORY_INTERESTS
          ? [...current, categoryId]
          : current;
      }

      return current.filter((id) => id !== categoryId);
    });
    setFieldErrors((current) => ({
      ...current,
      categoryInterestIds: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setAreaError(null);
    setFieldErrors({});

    if (!areaId) {
      const message = "Pilih area domisili untuk melanjutkan.";
      setError(message);
      setAreaError(message);
      window.requestAnimationFrame(() => document.getElementById("worker-area")?.focus());
      return;
    }

    if (submittingRef.current) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    submittingRef.current = true;
    setIsPending(true);
    let completed = false;

    try {
      const input = {
        displayName: String(formData.get("displayName") ?? ""),
        areaId,
        bio: String(formData.get("bio") ?? ""),
        availabilityNote: String(formData.get("availabilityNote") ?? ""),
        categoryInterestIds,
      };
      if (initialProfile) {
        const result = await updateWorkerProfile(input);
        if (!result.ok) {
          setError(result.message);
          setFieldErrors(result.fieldErrors ?? {});
          setAreaError(result.fieldErrors?.areaId?.[0] ?? null);
          return;
        }

        setSuccess(true);
        router.refresh();
      } else {
        const result = await submitWorkerOnboarding(input);
        if (!result.ok) {
          setError(result.message);
          return;
        }

        router.replace(nextPath ?? "/worker/dashboard");
        completed = true;
      }
    } catch {
      setError(
        "Koneksi terputus saat menyimpan profil. Periksa jaringan lalu coba lagi.",
      );
    } finally {
      if (!completed) {
        submittingRef.current = false;
        setIsPending(false);
      }
    }
  }

  const noAreaAvailable = areas.length === 0;

  return (
    <form className="grid gap-6" aria-busy={isPending} onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Profil belum tersimpan</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert className="border-success/30 bg-success-soft text-foreground">
          <CheckCircle2 className="text-success" aria-hidden="true" />
          <AlertTitle>Profil diperbarui</AlertTitle>
          <AlertDescription>Perubahan profilmu sudah tersimpan.</AlertDescription>
        </Alert>
      ) : null}

      {noAreaAvailable || !areaIsActive ? (
        <Alert>
          <MapPin aria-hidden="true" />
          <AlertTitle>
            {noAreaAvailable ? "Area belum tersedia" : "Pilih area baru"}
          </AlertTitle>
          <AlertDescription>
            {noAreaAvailable
              ? "Pilihan area sedang disiapkan. Muat ulang halaman ini beberapa saat lagi."
              : `${initialProfile?.areaName} tidak lagi tersedia untuk pembaruan profil.`}
          </AlertDescription>
        </Alert>
      ) : null}

      {unavailableInterestCount > 0 ? (
        <Alert>
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Kategori minat berubah</AlertTitle>
          <AlertDescription>
            {unavailableInterestCount} kategori lama tidak lagi tersedia dan akan
            dihapus saat profil disimpan.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="worker-display-name">Nama tampilan</Label>
          <Input
            id="worker-display-name"
            name="displayName"
            autoComplete="name"
            minLength={2}
            maxLength={120}
            placeholder="Nama yang ingin ditampilkan"
            defaultValue={initialProfile?.displayName}
            className="h-12"
            disabled={isPending}
            required
            aria-invalid={fieldErrors.displayName?.length ? true : undefined}
            aria-describedby={
              fieldErrors.displayName?.length ? "worker-display-name-error" : undefined
            }
          />
          {fieldErrors.displayName?.[0] ? (
            <p id="worker-display-name-error" className="text-sm text-destructive">
              {fieldErrors.displayName[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="worker-area">Area domisili</Label>
          <Select
            value={areaId}
            onValueChange={(value) => {
              setAreaId(value);
              setAreaError(null);
              setFieldErrors((current) => ({ ...current, areaId: undefined }));
            }}
            disabled={isPending || noAreaAvailable}
          >
            <SelectTrigger
              id="worker-area"
              className="h-12 w-full"
              aria-label="Area domisili"
              aria-invalid={areaError ? true : undefined}
              aria-describedby={areaError ? "worker-area-error" : undefined}
            >
              <SelectValue placeholder="Pilih kota atau kabupaten" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {areaError ? <p id="worker-area-error" className="text-sm leading-6 text-destructive">{areaError}</p> : null}
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="worker-bio">Bio singkat</Label>
            <span className="text-xs text-muted-foreground">Opsional</span>
          </div>
          <Textarea
            id="worker-bio"
            name="bio"
            maxLength={1000}
            placeholder="Ceritakan cara kerjamu, hal yang sedang dipelajari, atau pengalaman yang relevan."
            defaultValue={initialProfile?.bio ?? ""}
            className="min-h-24 resize-y"
            disabled={isPending}
            aria-invalid={fieldErrors.bio?.length ? true : undefined}
            aria-describedby={fieldErrors.bio?.length ? "worker-bio-error" : undefined}
          />
          {fieldErrors.bio?.[0] ? (
            <p id="worker-bio-error" className="text-sm text-destructive">
              {fieldErrors.bio[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="worker-availability">Ketersediaan</Label>
            <span className="text-xs text-muted-foreground">Opsional</span>
          </div>
          <Input
            id="worker-availability"
            name="availabilityNote"
            maxLength={500}
            placeholder="Misalnya: hari kerja setelah pukul 16.00 dan akhir pekan"
            defaultValue={initialProfile?.availabilityNote ?? ""}
            className="h-12"
            disabled={isPending}
            aria-invalid={
              fieldErrors.availabilityNote?.length ? true : undefined
            }
            aria-describedby={
              fieldErrors.availabilityNote?.length
                ? "worker-availability-error"
                : undefined
            }
          />
          {fieldErrors.availabilityNote?.[0] ? (
            <p id="worker-availability-error" className="text-sm text-destructive">
              {fieldErrors.availabilityNote[0]}
            </p>
          ) : null}
        </div>
      </div>

      <fieldset className="grid" disabled={isPending}>
        <legend className="text-sm font-semibold text-foreground">
          Kategori yang diminati
        </legend>
        <div className="mt-1 flex items-end justify-between gap-4">
          <p
            id="category-interest-help"
            className="text-sm leading-6 text-muted-foreground"
          >
            Pilih kategori yang ingin kamu kerjakan. Kelayakan Kesempatan
            Pertama tetap dihitung dari Bukti Kerja.
          </p>
          {categories.length > 0 ? (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {categoryInterestIds.length}/{MAX_WORKER_CATEGORY_INTERESTS}
            </span>
          ) : null}
        </div>

        {categories.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {categories.map((category) => {
              const checked = categoryInterestIds.includes(category.id);
              const reachedLimit =
                categoryInterestIds.length >= MAX_WORKER_CATEGORY_INTERESTS;
              const verified =
                initialProfile?.verifiedCategoryIds.includes(category.id) ??
                false;

              return (
                <Label
                  key={category.id}
                  htmlFor={`category-${category.id}`}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 font-normal transition-[background-color,border-color,color] duration-200",
                    checked
                      ? "border-primary/45 bg-primary/8 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/25 hover:bg-muted/55 hover:text-foreground",
                    reachedLimit && !checked && "cursor-not-allowed opacity-45",
                  )}
                >
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={checked}
                    disabled={reachedLimit && !checked}
                    aria-describedby={
                      fieldErrors.categoryInterestIds?.length
                        ? "category-interest-help category-interest-error"
                        : "category-interest-help"
                    }
                    aria-invalid={
                      fieldErrors.categoryInterestIds?.length ? true : undefined
                    }
                    onCheckedChange={(value) =>
                      toggleCategory(category.id, value === true)
                    }
                  />
                  <span className="grid gap-0.5">
                    <span className="text-base leading-6">{category.name}</span>
                    {initialProfile ? (
                      <span className="text-xs text-muted-foreground">
                        {verified
                          ? "Ada Bukti Kerja terverifikasi"
                          : "Belum ada Bukti Kerja terverifikasi"}
                      </span>
                    ) : null}
                  </span>
                </Label>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 border-y border-border py-4 text-base leading-7 text-muted-foreground">
            Belum ada kategori aktif. Kamu tetap dapat menyelesaikan profil dan memilih minat nanti.
          </p>
        )}
        {fieldErrors.categoryInterestIds?.[0] ? (
          <p
            id="category-interest-error"
            className="mt-2 text-sm text-destructive"
          >
            {fieldErrors.categoryInterestIds[0]}
          </p>
        ) : null}
      </fieldset>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full"
        disabled={isPending || noAreaAvailable}
      >
        {isPending
          ? "Menyimpan profil…"
          : initialProfile
            ? "Simpan perubahan"
            : "Simpan dan lihat beranda"}
        {!isPending && !initialProfile ? <ArrowRight aria-hidden="true" /> : null}
      </Button>
    </form>
  );
}

export { WorkerProfileForm as WorkerOnboardingForm };
