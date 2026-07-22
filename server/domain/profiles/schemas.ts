import { z } from "zod";
import { MAX_WORKER_CATEGORY_INTERESTS } from "@/lib/onboarding";

const optionalProfileText = (maximum: number, message: string) =>
  z
    .string()
    .trim()
    .max(maximum, message)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null);

const categoryInterestIdsSchema = z
  .array(z.string().uuid())
  .max(
    MAX_WORKER_CATEGORY_INTERESTS,
    `Pilih maksimal ${MAX_WORKER_CATEGORY_INTERESTS} kategori minat.`,
  )
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Kategori minat tidak boleh berulang.",
  });

export const workerProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Nama tampilan terlalu pendek.")
      .max(120, "Nama tampilan terlalu panjang."),
    areaId: z.string().uuid("Pilih area domisili yang valid."),
    bio: optionalProfileText(1000, "Bio terlalu panjang."),
    availabilityNote: optionalProfileText(
      500,
      "Catatan ketersediaan terlalu panjang.",
    ),
    categoryInterestIds: categoryInterestIdsSchema,
  })
  .strict();

export const workerOnboardingProfileSchema = workerProfileSchema
  .extend({ categoryInterestIds: categoryInterestIdsSchema.optional() })
  .strip();

export type WorkerProfileInput = z.infer<typeof workerProfileSchema>;
