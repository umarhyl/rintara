import {
  ApplicationError,
  type ApplicationErrorCode,
} from "@/server/errors/application-error";

export type JobActionFailure = {
  ok: false;
  code: ApplicationErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const jobFieldNames = new Set([
  "title",
  "categoryId",
  "areaId",
  "description",
  "taskScope",
  "publicLocationLabel",
  "startsAt",
  "estimatedMinutes",
  "applicationDeadline",
  "fullAddress",
  "arrivalInstructions",
  "toolsProvided",
  "toolsRequired",
  "wageAmount",
  "wageUnit",
  "paymentMethod",
  "paymentTiming",
  "isFirstOpportunity",
  "riskLevel",
]);

const jobErrorMessages: Partial<Record<ApplicationErrorCode, string>> = {
  UNAUTHENTICATED: "Sesi kamu telah berakhir. Masuk kembali untuk melanjutkan.",
  ACCOUNT_INACTIVE:
    "Akun ini sedang dibatasi dan belum dapat mengelola pekerjaan.",
  FORBIDDEN: "Akun ini tidak dapat mengelola pekerjaan.",
  JOB_NOT_DRAFT:
    "Draf ini sudah berubah status. Muat ulang daftar pekerjaan untuk melihat kondisi terbaru.",
  JOB_NOT_FOUND: "Pekerjaan tidak ditemukan atau bukan milik akun ini.",
  VALIDATION_FAILED: "Periksa kembali ketentuan pekerjaan yang ditandai.",
  RATE_LIMITED:
    "Terlalu banyak pekerjaan dibuat dalam waktu singkat. Tunggu sebentar lalu coba lagi.",
  CATEGORY_NOT_ALLOWED:
    "Kategori ini belum dapat digunakan untuk ketentuan pekerjaan tersebut.",
  WAGE_BELOW_GUIDELINE:
    "Upah Kesempatan Pertama harus memenuhi panduan upah yang berlaku.",
  WAGE_GUIDELINE_UNAVAILABLE:
    "Panduan upah belum tersedia untuk kombinasi area, kategori, dan satuan ini.",
};

function safeFieldErrors(details: unknown) {
  if (typeof details !== "object" || details === null || Array.isArray(details)) {
    return undefined;
  }

  const fieldErrors: Record<string, string[]> = {};

  for (const [field, messages] of Object.entries(details)) {
    if (!jobFieldNames.has(field) || !Array.isArray(messages)) continue;

    const safeMessages = messages.filter(
      (message): message is string =>
        typeof message === "string" && message.length > 0 && message.length <= 300,
    );

    if (safeMessages.length > 0) {
      fieldErrors[field] = safeMessages;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

export function toJobActionFailure(
  error: unknown,
  fallbackMessage: string,
): JobActionFailure {
  if (!(error instanceof ApplicationError)) {
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: fallbackMessage,
    };
  }

  return {
    ok: false,
    code: error.code,
    message: jobErrorMessages[error.code] ?? fallbackMessage,
    fieldErrors: safeFieldErrors(error.details),
  };
}
