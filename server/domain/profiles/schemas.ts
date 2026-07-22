import { z } from "zod";
import { MAX_WORKER_CATEGORY_INTERESTS } from "@/lib/onboarding";

const optionalProfileText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null);

const categoryInterestIdsSchema = z
  .array(z.string().uuid())
  .max(MAX_WORKER_CATEGORY_INTERESTS)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Kategori minat tidak boleh berulang.",
  });

export const workerProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(120),
    areaId: z.string().uuid(),
    bio: optionalProfileText(1000),
    availabilityNote: optionalProfileText(500),
    categoryInterestIds: categoryInterestIdsSchema,
  })
  .strict();

export const workerOnboardingProfileSchema = workerProfileSchema
  .extend({ categoryInterestIds: categoryInterestIdsSchema.optional() })
  .strip();

export type WorkerProfileInput = z.infer<typeof workerProfileSchema>;
