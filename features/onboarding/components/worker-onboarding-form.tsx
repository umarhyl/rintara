"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, CircleAlert, MapPin } from "lucide-react";
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

type ReferenceOption = {
  id: string;
  name: string;
};

export function WorkerOnboardingForm({
  areas,
  categories,
  nextPath,
}: {
  areas: ReferenceOption[];
  categories: ReferenceOption[];
  nextPath?: string;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [areaId, setAreaId] = useState("");
  const [categoryInterestIds, setCategoryInterestIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areaError, setAreaError] = useState<string | null>(null);

  function toggleCategory(categoryId: string, checked: boolean) {
    setCategoryInterestIds((current) => {
      if (checked) {
        return current.length < MAX_WORKER_CATEGORY_INTERESTS
          ? [...current, categoryId]
          : current;
      }

      return current.filter((id) => id !== categoryId);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAreaError(null);

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
      const result = await submitWorkerOnboarding({
        displayName: String(formData.get("displayName") ?? ""),
        areaId,
        bio: String(formData.get("bio") ?? ""),
        availabilityNote: String(formData.get("availabilityNote") ?? ""),
        categoryInterestIds,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.replace(nextPath ?? "/worker/dashboard");
      completed = true;
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
    <form className="grid gap-7" aria-busy={isPending} onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Profil belum tersimpan</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {noAreaAvailable ? (
        <Alert>
          <MapPin aria-hidden="true" />
          <AlertTitle>Area belum tersedia</AlertTitle>
          <AlertDescription>
            Pilihan area sedang disiapkan. Muat ulang halaman ini beberapa saat lagi.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="worker-display-name">Nama tampilan</Label>
          <Input
            id="worker-display-name"
            name="displayName"
            autoComplete="name"
            minLength={2}
            maxLength={120}
            placeholder="Nama yang ingin ditampilkan"
            className="h-12"
            disabled={isPending}
            required
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="worker-area">Area domisili</Label>
          <Select
            value={areaId}
            onValueChange={(value) => {
              setAreaId(value);
              setAreaError(null);
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
            className="min-h-24 resize-y"
            disabled={isPending}
          />
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
            className="h-12"
            disabled={isPending}
          />
        </div>
      </div>

      <fieldset className="grid" disabled={isPending}>
        <legend className="text-sm font-semibold text-foreground">
          Kategori yang diminati
        </legend>
        <div className="mt-1 flex items-end justify-between gap-4">
          <p
            id="category-interest-help"
            className="text-base leading-7 text-muted-foreground"
          >
            Pilihan ini hanya menunjukkan minatmu, bukan bukti pengalaman atau penentu kelayakan Kesempatan Pertama.
          </p>
          {categories.length > 0 ? (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {categoryInterestIds.length}/{MAX_WORKER_CATEGORY_INTERESTS}
            </span>
          ) : null}
        </div>

        {categories.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {categories.map((category) => {
              const checked = categoryInterestIds.includes(category.id);
              const reachedLimit =
                categoryInterestIds.length >= MAX_WORKER_CATEGORY_INTERESTS;

              return (
                <Label
                  key={category.id}
                  htmlFor={`category-${category.id}`}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 font-normal transition-[background-color,border-color,color] duration-300",
                    checked
                      ? "border-primary/45 bg-primary/8 text-foreground"
                      : "border-border bg-card/60 text-muted-foreground hover:border-primary/25 hover:bg-muted/55 hover:text-foreground",
                    reachedLimit && !checked && "cursor-not-allowed opacity-45",
                  )}
                >
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={checked}
                    disabled={reachedLimit && !checked}
                    aria-describedby="category-interest-help"
                    onCheckedChange={(value) =>
                      toggleCategory(category.id, value === true)
                    }
                  />
                  <span className="text-base leading-6">{category.name}</span>
                </Label>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 border-y border-border py-4 text-base leading-7 text-muted-foreground">
            Belum ada kategori aktif. Kamu tetap dapat menyelesaikan profil dan memilih minat nanti.
          </p>
        )}
      </fieldset>

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-full"
        disabled={isPending || noAreaAvailable}
      >
        {isPending ? "Menyimpan profil…" : "Simpan dan lihat beranda"}
        {!isPending ? <ArrowRight aria-hidden="true" /> : null}
      </Button>
    </form>
  );
}
