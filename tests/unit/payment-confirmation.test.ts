import { describe, expect, test } from "bun:test";
import {
  CASH_PAYMENT_CONFIRMATION_WINDOW_MS,
  isCashPaymentMethod,
} from "@/server/domain/payment-confirmations/policy";

describe("cash payment confirmation policy", () => {
  test("recognizes only explicit cash payment methods", () => {
    expect(isCashPaymentMethod("Tunai (COD)")).toBe(true);
    expect(isCashPaymentMethod("tunai di lokasi")).toBe(true);
    expect(isCashPaymentMethod("Cash")).toBe(true);
    expect(isCashPaymentMethod("Transfer bank")).toBe(false);
    expect(isCashPaymentMethod("Non-tunai")).toBe(false);
  });

  test("uses an exact 48-hour response window", () => {
    expect(CASH_PAYMENT_CONFIRMATION_WINDOW_MS).toBe(48 * 60 * 60 * 1000);
  });
});
