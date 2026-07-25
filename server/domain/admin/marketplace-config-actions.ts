"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireActiveUser } from "@/server/auth/identity";
import { assertAdmin } from "@/server/auth/policies";
import { db } from "@/server/db/client";
import { areas, auditLogs, categories, wageGuidelines } from "@/server/db/schema";
import { ApplicationError } from "@/server/errors/application-error";

type AdminConfigResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const slugSchema = z
  .string()
  .trim()
  .min(2, "Kode terlalu pendek.")
  .max(80, "Kode terlalu panjang.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Gunakan huruf kecil, angka, dan tanda hubung.");

const categorySchema = z.object({
  name: z.string().trim().min(2, "Nama kategori terlalu pendek.").max(120),
  slug: slugSchema,
  riskLevel: z.enum(["low", "restricted"]),
  firstOpportunityAllowed: z.boolean(),
  isActive: z.boolean(),
});

const pilotAreaSchema = z.object({
  name: z.string().trim().min(2, "Nama area terlalu pendek.").max(160),
  code: z
    .string()
    .trim()
    .min(2, "Kode area terlalu pendek.")
    .max(64, "Kode area terlalu panjang.")
    .regex(/^[A-Z0-9._-]+$/i, "Gunakan kode area tanpa spasi."),
  isActive: z.boolean(),
});

