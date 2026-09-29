"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { createPaymentService } from "@/components/checkout/PaymentService";
import type { Order, Receipt } from "@/components/checkout/models";
import { PLANS } from "@/lib/plans";

/** Data returned by GET /api/billing/payment/[id] */
interface PaymentData {
  id: string;
  plan: string;
  planName: string;
  amountCents: number;
  currency: string;
  status: string;
  receiptNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  cardholder: string;
  periodStart: string | null;
  periodEnd: string | null;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; order: Order; receipt: Receipt | undefined }
  | { kind: "error"; message: string };

function PaymentSuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  // Safepay sends ?order_id=<our payment id>&tracker=<tracker>
  const paymentId = params.get("order_id") ?? params.get("payment") ?? null;
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    if (!paymentId) {
      setLoadState({ kind: "error", message: "No payment reference found in the URL." });
      return;
    }

    async function load() {
      try {
        // Hit confirm endpoint to finalize the Safepay transaction
        const confirmRes = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });
        
        if (confirmRes.status === 401) {
          router.replace(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }

        const res = await fetch(`/api/billing/payment/${paymentId}`, { cache: "no-store" });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setLoadState({ kind: "error", message: json.error ?? "Could not load payment details." });
          return;
        }
        const data: PaymentData = await res.json();
        
        if (data.status !== "SUCCEEDED") {
           setLoadState({ kind: "error", message: "Payment was not successful. Please check your billing dashboard." });
           return;
        }

        const planDef = data.plan ? PLANS[data.plan as keyof typeof PLANS] : null;

        const order: Order = {
          id: data.id,
          plan: data.plan as Order["plan"],
          planName: data.planName,
          items: [{ label: `${data.planName} Plan — 30 days`, amount: data.amountCents }],
          subtotal: data.amountCents,
          issuanceFee: 0,
          delivery: 0,
          total: data.amountCents,
          currency: data.currency,
          createdAt: data.createdAt,
        };

        const receipt: Receipt = {
          receiptNo: data.receiptNumber!,
          cardholder: data.cardholder,
          paymentMethod: "Safepay",
          status: "PAID",
          paymentId: data.id,
          plan: data.plan as Receipt["plan"],
          planName: data.planName,
          total: data.amountCents,
          currency: data.currency,
          paidAt: data.paidAt ?? data.createdAt,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
        };

        void planDef; // suppress unused warning — available if needed for perks
        setLoadState({ kind: "ready", order, receipt });
      } catch {
        setLoadState({ kind: "error", message: "Network error loading payment details." });
      }
    }

    void load();
  }, [paymentId, router]);

  const handleComplete = useCallback(() => {
    router.replace("/client/dashboard?tab=billing");
  }, [router]);

  const handleCancel = useCallback(() => {
    router.replace("/client/dashboard?tab=billing");
  }, [router]);

  if (loadState.kind === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px", width: 28, height: 28, borderWidth: 3 }} />
          <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>Confirming your payment…</p>
        </div>
      </div>
    );
  }

  if (loadState.kind === "error") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", padding: 20 }}>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: 36, maxWidth: 460, width: "100%", textAlign: "center", boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: "0 0 24px" }}>{loadState.message}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/client/dashboard?tab=billing" style={{ display: "inline-block", padding: "10px 22px", background: "var(--navy)", color: "#fff", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Check billing</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CheckoutFlow
      order={loadState.order}
      paymentService={createPaymentService()}
      initialReceipt={loadState.receipt}
      initialStep="placed"
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}

