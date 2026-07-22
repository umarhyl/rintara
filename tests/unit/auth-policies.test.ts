import { describe, expect, test } from "bun:test";
import {
  ApplicationError,
  type ApplicationErrorCode,
} from "@/server/errors/application-error";
import {
  assertActiveUser,
  assertAdmin,
  assertRole,
  buildRequestContext,
} from "@/server/auth/policies";

const activeWorker = buildRequestContext("req-test", {
  id: "00000000-0000-4000-8000-000000000001",
  role: "worker",
  status: "active",
});

function expectApplicationErrorCode(
  action: () => unknown,
  code: ApplicationErrorCode,
) {
  try {
    action();
    throw new Error(`Expected ${code}.`);
  } catch (error) {
    expect(error).toBeInstanceOf(ApplicationError);
    expect((error as ApplicationError).code).toBe(code);
  }
}

describe("authorization policies", () => {
  test("builds context only from trusted user fields", () => {
    expect(activeWorker).toEqual({
      requestId: "req-test",
      userId: "00000000-0000-4000-8000-000000000001",
      role: "worker",
      accountStatus: "active",
    });
  });

  test("rejects suspended users", () => {
    const suspendedWorker = { ...activeWorker, accountStatus: "suspended" as const };

    expectApplicationErrorCode(
      () => assertActiveUser(suspendedWorker),
      "ACCOUNT_INACTIVE",
    );
  });

  test("rejects deleted users", () => {
    const deletedWorker = { ...activeWorker, accountStatus: "deleted" as const };

    expectApplicationErrorCode(
      () => assertActiveUser(deletedWorker),
      "ACCOUNT_INACTIVE",
    );
  });

  test("rejects a wrong role", () => {
    expectApplicationErrorCode(
      () => assertRole(activeWorker, "employer"),
      "FORBIDDEN",
    );
  });

  test("requires an active admin", () => {
    const admin = { ...activeWorker, role: "admin" as const };
    expect(assertAdmin(admin)).toEqual(admin);

    expectApplicationErrorCode(() => assertAdmin(activeWorker), "FORBIDDEN");
    expectApplicationErrorCode(
      () => assertAdmin({ ...admin, accountStatus: "suspended" }),
      "ACCOUNT_INACTIVE",
    );
  });
});
