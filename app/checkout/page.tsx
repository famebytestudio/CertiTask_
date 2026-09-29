"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { createPaymentService } from "@/components/checkout/PaymentService";
import type { Order, PlanTierUI } from "@/components/checkout/models";
import { PLANS, type PlanTier } from "@/lib/plans";

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planTier = searchParams.get("plan") as PlanTier;

  const order = useMemo<Order | null>(() => {
    if (!planTier || !PLANS[planTier]) return null;
    const def = PLANS[planTier];
    return {
      id: `temp-${Date.now()}`, // Temporary ID for display
      plan: planTier as PlanTierUI,
      planName: def.name,
      items: [{ label: `${def.name} Plan — 30 days`, amount: def.priceCents }],
      subtotal: def.priceCents,
      issuanceFee: 0,
      delivery: 0,
      total: def.priceCents,
      currency: "USD",
      createdAt: new Date().toISOString(),
    };
  }, [planTier]);

  if (!order) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", padding: 20 }}>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: 36, maxWidth: 460, width: "100%", textAlign: "center", boxShadow: "var(--shadow-md)" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", margin: "0 0 8px" }}>Invalid Plan</h1>
          <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: "0 0 24px" }}>Please select a valid plan to continue.</p>
          <button onClick={() => router.back()} style={{ display: "inline-block", padding: "10px 22px", background: "var(--navy)", color: "#fff", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 14, border: "none", cursor: "pointer" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutFlow
      order={order}
      paymentService={createPaymentService()}
      onComplete={() => router.replace("/client/dashboard?tab=billing")}
      onCancel={() => router.back()}
    />
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
