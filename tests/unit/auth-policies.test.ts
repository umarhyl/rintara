import { describe, expect, test } from "bun:test";
import { ApplicationError } from "@/server/errors/application-error";
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

    expect(() => assertActiveUser(suspendedWorker)).toThrow(ApplicationError);
    expect(() => assertActiveUser(suspendedWorker)).toThrow(
      "cannot perform protected operations",
    );
  });

  test("rejects a wrong role", () => {
    expect(() => assertRole(activeWorker, "employer")).toThrow(ApplicationError);
  });

  test("requires an active admin", () => {
    const admin = { ...activeWorker, role: "admin" as const };
    expect(assertAdmin(admin)).toEqual(admin);

    expect(() => assertAdmin(activeWorker)).toThrow(ApplicationError);
  });
});
