/** Checkout flow type models — mirrors the DB plan structure for the UI. */

export type PlanTierUI = "STARTER" | "GROWTH" | "PRO";

export interface OrderItem {
  label: string;
  amount: number | null; // null = FREE
  currency?: string;
}

/** Lightweight order snapshot passed between checkout screens. */
export interface Order {
  id: string;               // payment DB id
  plan: PlanTierUI;
  planName: string;
  items: OrderItem[];
  subtotal: number;         // cents
  issuanceFee: number;      // cents — 0 for plans
  delivery: number;         // cents — 0 for plans
  total: number;            // cents
  currency: string;
  createdAt: string;        // ISO
}

/** Populated after payment succeeds. */
export interface Receipt {
  receiptNo: string;
  cardholder: string;
  paymentMethod: string;
  status: "PAID" | "REFUNDED";
  paymentId: string;
  plan: PlanTierUI;
  planName: string;
  total: number;  // cents
  currency: string;
  paidAt: string; // ISO
  periodStart: string | null;
  periodEnd: string | null;
}

export type PaymentStatus = "idle" | "processing" | "success" | "failure";
