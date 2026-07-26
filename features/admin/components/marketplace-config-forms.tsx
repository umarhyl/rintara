"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategoryAction,
  createPilotAreaAction,
  createWageGuidelineAction,
  setCategoryActiveAction,
  setPilotAreaActiveAction,
  setWageGuidelineActiveAction,
} from "@/server/domain/admin/marketplace-config-actions";
import type { AdminMarketplaceConfig } from "@/server/queries/admin/marketplace-config";

type ActionState =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> }
  | null;

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan..." : children}
    </Button>
  );
}

function StatusButton({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={isActive ? "destructive" : "outline"}
      size="sm"
      className="min-h-11"
      disabled={pending}
    >
      {pending ? "Menyimpan..." : children}
    </Button>
  );
}

function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        state.ok
          ? "border-success/25 bg-success/10 text-success"
          : "border-destructive/25 bg-destructive/10 text-destructive"
      }`}
      role="status"
    >
      {state.ok ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <p>
        {state.ok
          ? "Konfigurasi tersimpan."
          : state.message}
      </p>
    </div>
  );
}

function FieldError({
  state,
  name,
}: {
  state: ActionState;
  name: string;
}) {
  if (!state || state.ok) return null;
  const error = state.fieldErrors?.[name]?.[0];
  if (!error) return null;

  return <p className="text-sm text-destructive">{error}</p>;
}

const inputClassName = "h-11";
const nativeSelectClassName =
  "h-11 rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function CategoryConfigForm() {
  const [state, action] = useActionState(createCategoryAction, null);

  return (
    <form action={action} className="grid gap-5">
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="category-name">Nama kategori</Label>
          <Input id="category-name" name="name" className={inputClassName} required />
          <FieldError state={state} name="name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category-slug">Kode kategori</Label>
          <Input
            id="category-slug"
            name="slug"
            className={inputClassName}
            placeholder="event-helper"
            required
          />
          <FieldError state={state} name="slug" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category-risk">Risiko</Label>
          <select
            id="category-risk"
            name="riskLevel"
            className={nativeSelectClassName}
            defaultValue="low"
          >
            <option value="low">Rendah</option>
            <option value="restricted">Terbatas</option>
          </select>
          <FieldError state={state} name="riskLevel" />
        </div>
        <div className="grid gap-3 self-end rounded-xl border border-border/75 bg-muted/35 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox name="firstOpportunityAllowed" />
            Mendukung Kesempatan Pertama
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox name="isActive" defaultChecked />
            Aktif untuk marketplace
          </label>
          <FieldError state={state} name="firstOpportunityAllowed" />
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton>Simpan kategori</SubmitButton>
      </div>
    </form>
  );
}

export function PilotAreaConfigForm() {
  const [state, action] = useActionState(createPilotAreaAction, null);

  return (
    <form action={action} className="grid gap-5">
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="area-name">Nama pilot area</Label>
          <Input id="area-name" name="name" className={inputClassName} required />
          <FieldError state={state} name="name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="area-code">Kode area</Label>
          <Input
            id="area-code"
            name="code"
            className={inputClassName}
            placeholder="BDG-CITY"
            required
          />
          <FieldError state={state} name="code" />
        </div>
        <div className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-border/75 bg-muted/35 px-4">
          <Checkbox id="area-active" name="isActive" defaultChecked />
          <Label htmlFor="area-active" className="cursor-pointer font-normal">
            Aktif untuk pilot marketplace
          </Label>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton>Simpan pilot area</SubmitButton>
      </div>
    </form>
  );
}

export function WageGuidelineConfigForm({
  areas,
  categories,
}: {
  areas: AdminMarketplaceConfig["areas"];
  categories: AdminMarketplaceConfig["categories"];
}) {
  const [state, action] = useActionState(createWageGuidelineAction, null);
  const activeAreas = areas.filter((area) => area.isActive);
  const activeCategories = categories.filter((category) => category.isActive);

  return (
    <form action={action} className="grid gap-5">
      <FormMessage state={state} />

      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="guideline-area">Pilot area</Label>
          <select
            id="guideline-area"
            name="areaId"
            className={nativeSelectClassName}
            required
          >
            <option value="">Pilih area</option>
            {activeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <FieldError state={state} name="areaId" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="guideline-category">Kategori</Label>
          <select
            id="guideline-category"
            name="categoryId"
            className={nativeSelectClassName}
            required
          >
            <option value="">Pilih kategori</option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldError state={state} name="categoryId" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="guideline-unit">Satuan upah</Label>
          <select
            id="guideline-unit"
            name="unit"
            className={nativeSelectClassName}
            defaultValue="job"
          >
            <option value="hour">Per jam</option>
            <option value="day">Per hari</option>
            <option value="job">Per pekerjaan</option>
          </select>
          <FieldError state={state} name="unit" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="minimum-amount">Upah minimum</Label>
          <Input
            id="minimum-amount"
            name="minimumAmount"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            className={inputClassName}
            required
          />
          <FieldError state={state} name="minimumAmount" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="recommended-amount">Rekomendasi maksimum</Label>
          <Input
            id="recommended-amount"
            name="recommendedAmount"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            className={inputClassName}
            required
          />
          <FieldError state={state} name="recommendedAmount" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="source-label">Sumber referensi</Label>
          <Input
            id="source-label"
            name="sourceLabel"
            className={inputClassName}
            required
          />
          <FieldError state={state} name="sourceLabel" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="source-url">URL sumber</Label>
          <Input id="source-url" name="sourceUrl" className={inputClassName} />
          <FieldError state={state} name="sourceUrl" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="effective-from">Mulai efektif</Label>
          <Input
            id="effective-from"
            name="effectiveFrom"
            type="date"
            className={inputClassName}
            required
          />
          <FieldError state={state} name="effectiveFrom" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="effective-to">Berakhir</Label>
          <Input
            id="effective-to"
            name="effectiveTo"
            type="date"
            className={inputClassName}
          />
          <FieldError state={state} name="effectiveTo" />
        </div>
        <div className="grid gap-3 self-end rounded-xl border border-border/75 bg-muted/35 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox name="isSimulated" />
            Data simulasi
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox name="isActive" defaultChecked />
            Aktif digunakan
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton>Simpan panduan upah</SubmitButton>
      </div>
    </form>
  );
}

export function CategoryStatusForm({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [, action] = useActionState(setCategoryActiveAction, null);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
      <StatusButton isActive={isActive}>
        {isActive ? "Nonaktifkan" : "Aktifkan"}
      </StatusButton>
    </form>
  );
}

export function PilotAreaStatusForm({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [, action] = useActionState(setPilotAreaActiveAction, null);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
      <StatusButton isActive={isActive}>
        {isActive ? "Nonaktifkan" : "Aktifkan"}
      </StatusButton>
    </form>
  );
}

export function WageGuidelineStatusForm({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [, action] = useActionState(setWageGuidelineActiveAction, null);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
      <StatusButton isActive={isActive}>
        {isActive ? "Nonaktifkan" : "Aktifkan"}
      </StatusButton>
    </form>
  );
}
