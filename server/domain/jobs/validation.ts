import { z } from "zod";
import { riskLevelEnum, wageUnitEnum } from "@/server/db/schema/enums";

export const jobDraftSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(160),
  categoryId: z.string().uuid("Invalid category ID"),
  areaId: z.string().uuid("Invalid area ID"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  taskScope: z.string().min(10, "Task scope must be at least 10 characters").max(1000),
  publicLocationLabel: z.string().min(3, "Location label required").max(60),
  fullAddress: z.string().min(10, "Full address required for accepted worker").max(300),
  
  startsAt: z.coerce.date("Start time is required").refine((date) => date > new Date(), {
    message: "Start time must be in the future",
  }),
  estimatedMinutes: z.number().int().min(15).max(10080),
  
  applicationDeadline: z.coerce
    .date("Application deadline is required")
    .refine((date) => date > new Date(), {
      message: "Application deadline must be in the future",
    }),
  
  toolsProvided: z.string().max(200).optional(),
  toolsRequired: z.string().max(200).optional(),
  
  wageAmount: z.number().int().min(10000, "Minimum wage amount is Rp 10,000").max(100000000),
  wageUnit: z.enum(wageUnitEnum.enumValues),
  paymentMethod: z.string().min(2).max(100),
  paymentTiming: z.string().min(2).max(100),
  
  isFirstOpportunity: z.boolean().default(false),
  riskLevel: z.enum(riskLevelEnum.enumValues),
}).refine((data) => data.applicationDeadline < data.startsAt, {
  message: "Application deadline must be before the start time",
  path: ["applicationDeadline"],
});

export type JobDraftInput = z.infer<typeof jobDraftSchema>;
