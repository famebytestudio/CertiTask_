/**
 * PaymentService — abstract interface + real Safepay implementation.
 * Swap `paymentService` export for a different gateway without touching screens.
 */

import type { Order, PaymentResult } from "./models";

export interface PaymentResult {
  ok: boolean;
  error?: string;
  subscriptionId?: string | null;
  redirectUrl?: string;
}

export interface PaymentService {
  /** Initiate payment. May return a redirect URL for hosted gateways. */
  pay(order: Order): Promise<PaymentResult>;
}

/**
 * SafepayPaymentService — calls /api/billing/checkout to get the redirect URL.
 */
export class SafepayPaymentService implements PaymentService {
  async pay(order: Order): Promise<PaymentResult> {
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: order.plan }),
      });
      const json = await res.json();
      if (res.ok && json.checkoutUrl) {
        return { ok: true, redirectUrl: json.checkoutUrl };
      }
      return { ok: false, error: json.error ?? "Could not start checkout." };
    } catch {
      return { ok: false, error: "Network error. Please check your connection." };
    }
  }
}

/**
 * MockPaymentService — 2-second fake delay, always succeeds instantly.
 */
export class MockPaymentService implements PaymentService {
  async pay(_order: Order): Promise<PaymentResult> {
    await new Promise((r) => setTimeout(r, 2000));
    return { ok: true, subscriptionId: "mock-sub-id" };
  }
}

/** Active service singleton — swap here to change gateway. */
export function createPaymentService(): PaymentService {
  return new SafepayPaymentService();
}
