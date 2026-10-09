"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { createPaymentService } from "@/components/checkout/PaymentService";
import type { Order, Receipt } from "@/components/checkout/models";

interface PaymentData {
  id: string; plan: Order["plan"]; planName: string; audience: "client" | "talent";
  amountCents: number; currency: string; status: string; receiptNumber: string | null;
  paidAt: string | null; createdAt: string; cardholder: string;
  periodStart: string | null; periodEnd: string | null;
}
type LoadState = { kind: "loading" } | { kind: "ready"; payment: PaymentData } | { kind: "error"; message: string };

function PaymentSuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const paymentId = params.get("order_id") ?? params.get("payment");
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!paymentId) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load(attempt: number) {
      try {
        const confirmation = await fetch("/api/billing/confirm", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }), signal: controller.signal,
        });
        if (confirmation.status === 401) {
          router.replace(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        const result = await fetch(`/api/billing/payment/${encodeURIComponent(paymentId!)}`, { cache: "no-store", signal: controller.signal });
        if (!result.ok) {
          const error = await result.json().catch(() => ({}));
          throw new Error(error.error ?? "Could not load payment details.");
        }
        const payment: PaymentData = await result.json();
        if (controller.signal.aborted) return;
        if (payment.status === "SUCCEEDED" && payment.receiptNumber && payment.paidAt) {
          setState({ kind: "ready", payment });
        } else if (payment.status === "REFUNDED") {
          setState({ kind: "error", message: "This payment has been refunded. See your billing history." });
        } else if (attempt < 4) {
          timer = setTimeout(() => { void load(attempt + 1); }, 1500);
        } else {
          setState({ kind: "error", message: "Your payment is still awaiting confirmation. Check billing or try again. Your plan activates only after Safepay confirms the payment." });
        }
      } catch (error) {
        if (!controller.signal.aborted) setState({ kind: "error", message: error instanceof Error ? error.message : "Could not confirm payment. Please try again." });
      }
    }
    void load(0);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [paymentId, retry, router]);

  if (!paymentId || state.kind === "error") {
    return <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-navy">Payment confirmation</h1>
      <p className="my-5" role="alert">{state.kind === "error" ? state.message : "No payment reference found in the URL."}</p>
      <div className="flex justify-center gap-4">
        {paymentId && <button className="rounded-lg bg-navy px-5 py-3 font-bold text-white" onClick={() => { setState({ kind: "loading" }); setRetry(value => value + 1); }}>Try again</button>}
        <Link className="rounded-lg border border-navy px-5 py-3 font-bold text-navy" href="/dashboard?tab=billing">Check billing</Link>
      </div>
    </main>;
  }
  if (state.kind === "loading") return <main className="py-24 text-center" role="status">Confirming your payment…</main>;

  const p = state.payment;
  const order: Order = {
    id: p.id, plan: p.plan, planName: p.planName,
    items: [{ label: `${p.planName} plan — 30 days`, amount: p.amountCents }],
    subtotal: p.amountCents, issuanceFee: 0, delivery: 0, total: p.amountCents, currency: p.currency, createdAt: p.createdAt,
  };
  const receipt: Receipt = {
    receiptNo: p.receiptNumber!, cardholder: p.cardholder, paymentMethod: "Safepay", status: "PAID",
    paymentId: p.id, plan: p.plan, planName: p.planName, total: p.amountCents, currency: p.currency,
    paidAt: p.paidAt!, periodStart: p.periodStart, periodEnd: p.periodEnd,
  };
  return <CheckoutFlow order={order} paymentService={createPaymentService()} initialReceipt={receipt} initialStep="placed" onComplete={() => router.replace(`/${p.audience}/dashboard?tab=billing`)} />;
}

export default function PaymentSuccessPage() {
  return <Suspense fallback={<main className="py-24 text-center" role="status">Confirming your payment…</main>}><PaymentSuccessInner /></Suspense>;
}
