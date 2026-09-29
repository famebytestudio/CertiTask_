"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Receipt } from "./models";

const usd = (cents: number) =>
  `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface ReceiptLine {
  label: string;
  value: string;
  bold?: boolean;
  spacer?: boolean;
}

interface Props {
  receipt: Receipt;
  /** When true, the receipt paper animates sliding down line by line. */
  animate?: boolean;
  onPrintComplete?: () => void;
}

/**
 * ReceiptPaper — monospace cream paper with line-by-line reveal animation
 * and a rubber-stamp PAID badge that lands after printing finishes.
 */
export function ReceiptPaper({ receipt, animate = false, onPrintComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [stampVisible, setStampVisible] = useState(false);
  const calledRef = useRef(false);

  const lines: ReceiptLine[] = [
    { label: "CertiTask", value: "", bold: true },
    { label: "PLAN ORDER RECEIPT", value: "" },
    { label: "", value: "", spacer: true },
    { label: "Receipt No.", value: receipt.receiptNo },
    { label: "Date", value: fmt(receipt.paidAt) },
    { label: "Cardholder", value: receipt.cardholder },
    { label: "Method", value: receipt.paymentMethod },
    { label: "", value: "", spacer: true },
    { label: "─".repeat(28), value: "" },
    { label: `${receipt.planName} Plan`, value: usd(receipt.total) },
    { label: "Issuance fee", value: "FREE" },
    { label: "─".repeat(28), value: "" },
    { label: "TOTAL", value: `${usd(receipt.total)} ${receipt.currency}`, bold: true },
    { label: "", value: "", spacer: true },
    { label: `Paid by ${receipt.paymentMethod}`, value: "Approved", bold: true },
    { label: "", value: "", spacer: true },
    { label: "Thank you for choosing CertiTask.", value: "" },
  ];

  useEffect(() => {
    if (!animate) {
      setVisibleLines(lines.length);
      setTimeout(() => setStampVisible(true), 300);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= lines.length) {
        clearInterval(interval);
        setTimeout(() => {
          setStampVisible(true);
          if (!calledRef.current) {
            calledRef.current = true;
            onPrintComplete?.();
          }
        }, 600);
      }
    }, 90);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);

  return (
    <div
      style={{
        position: "relative",
        background: "#FDFBF3",
        borderRadius: "0 0 4px 4px",
        border: "1px solid #E2D9C0",
        borderTop: "none",
        padding: "20px 20px 30px",
        fontFamily: '"Courier New", "Courier", monospace',
        fontSize: 12,
        lineHeight: 1.8,
        color: "#2D2416",
        minWidth: 280,
        maxWidth: 340,
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        overflow: "hidden",
      }}
    >
      {/* Barcode area */}
      <div style={{ marginBottom: 16 }}>
        {lines.slice(0, visibleLines).map((line, i) => {
          if (line.spacer) {
            return <div key={i} style={{ height: 6 }} />;
          }
          const isCenter = i === 0 || i === 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: isCenter ? "center" : "space-between",
                alignItems: "baseline",
                gap: 8,
                fontWeight: line.bold ? 700 : 400,
                fontSize: i === 0 ? 14 : 12,
                opacity: 1,
                animation: animate ? "ct-line-fade 0.15s ease forwards" : "none",
              }}
            >
              <span style={{ flex: "0 0 auto", color: line.label.startsWith("─") ? "#C4B07A" : undefined }}>
                {line.label}
              </span>
              {line.value && (
                <span
                  style={{
                    flex: "1 1 auto",
                    textAlign: "right",
                    color:
                      line.value === "FREE"
                        ? "#38A169"
                        : line.value === "Approved"
                        ? "#38A169"
                        : undefined,
                  }}
                >
                  {line.value}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Simple barcode SVG */}
      {visibleLines >= lines.length && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <BarcodeStripes receiptNo={receipt.receiptNo} />
          <div style={{ fontSize: 9, marginTop: 4, letterSpacing: 2, color: "#8A7A5E" }}>
            {receipt.receiptNo}
          </div>
        </div>
      )}

      {/* Jagged torn bottom edge */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 12,
          background:
            "repeating-linear-gradient(90deg, #FDFBF3 0px, #FDFBF3 8px, transparent 8px, transparent 16px)",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
        }}
      />

      {/* PAID stamp */}
      <PaidStamp visible={stampVisible} date={fmt(receipt.paidAt)} />

      <style>{`
        @keyframes ct-line-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/** Rubber-stamp PAID badge that lands with scale + rotation animation */
function PaidStamp({ visible, date }: { visible: boolean; date: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "42%",
        right: "10%",
        opacity: visible ? 1 : 0,
        transform: visible ? "rotate(-18deg) scale(1)" : "rotate(-18deg) scale(2.5)",
        transition: "opacity 0.3s cubic-bezier(0.68,-0.55,0.27,1.55), transform 0.35s cubic-bezier(0.68,-0.55,0.27,1.55)",
        pointerEvents: "none",
        zIndex: 10,
      }}
      aria-hidden
    >
      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          border: "4px solid #16A34A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(240, 253, 244, 0.85)",
          backdropFilter: "blur(2px)",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "#16A34A",
            letterSpacing: 2,
            fontFamily: '"Courier New", monospace',
          }}
        >
          PAID
        </span>
        <span style={{ fontSize: 8, color: "#16A34A", fontFamily: '"Courier New", monospace', marginTop: 2 }}>
          {date}
        </span>
      </div>
    </div>
  );
}

/** Simple barcode using alternating thin/thick SVG lines */
function BarcodeStripes({ receiptNo }: { receiptNo: string }) {
  const seed = receiptNo.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bars: { w: number; gap: number }[] = [];
  for (let i = 0; i < 32; i++) {
    bars.push({ w: ((seed * (i + 3)) % 3) + 1, gap: ((seed * (i + 7)) % 2) + 1 });
  }
  const totalW = bars.reduce((a, b) => a + b.w + b.gap, 0);
  const scaleX = 130 / totalW;

  let x = 0;
  return (
    <svg width="130" height="36" viewBox={`0 0 130 36`}>
      {bars.map((b, i) => {
        const barX = x * scaleX;
        x += b.w + b.gap;
        return (
          <rect
            key={i}
            x={barX}
            y={0}
            width={b.w * scaleX}
            height={36}
            fill="#2D2416"
          />
        );
      })}
    </svg>
  );
}
