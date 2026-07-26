import { z } from "zod";
import { riskLevelEnum, wageUnitEnum } from "@/server/db/schema/enums";
import { getJobSelectionCutoff } from "./selection-cutoff";

export const jobDraftSchema = z.object({
  title: z
    .string()
    .min(5, "Judul pekerjaan minimal 5 karakter.")
    .max(160, "Judul pekerjaan maksimal 160 karakter."),
  categoryId: z.string().uuid("Pilih kategori pekerjaan yang tersedia."),
  areaId: z.string().uuid("Pilih area pekerjaan yang tersedia."),
  description: z
    .string()
    .min(20, "Deskripsi pekerjaan minimal 20 karakter.")
    .max(2000, "Deskripsi pekerjaan maksimal 2.000 karakter."),
  taskScope: z
    .string()
    .min(10, "Ruang lingkup tugas minimal 10 karakter.")
    .max(1000, "Ruang lingkup tugas maksimal 1.000 karakter."),
  publicLocationLabel: z
    .string()
    .min(3, "Label lokasi publik minimal 3 karakter.")
    .max(60, "Label lokasi publik maksimal 60 karakter."),
  fullAddress: z
    .string()
    .min(10, "Alamat lengkap minimal 10 karakter.")
    .max(300, "Alamat lengkap maksimal 300 karakter."),
  
  startsAt: z.coerce.date("Waktu mulai kerja wajib diisi.").refine((date) => date > new Date(), {
    message: "Waktu mulai kerja harus berada di masa mendatang.",
  }),
  estimatedMinutes: z
    .number()
    .int("Estimasi durasi harus berupa menit utuh.")
    .min(15, "Estimasi durasi minimal 15 menit.")
    .max(10080, "Estimasi durasi maksimal 7 hari."),
  
  applicationDeadline: z.coerce
    .date("Batas waktu lamaran wajib diisi.")
    .refine((date) => date > new Date(), {
      message: "Batas waktu lamaran harus berada di masa mendatang.",
    }),
  
  toolsProvided: z
    .string()
    .max(200, "Daftar peralatan yang disediakan maksimal 200 karakter.")
    .optional(),
  toolsRequired: z
    .string()
    .max(200, "Daftar peralatan yang perlu dibawa maksimal 200 karakter.")
    .optional(),
  
  wageAmount: z
    .number()
    .int("Nominal upah harus berupa rupiah utuh.")
    .min(10000, "Nominal upah minimal Rp10.000.")
    .max(100000000, "Nominal upah maksimal Rp100.000.000."),
  wageUnit: z.enum(wageUnitEnum.enumValues),
  paymentMethod: z
    .string()
    .min(2, "Metode pembayaran minimal 2 karakter.")
    .max(100, "Metode pembayaran maksimal 100 karakter."),
  paymentTiming: z
    .string()
    .min(2, "Waktu pembayaran minimal 2 karakter.")
    .max(100, "Waktu pembayaran maksimal 100 karakter."),
  
  isFirstOpportunity: z.boolean().default(false),
  riskLevel: z.enum(riskLevelEnum.enumValues),
}).refine((data) => data.applicationDeadline < getJobSelectionCutoff(data.startsAt), {
  message: "Batas lamaran harus lebih awal dari batas pemilihan pekerja.",
  path: ["applicationDeadline"],
});

export type JobDraftInput = z.infer<typeof jobDraftSchema>;
