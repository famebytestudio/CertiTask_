"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Order, Receipt } from "./models";
import { PosTerminalAnimation } from "./PosTerminalAnimation";

interface Props {
  order: Order;
  receipt: Receipt;
  onViewReceipt: () => void;
  onDone: () => void;
}

type Phase = "terminal" | "text" | "summary" | "actions";

/**
 * OrderPlacedScreen — Screen 2. Staggered animation sequence:
 * 1. POS terminal with card + checkmark + receipt animations (~2s)
 * 2. Fade-in "Order placed" title
 * 3. Slide-up summary card
 * 4. Fade-in action buttons
 */
export function OrderPlacedScreen({ order, receipt, onViewReceipt, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("terminal");
  const calledRef = useRef(false);

  useEffect(() => {
    // text phase after terminal animation completes (handled via onAnimationComplete)
  }, []);

  const handleTerminalComplete = () => {
    if (calledRef.current) return;
    calledRef.current = true;

    setTimeout(() => setPhase("text"), 100);
    setTimeout(() => setPhase("summary"), 600);
    setTimeout(() => setPhase("actions"), 1000);
  };

  const usd = (cents: number) =>
    `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

  const arrivesText =
    order.plan === "STARTER"
      ? "Active immediately · 30 days"
      : order.plan === "GROWTH"
      ? "Active immediately · 30 days"
      : "Active immediately · 30 days";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        paddingTop: "max(32px, env(safe-area-inset-top, 32px))",
        paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))",
        gap: 0,
      }}
    >
      {/* POS Terminal animation */}
      <div
        style={{
          marginBottom: 24,
          opacity: phase === "terminal" ? 1 : 0.9,
          transition: "opacity 0.5s ease",
        }}
      >
        <PosTerminalAnimation autoPlay onAnimationComplete={handleTerminalComplete} />
      </div>

      {/* "Order placed" text */}
      <div
        style={{
          textAlign: "center",
          opacity: phase !== "terminal" ? 1 : 0,
          transform: phase !== "terminal" ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          maxWidth: 360,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(26px, 7vw, 34px)",
            fontWeight: 900,
            color: "var(--navy)",
            letterSpacing: "-0.8px",
            margin: "0 0 8px",
          }}
        >
          Order placed 🎉
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.6, margin: 0 }}>
          Your {order.planName} plan is now active. You can start posting projects right away.
        </p>
      </div>

      {/* Summary card */}
      <div
        style={{
          marginTop: 24,
          width: "100%",
          maxWidth: 360,
          opacity: phase === "summary" || phase === "actions" ? 1 : 0,
          transform: phase === "summary" || phase === "actions" ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden",
          }}
        >
          <SummaryRow
            label="Paid"
            value={`${usd(order.total)} ${order.currency}`}
            icon="💳"
          />
          <SummaryRow
            label="Receipt"
            value={receipt.receiptNo}
            icon="🧾"
            isLast
          />
          <SummaryRow
            label="Status"
            value={arrivesText}
            icon="⚡"
            isLast
          />
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          marginTop: 28,
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          opacity: phase === "actions" ? 1 : 0,
          transform: phase === "actions" ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
        }}
      >
        {/* View receipt button */}
        <button
          id="order-placed-view-receipt"
          onClick={onViewReceipt}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 100,
            background: "#fff",
            border: "2px solid var(--border)",
            color: "var(--navy)",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--navy)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-sm)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          View receipt
        </button>

        {/* Done button */}
        <button
          id="order-placed-done"
          onClick={onDone}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 100,
            background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)",
            border: "none",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(15,42,74,0.4)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(15,42,74,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(15,42,74,0.4)";
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 20px",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 13, color: "var(--ink-muted)", flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>{value}</span>
    </div>
  );
}