const wageGuidelineSchema = z
  .object({
    areaId: z.string().uuid("Pilih pilot area."),
    categoryId: z.string().uuid("Pilih kategori."),
    unit: z.enum(["hour", "day", "job"]),
    minimumAmount: z.coerce
      .number()
      .int("Nilai harus bilangan bulat.")
      .positive("Nilai minimum harus lebih dari nol."),
    recommendedAmount: z.coerce
      .number()
      .int("Nilai harus bilangan bulat.")
      .positive("Rekomendasi maksimum harus lebih dari nol."),
    sourceLabel: z.string().trim().min(2, "Sumber wajib diisi.").max(255),
    sourceUrl: z
      .string()
      .trim()
      .url("URL sumber tidak valid.")
      .max(2048)
      .optional()
      .or(z.literal("")),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal mulai wajib diisi."),
    effectiveTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal akhir tidak valid.")
      .optional()
      .or(z.literal("")),
    isSimulated: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((input) => input.recommendedAmount >= input.minimumAmount, {
    path: ["recommendedAmount"],
    message: "Rekomendasi maksimum harus sama atau lebih tinggi dari minimum.",
  })
  .refine(
    (input) =>
      !input.effectiveTo || input.effectiveTo > input.effectiveFrom,
    {
      path: ["effectiveTo"],
      message: "Tanggal akhir harus setelah tanggal mulai.",
    },
  );

const statusSchema = z.object({
  id: z.string().uuid("Konfigurasi tidak valid."),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function parseResultFailure(error: z.ZodError): AdminConfigResult {
  return {
    ok: false,
    message: "Periksa kembali isian konfigurasi.",
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
  };
}

function safeFailure(error: unknown): AdminConfigResult {
  if (error instanceof ApplicationError) {
    return { ok: false, message: error.message };
  }

  return {
    ok: false,
    message: "Konfigurasi belum dapat disimpan. Silakan coba lagi.",
  };
}

async function requireAdminContext() {
  return assertAdmin(await requireActiveUser());
}

function revalidateMarketplaceConfig() {
  revalidatePath("/admin/wage-guidelines");
  revalidatePath("/employer/jobs/new");
  revalidatePath("/jobs");
}

function parseStatus(formData: FormData): AdminConfigResult | z.infer<typeof statusSchema> {
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) return parseResultFailure(parsed.error);
  return parsed.data;
}

export async function createCategoryAction(
  _previousState: AdminConfigResult | null,
  formData: FormData,
): Promise<AdminConfigResult> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    riskLevel: formData.get("riskLevel"),
    firstOpportunityAllowed: checked(formData, "firstOpportunityAllowed"),
    isActive: checked(formData, "isActive"),
  });

  if (!parsed.success) return parseResultFailure(parsed.error);

  if (
    parsed.data.firstOpportunityAllowed &&
    parsed.data.riskLevel !== "low"
  ) {
    return {
      ok: false,
      message: "Kesempatan Pertama hanya dapat diaktifkan untuk kategori risiko rendah.",
      fieldErrors: {
        firstOpportunityAllowed: [
          "Nonaktifkan untuk kategori dengan risiko terbatas.",
        ],
      },
    };
  }

  try {
    const context = await requireAdminContext();
    const [category] = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(categories)
        .values(parsed.data)
        .returning({ id: categories.id });

      await tx.insert(auditLogs).values({
        actorId: context.userId,
        action: "admin.category.create",
        entityType: "category",
        entityId: inserted.id,
        requestId: context.requestId,
        metadata: {
          slug: parsed.data.slug,
          firstOpportunityAllowed: parsed.data.firstOpportunityAllowed,
        },
      });

      return [inserted];
    });

    revalidateMarketplaceConfig();

    return { ok: true, id: category.id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function createPilotAreaAction(
  _previousState: AdminConfigResult | null,
  formData: FormData,
): Promise<AdminConfigResult> {
  const parsed = pilotAreaSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    isActive: checked(formData, "isActive"),
  });

  if (!parsed.success) return parseResultFailure(parsed.error);

  try {
    const context = await requireAdminContext();
    const [area] = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(areas)
        .values({
          ...parsed.data,
          level: "city_regency",
        })
        .returning({ id: areas.id });

      await tx.insert(auditLogs).values({
        actorId: context.userId,
        action: "admin.pilot_area.create",
        entityType: "area",
        entityId: inserted.id,
        requestId: context.requestId,
        metadata: { code: parsed.data.code },
      });

      return [inserted];
    });

    revalidateMarketplaceConfig();

    return { ok: true, id: area.id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function createWageGuidelineAction(
  _previousState: AdminConfigResult | null,
  formData: FormData,
): Promise<AdminConfigResult> {
  const parsed = wageGuidelineSchema.safeParse({
    areaId: formData.get("areaId"),
    categoryId: formData.get("categoryId"),
    unit: formData.get("unit"),
    minimumAmount: formData.get("minimumAmount"),
    recommendedAmount: formData.get("recommendedAmount"),
    sourceLabel: formData.get("sourceLabel"),
    sourceUrl: formData.get("sourceUrl") ?? "",
    effectiveFrom: formData.get("effectiveFrom"),
    effectiveTo: formData.get("effectiveTo") ?? "",
    isSimulated: checked(formData, "isSimulated"),
    isActive: checked(formData, "isActive"),
  });

  if (!parsed.success) return parseResultFailure(parsed.error);

  try {
    const context = await requireAdminContext();
    const [guideline] = await db.transaction(async (tx) => {
      const [activeArea] = await tx
        .select({ id: areas.id })
        .from(areas)
        .where(
          and(
            eq(areas.id, parsed.data.areaId),
            eq(areas.level, "city_regency"),
            eq(areas.isActive, true),
          ),
        )
        .limit(1);

      if (!activeArea) {
        throw new ApplicationError(
          "VALIDATION_FAILED",
          "Pilih pilot area aktif untuk Panduan Upah.",
          { areaId: ["Pilih pilot area aktif."] },
        );
      }

      const [activeCategory] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.id, parsed.data.categoryId),
            eq(categories.isActive, true),
          ),
        )
        .limit(1);

      if (!activeCategory) {
        throw new ApplicationError(
          "VALIDATION_FAILED",
          "Pilih kategori aktif untuk Panduan Upah.",
          { categoryId: ["Pilih kategori aktif."] },
        );
      }

      const [inserted] = await tx
        .insert(wageGuidelines)
        .values({
          areaId: parsed.data.areaId,
          categoryId: parsed.data.categoryId,
          unit: parsed.data.unit,
          minimumAmount: BigInt(parsed.data.minimumAmount),
          recommendedAmount: BigInt(parsed.data.recommendedAmount),
          sourceLabel: parsed.data.sourceLabel,
          sourceUrl: parsed.data.sourceUrl || null,
          effectiveFrom: parsed.data.effectiveFrom,
          effectiveTo: parsed.data.effectiveTo || null,
          isSimulated: parsed.data.isSimulated,
          isActive: parsed.data.isActive,
          createdBy: context.userId,
        })
        .returning({ id: wageGuidelines.id });

      await tx.insert(auditLogs).values({
        actorId: context.userId,
        action: "admin.wage_guideline.create",
        entityType: "wage_guideline",
        entityId: inserted.id,
        requestId: context.requestId,
        metadata: {
          areaId: parsed.data.areaId,
          categoryId: parsed.data.categoryId,
          unit: parsed.data.unit,
          minimumAmount: parsed.data.minimumAmount,
          recommendedAmount: parsed.data.recommendedAmount,
          isSimulated: parsed.data.isSimulated,
        },
      });

      return [inserted];
    });

    revalidateMarketplaceConfig();

    return { ok: true, id: guideline.id };
  } catch (error) {
    if (
      error instanceof ApplicationError &&
      error.code === "VALIDATION_FAILED" &&
      error.details &&
      typeof error.details === "object"
    ) {
      return {
        ok: false,
        message: error.message,
        fieldErrors: error.details as Record<string, string[]>,
      };
    }

    return safeFailure(error);
  }
}

