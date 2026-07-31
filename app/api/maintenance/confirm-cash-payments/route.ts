import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { autoConfirmCashPayments } from "@/server/domain/payment-confirmations/automatic-confirmation";
import { isAuthorizedMaintenanceRequest } from "@/server/infrastructure/maintenance-authorization";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthorizedMaintenanceRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incomingRequestId = request.headers.get("x-request-id")?.trim();
  const result = await autoConfirmCashPayments({
    requestId:
      incomingRequestId && incomingRequestId.length <= 128
        ? incomingRequestId
        : randomUUID(),
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
