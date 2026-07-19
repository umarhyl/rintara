"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, CircleAlert, MapPin } from "lucide-react";
import { submitEmployerOnboarding } from "@/app/auth/onboarding-actions";
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

type EmployerType = "individual" | "business" | "community";

export function EmployerOnboardingForm({ areas, nextPath }: { areas: AreaOption[]; nextPath?: string }) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [areaId, setAreaId] = useState("");
  const [employerType, setEmployerType] = useState<EmployerType | "">("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employerTypeError, setEmployerTypeError] = useState<string | null>(null);
  const [areaError, setAreaError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEmployerTypeError(null);
    setAreaError(null);

    if (!employerType) {
      const message = "Pilih jenis pemberi kerja untuk melanjutkan.";
      setError(message);
      setEmployerTypeError(message);
      window.requestAnimationFrame(() => document.getElementById("employer-type")?.focus());
      return;
    }

    if (!areaId) {
      const message = "Pilih area kegiatan untuk melanjutkan.";
      setError(message);
      setAreaError(message);
      window.requestAnimationFrame(() => document.getElementById("employer-area")?.focus());
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
      const result = await submitEmployerOnboarding({
        displayName: String(formData.get("displayName") ?? ""),
        employerType,
        areaId,
        description: String(formData.get("description") ?? ""),
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.replace(nextPath ?? "/employer/dashboard");
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

      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="employer-display-name">Nama usaha atau pemberi kerja</Label>
          <Input
            id="employer-display-name"
            name="displayName"
            autoComplete="organization"
            minLength={2}
            maxLength={120}
            placeholder="Nama yang mudah dikenali pekerja"
            className="h-12"
            disabled={isPending}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="employer-type">Jenis pemberi kerja</Label>
          <Select
            value={employerType}
            onValueChange={(value) => {
              setEmployerType(value as EmployerType);
              setEmployerTypeError(null);
            }}
            disabled={isPending}
          >
            <SelectTrigger
              id="employer-type"
              className="h-12 w-full"
              aria-label="Jenis pemberi kerja"
              aria-invalid={employerTypeError ? true : undefined}
              aria-describedby={employerTypeError ? "employer-type-error" : undefined}
            >
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Perorangan</SelectItem>
              <SelectItem value="business">Usaha</SelectItem>
              <SelectItem value="community">Komunitas</SelectItem>
            </SelectContent>
          </Select>
          {employerTypeError ? <p id="employer-type-error" className="text-sm leading-6 text-destructive">{employerTypeError}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="employer-area">Area kegiatan</Label>
          <Select
            value={areaId}
            onValueChange={(value) => {
              setAreaId(value);
              setAreaError(null);
            }}
            disabled={isPending || noAreaAvailable}
          >
            <SelectTrigger
              id="employer-area"
              className="h-12 w-full"
              aria-label="Area kegiatan"
              aria-invalid={areaError ? true : undefined}
              aria-describedby={areaError ? "employer-area-error" : undefined}
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
          {areaError ? <p id="employer-area-error" className="text-sm leading-6 text-destructive">{areaError}</p> : null}
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
            placeholder="Jelaskan kegiatan utama dan jenis bantuan yang biasanya dibutuhkan."
            className="min-h-28 resize-y"
            disabled={isPending}
          />
        </div>
      </div>

      <p className="border-y border-border py-4 text-base leading-7 text-muted-foreground">
        Gunakan identitas yang dapat dikenali pekerja. Informasi rekening dan pembayaran tidak diperlukan di profil.
      </p>

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
