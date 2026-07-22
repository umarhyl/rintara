import { ApplicationError } from "@/server/errors/application-error";
import type {
  RequestContext,
  RintaraRole,
  RintaraUserRecord,
} from "./types";

export function buildRequestContext(
  requestId: string,
  user: RintaraUserRecord,
): RequestContext {
  return {
    requestId,
    userId: user.id,
    role: user.role,
    accountStatus: user.status,
  };
}

export function assertActiveUser(context: RequestContext): RequestContext {
  if (context.accountStatus !== "active") {
    throw new ApplicationError(
      "ACCOUNT_INACTIVE",
      "This account cannot perform protected operations.",
    );
  }

  return context;
}

export function assertRole(
  context: RequestContext,
  requiredRole: RintaraRole,
): RequestContext {
  if (context.role !== requiredRole) {
    throw new ApplicationError(
      "FORBIDDEN",
      "This operation is not available for the current account.",
    );
  }

  return context;
}

export function assertAdmin(context: RequestContext): RequestContext {
  assertActiveUser(context);
  return assertRole(context, "admin");
}
