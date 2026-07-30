import { NextResponse, type NextRequest } from "next/server";
import { ApplicationError } from "@/server/errors/application-error";
import {
  getAuthorizedWorkEvidence,
  uploadWorkCompletionEvidence,
} from "@/server/domain/work/evidence";
import { downloadWorkEvidenceObject } from "@/server/infrastructure/storage/work-evidence";

export const dynamic = "force-dynamic";

const MAX_MULTIPART_BYTES = 6 * 1024 * 1024;

function errorResponse(error: unknown) {
  if (!(error instanceof ApplicationError)) {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Permintaan belum dapat diproses." },
      { status: 500 },
    );
  }

  const status =
    error.code === "UNAUTHENTICATED"
      ? 401
      : error.code === "FORBIDDEN" || error.code === "ACCOUNT_INACTIVE"
        ? 403
        : error.code === "NOT_FOUND"
          ? 404
          : error.code === "WORK_EVIDENCE_INVALID" ||
              error.code === "VALIDATION_FAILED"
            ? 400
            : error.code === "INVALID_STATE_TRANSITION"
              ? 409
              : error.code === "RATE_LIMITED"
                ? 429
              : 500;

  return NextResponse.json(
    { code: error.code, message: error.message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ agreementId: string }> },
) {
  try {
    const { agreementId } = await context.params;
    const evidence = await getAuthorizedWorkEvidence(agreementId);
    const bytes = await downloadWorkEvidenceObject(evidence.storagePath);

    return new Response(bytes, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline; filename=\"bukti-hasil.webp\"",
        "Content-Length": String(evidence.byteSize),
        "Content-Type": evidence.mimeType,
        ETag: `"${evidence.sha256}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ agreementId: string }> },
) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > MAX_MULTIPART_BYTES) {
    return NextResponse.json(
      {
        code: "WORK_EVIDENCE_INVALID",
        message: "Foto harus berukuran maksimal 5 MB.",
      },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const [{ agreementId }, formData] = await Promise.all([
      context.params,
      request.formData(),
    ]);
    const file = formData.get("photo");
    const privacyAttested = formData.get("privacyAttested") === "true";

    if (!(file instanceof File)) {
      throw new ApplicationError(
        "WORK_EVIDENCE_INVALID",
        "Pilih satu foto JPG, PNG, atau WebP.",
      );
    }

    const result = await uploadWorkCompletionEvidence({
      agreementId,
      file,
      privacyAttested,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
