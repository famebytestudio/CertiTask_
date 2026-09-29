"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PaymentStatus } from "./models";

interface Props {
  label: string;            // e.g. "Order · $10.00"
  status: PaymentStatus;
  onPay: () => void;
  disabled?: boolean;
}

/**
 * MorphingPayButton — full-width black pill that morphs into a compact
 * loading indicator when processing. Restores on failure.
 */
export function MorphingPayButton({ label, status, onPay, disabled }: Props) {
  const [width, setWidth] = useState<number | undefined>(undefined);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Capture natural width before morphing
  useEffect(() => {
    if (btnRef.current && width === undefined) {
      setWidth(btnRef.current.offsetWidth);
    }
  }, [width]);

  const isLoading = status === "processing";
  const isFailed = status === "failure";

  const morphedWidth = 120;
  const pillHeight = 54;

  const containerStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  };

  const btnStyle: React.CSSProperties = {
    height: pillHeight,
    width: isLoading ? morphedWidth : "100%",
    maxWidth: isLoading ? morphedWidth : undefined,
    borderRadius: 100,
    border: "none",
    background: isFailed
      ? "var(--error)"
      : "linear-gradient(135deg, var(--ink) 0%, #2d3748 100%)",
    color: "#fff",
    fontSize: isLoading ? 0 : 16,
    fontWeight: 700,
    fontFamily: "inherit",
    letterSpacing: 0.2,
    cursor: isLoading || disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition:
      "width 0.45s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.35s ease, background 0.3s ease, box-shadow 0.3s ease",
    boxShadow: isFailed
      ? "0 4px 14px rgba(229,62,62,0.4)"
      : "0 4px 20px rgba(30,37,48,0.45)",
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
  };

  const handleClick = () => {
    if (isLoading || disabled) return;
    onPay();
  };

  return (
    <div style={containerStyle}>
      <button
        ref={btnRef}
        id="checkout-pay-button"
        onClick={handleClick}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        aria-label={isLoading ? "Processing payment" : label}
        style={btnStyle}
      >
        {isLoading ? (
          <DotsLoader />
        ) : (
          <>
            {!isFailed && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            )}
            <span style={{ whiteSpace: "nowrap" }}>
              {isFailed ? "Retry payment" : label}
            </span>
          </>
        )}
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: isFailed ? "var(--error)" : "var(--ink-subtle)",
          transition: "color 0.3s ease",
          textAlign: "center",
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? (
          <span>Confirming your payment…</span>
        ) : isFailed ? (
          <span>Payment failed. Please try again.</span>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure payment · Cancel anytime
          </>
        )}
      </div>
    </div>
  );
}

/** Two-dot bounce loader */
function DotsLoader() {
  return (
    <span
      style={{ display: "flex", gap: 6, alignItems: "center" }}
      aria-hidden
    >
      <span style={{ ...dotStyle, animationDelay: "0s" }} />
      <span style={{ ...dotStyle, animationDelay: "0.18s" }} />
      <style>{`
        @keyframes ct-dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

const dotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#fff",
  display: "inline-block",
  animation: "ct-dot-bounce 1.1s ease-in-out infinite",
};