export async function setCategoryActiveAction(
  _previousState: AdminConfigResult | null,
  formData: FormData,
): Promise<AdminConfigResult> {
  const parsed = parseStatus(formData);
  if ("ok" in parsed) return parsed;

  try {
    const context = await requireAdminContext();
    const [category] = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(categories)
        .set({ isActive: parsed.isActive })
        .where(eq(categories.id, parsed.id))
        .returning({ id: categories.id, slug: categories.slug });

      if (!updated) {
        throw new ApplicationError("NOT_FOUND", "Kategori tidak ditemukan.");
      }

      await tx.insert(auditLogs).values({
        actorId: context.userId,
        action: parsed.isActive
          ? "admin.category.activate"
          : "admin.category.deactivate",
        entityType: "category",
        entityId: updated.id,
        requestId: context.requestId,
        metadata: { slug: updated.slug, isActive: parsed.isActive },
      });

      return [updated];
    });

    revalidateMarketplaceConfig();
    return { ok: true, id: category.id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function setPilotAreaActiveAction(
  _previousState: AdminConfigResult | null,
  formData: FormData,
): Promise<AdminConfigResult> {
  const parsed = parseStatus(formData);
  if ("ok" in parsed) return parsed;

  try {
    const context = await requireAdminContext();
    const [area] = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(areas)
        .set({ isActive: parsed.isActive })
        .where(and(eq(areas.id, parsed.id), eq(areas.level, "city_regency")))
        .returning({ id: areas.id, code: areas.code });

      if (!updated) {
        throw new ApplicationError("NOT_FOUND", "Pilot area tidak ditemukan.");
      }

      await tx.insert(auditLogs).values({
        actorId: context.userId,
        action: parsed.isActive
          ? "admin.pilot_area.activate"
          : "admin.pilot_area.deactivate",
        entityType: "area",
        entityId: updated.id,
        requestId: context.requestId,
        metadata: { code: updated.code, isActive: parsed.isActive },
      });

      return [updated];
    });

    revalidateMarketplaceConfig();
    return { ok: true, id: area.id };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function setWageGuidelineActiveAction(
  _previousState: AdminConfigResult | null,
  formData: FormData,
): Promise<AdminConfigResult> {
  const parsed = parseStatus(formData);
  if ("ok" in parsed) return parsed;

  try {
    const context = await requireAdminContext();
    const [guideline] = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(wageGuidelines)
        .set({ isActive: parsed.isActive })
        .where(eq(wageGuidelines.id, parsed.id))
        .returning({
          id: wageGuidelines.id,
          areaId: wageGuidelines.areaId,
          categoryId: wageGuidelines.categoryId,
          unit: wageGuidelines.unit,
        });

      if (!updated) {
        throw new ApplicationError(
          "NOT_FOUND",
          "Panduan Upah tidak ditemukan.",
        );
      }

      await tx.insert(auditLogs).values({
        actorId: context.userId,
        action: parsed.isActive
          ? "admin.wage_guideline.activate"
          : "admin.wage_guideline.deactivate",
        entityType: "wage_guideline",
        entityId: updated.id,
        requestId: context.requestId,
        metadata: {
          areaId: updated.areaId,
          categoryId: updated.categoryId,
          unit: updated.unit,
          isActive: parsed.isActive,
        },
      });

      return [updated];
    });

    revalidateMarketplaceConfig();
    return { ok: true, id: guideline.id };
  } catch (error) {
    return safeFailure(error);
  }
}
