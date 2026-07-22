import { z } from "zod";
import { workerOnboardingProfileSchema } from "@/server/domain/profiles/schemas";

const emailSchema = z.string().trim().email().max(320).toLowerCase();
const passwordSchema = z.string().min(8).max(128);

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const signInSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  })
  .strict();

const profileText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null);

const baseProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  areaId: z.string().uuid(),
});

export const workerOnboardingSchema = workerOnboardingProfileSchema
  .extend({ role: z.literal("worker") })
  .strip();

export const employerOnboardingSchema = baseProfileSchema
  .extend({
    role: z.literal("employer"),
    employerType: z.enum(["individual", "business", "community"]),
    description: profileText(1000),
  })
  .strip();

export const onboardingSchema = z.discriminatedUnion("role", [
  workerOnboardingSchema,
  employerOnboardingSchema,
]);

export type OnboardingInput = z.infer<typeof onboardingSchema>;
