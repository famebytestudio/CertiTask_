"use client";

import React, { useCallback, useState } from "react";
import type { Order, PaymentStatus } from "./models";
import type { PaymentService } from "./PaymentService";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { MorphingPayButton } from "./MorphingPayButton";

const usd = (cents: number) =>
  `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

interface Props {
  order: Order;
  paymentService: PaymentService;
  onSuccess: () => void;
  onCancel?: () => void;
  /** Optional extra error handler (e.g. show a global toast). */
  onError?: (message: string) => void;
}

/**
 * ConfirmOrderScreen — Screen 1 of the checkout flow.
 * Shows an animated plan card hero, order summary, and a morphing pay button.
 */
export function ConfirmOrderScreen({
  order,
  paymentService,
  onSuccess,
  onCancel,
  onError,
}: Props) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePay = useCallback(async () => {
    setStatus("processing");
    setErrorMsg(null);

    const result = await paymentService.pay(order);
    if (result.ok) {
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
      } else {
        setStatus("success");
        onSuccess();
      }
    } else {
      setStatus("failure");
      const msg = result.error ?? "Payment could not be confirmed. Please try again.";
      setErrorMsg(msg);
      onError?.(msg);
    }
  }, [paymentService, order, onSuccess, onError]);

  const planColors: Record<string, { bg: string; accent: string }> = {
    STARTER: { bg: "linear-gradient(135deg,#1E3A5F 0%,#2D5016 100%)", accent: "#4ADE80" },
    GROWTH:  { bg: "linear-gradient(135deg,#0F2A4A 0%,#7C4A1A 100%)", accent: "#C9A227" },
    PRO:     { bg: "linear-gradient(135deg,#0A1D33 0%,#1A0A33 100%)", accent: "#A78BFA" },
  };
  const colors = planColors[order.plan] ?? planColors.GROWTH;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F3F1",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "env(safe-area-inset-bottom, 20px)",
      }}
    >
      {/* Top nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "16px 20px",
          paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
        }}
      >
        {onCancel && (
          <button
            id="confirm-order-back"
            onClick={onCancel}
            aria-label="Go back"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              borderRadius: 10,
              color: "var(--navy)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          padding: "0 20px",
          gap: 24,
          maxWidth: 520,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: "clamp(24px, 6vw, 30px)",
              fontWeight: 800,
              color: "var(--navy)",
              letterSpacing: "-0.8px",
              margin: 0,
            }}
          >
            Confirm order
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink-muted)" }}>
            Review your {order.planName} plan before you pay.
          </p>
        </div>

        {/* Hero plan card */}
        <div
          style={{
            borderRadius: 24,
            background: colors.bg,
            padding: "32px 28px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
            animation: "ct-card-float 0.6s cubic-bezier(0.4,0,0.2,1) both",
          }}
        >
          {/* Shimmer overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "ct-shimmer 3s ease-in-out infinite",
            }}
          />
          {/* Radial orb */}
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${colors.accent}33 0%, transparent 70%)`,
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Plan badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 100,
                background: "rgba(255,255,255,0.12)",
                border: `1px solid ${colors.accent}44`,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: colors.accent,
                  boxShadow: `0 0 8px ${colors.accent}`,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.8)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                {order.planName} Plan
              </span>
            </div>

            {/* Price */}
            <div
              style={{
                fontSize: "clamp(36px, 9vw, 48px)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-1.5px",
                lineHeight: 1,
              }}
            >
              {usd(order.total)}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
              30-day period · {order.currency} · Charged via Safepay
            </div>

            {/* Tier dots */}
            <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
              {["STARTER", "GROWTH", "PRO"].map((tier) => (
                <div
                  key={tier}
                  style={{
                    width: 28,
                    height: 4,
                    borderRadius: 2,
                    background:
                      tier === order.plan
                        ? colors.accent
                        : "rgba(255,255,255,0.2)",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Order summary card */}
        <OrderSummaryCard order={order} />

        {/* Error message */}
        {errorMsg && (
          <div
            role="alert"
            style={{
              background: "rgba(229,62,62,0.08)",
              border: "1px solid rgba(229,62,62,0.25)",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--error)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Sticky bottom */}
      <div
        style={{
          padding: "20px",
          paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
          maxWidth: 520,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <MorphingPayButton
          label={`Order · ${usd(order.total)}`}
          status={status}
          onPay={handlePay}
        />
      </div>

      <style>{`
        @keyframes ct-card-float {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ct-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
