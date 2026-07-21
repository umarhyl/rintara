"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CircleAlert, MapPin, CheckCircle2 } from "lucide-react";
import { updateEmployerProfile } from "@/server/domain/profiles/actions";
import { EmployerProfileData } from "@/server/queries/profiles/get-employer-profile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

type AreaOption = {
  id: string;
  name: string;
};

export function EmployerProfileForm({
  areas,
  profile,
}: {
  areas: AreaOption[];
  profile: EmployerProfileData;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  
  const [areaId, setAreaId] = useState(profile.areaId);
  const [employerType, setEmployerType] = useState(profile.employerType);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    if (!employerType) {
      setFieldErrors(prev => ({ ...prev, employerType: ["Pilih jenis pemberi kerja untuk melanjutkan."] }));
      window.requestAnimationFrame(() => document.getElementById("employer-type")?.focus());
      return;
    }

    if (!areaId) {
      setFieldErrors(prev => ({ ...prev, areaId: ["Pilih area kegiatan untuk melanjutkan."] }));
      window.requestAnimationFrame(() => document.getElementById("employer-area")?.focus());
      return;
    }

    if (submittingRef.current) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    submittingRef.current = true;
    setIsPending(true);

    try {
      const result = await updateEmployerProfile({
        displayName: String(formData.get("displayName") ?? ""),
        employerType,
        areaId,
        description: String(formData.get("description") ?? ""),
      });

      if (!result.ok) {
        setError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Koneksi terputus saat menyimpan profil. Periksa jaringan lalu coba lagi.");
    } finally {
      submittingRef.current = false;
      setIsPending(false);
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

      {success ? (
        <Alert className="border-green-600/20 bg-green-50 text-green-900 dark:bg-green-900/10 dark:text-green-300">
          <CheckCircle2 className="text-green-600 dark:text-green-400" aria-hidden="true" />
          <AlertTitle>Profil diperbarui</AlertTitle>
          <AlertDescription>Profil bisnis Anda berhasil disimpan.</AlertDescription>
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

      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="employer-display-name">Nama usaha atau pemberi kerja</Label>
          <Input
            id="employer-display-name"
            name="displayName"
            autoComplete="organization"
            minLength={2}
            maxLength={120}
            defaultValue={profile.displayName}
            placeholder="Nama yang mudah dikenali pekerja"
            className="h-12"
            disabled={isPending}
            required
            aria-invalid={fieldErrors.displayName ? true : undefined}
            aria-describedby={fieldErrors.displayName ? "employer-display-name-error" : undefined}
          />
          {fieldErrors.displayName ? <p id="employer-display-name-error" className="text-sm text-destructive">{fieldErrors.displayName[0]}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="employer-type">Jenis pemberi kerja</Label>
          <Select
            value={employerType}
            onValueChange={(value) => {
              setEmployerType(value as typeof profile.employerType);
              setFieldErrors(prev => ({ ...prev, employerType: [] }));
            }}
            disabled={isPending}
          >
            <SelectTrigger
              id="employer-type"
              className="h-12 w-full"
              aria-label="Jenis pemberi kerja"
              aria-invalid={fieldErrors.employerType?.length ? true : undefined}
              aria-describedby={fieldErrors.employerType?.length ? "employer-type-error" : undefined}
            >
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Perorangan</SelectItem>
              <SelectItem value="business">Usaha</SelectItem>
              <SelectItem value="community">Komunitas</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.employerType?.length ? <p id="employer-type-error" className="text-sm leading-6 text-destructive">{fieldErrors.employerType[0]}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="employer-area">Area kegiatan</Label>
          <Select
            value={areaId}
            onValueChange={(value) => {
              setAreaId(value);
              setFieldErrors(prev => ({ ...prev, areaId: [] }));
            }}
            disabled={isPending || noAreaAvailable}
          >
            <SelectTrigger
              id="employer-area"
              className="h-12 w-full"
              aria-label="Area kegiatan"
              aria-invalid={fieldErrors.areaId?.length ? true : undefined}
              aria-describedby={fieldErrors.areaId?.length ? "employer-area-error" : undefined}
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
          {fieldErrors.areaId?.length ? <p id="employer-area-error" className="text-sm leading-6 text-destructive">{fieldErrors.areaId[0]}</p> : null}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="employer-description">Deskripsi singkat</Label>
            <span className="text-xs text-muted-foreground">Opsional</span>
          </div>
          <Textarea
            id="employer-description"
            name="description"
            maxLength={1000}
            defaultValue={profile.description || ""}
            placeholder="Jelaskan kegiatan utama dan jenis bantuan yang biasanya dibutuhkan."
            className="min-h-28 resize-y"
            disabled={isPending}
            aria-invalid={fieldErrors.description ? true : undefined}
            aria-describedby={fieldErrors.description ? "employer-description-error" : undefined}
          />
          {fieldErrors.description ? <p id="employer-description-error" className="text-sm text-destructive">{fieldErrors.description[0]}</p> : null}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="submit"
          className="rounded-full"
          disabled={isPending || noAreaAvailable}
        >
          {isPending ? "Menyimpan…" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
