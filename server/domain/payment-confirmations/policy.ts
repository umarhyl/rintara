export const CASH_PAYMENT_CONFIRMATION_WINDOW_MS = 48 * 60 * 60 * 1000;

export function isCashPaymentMethod(paymentMethod: string): boolean {
  return /^(tunai|cash)(?:\s|\(|$)/i.test(paymentMethod.trim());
}
