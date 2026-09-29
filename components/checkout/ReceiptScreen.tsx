"use client";

import React, { useCallback, useState } from "react";
import type { Receipt } from "./models";
import { PrinterSlot } from "./PrinterSlot";
import { ReceiptPaper } from "./ReceiptPaper";

interface Props {
  receipt: Receipt;
  onDone: () => void;
}

/**
 * ReceiptScreen — Screen 3. Near-black background with metallic printer slot at top.
 * Receipt paper slides down line-by-line, then a PAID stamp lands.
 * "Print again" replays the animation. "Done" calls onDone().
 */
export function ReceiptScreen({ receipt, onDone }: Props) {
  const [printKey, setPrintKey] = useState(0); // increment to replay
  const [printing, setPrinting] = useState(true);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  const handlePrintComplete = useCallback(() => {
    setPrinting(false);
    setButtonsVisible(true);
  }, []);

  const handlePrintAgain = useCallback(() => {
    setButtonsVisible(false);
    setPrinting(true);
    setPrintKey((k) => k + 1);
  }, []);

  const handleReceiptPrint = useCallback(() => {
    const url = `/api/billing/receipt/${receipt.paymentId}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [receipt.paymentId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0D0D",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.06) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* Back arrow + title row */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 20px",
          paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
          position: "relative",
          zIndex: 2,
        }}
      >
        <button
          id="receipt-back"
          onClick={onDone}
          aria-label="Go back"
          style={{
            position: "absolute",
            left: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            padding: 8,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            letterSpacing: 0.2,
          }}
        >
          Receipt
        </h1>
      </div>

      {/* Printer slot */}
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          paddingTop: 8,
          position: "relative",
          zIndex: 2,
        }}
      >
        <PrinterSlot printing={printing} />
      </div>

      {/* Receipt paper — slides down from slot */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 340,
          padding: "0 20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            animation: "ct-paper-slide 0.4s cubic-bezier(0.4,0,0.2,1) both",
          }}
          key={printKey}
        >
          <ReceiptPaper
            key={printKey}
            receipt={receipt}
            animate
            onPrintComplete={handlePrintComplete}
          />
        </div>
      </div>

      {/* Printing caption */}
      {printing && (
        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: 0.5,
            zIndex: 2,
            animation: "ct-blink 1.4s ease-in-out infinite",
          }}
        >
          Printing your receipt…
        </p>
      )}

      {/* Bottom action buttons */}
      <div
        style={{
          marginTop: 28,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
          maxWidth: 340,
          padding: "0 20px",
          opacity: buttonsVisible ? 1 : 0,
          transform: buttonsVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          pointerEvents: buttonsVisible ? "auto" : "none",
          zIndex: 2,
        }}
      >
        {/* Print PDF button */}
        <button
          id="receipt-print-pdf"
          onClick={handleReceiptPrint}
          style={{
            width: "100%",
            height: 50,
            borderRadius: 100,
            background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.4)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print PDF receipt
        </button>

        {/* Print again — replay animation */}
        <button
          id="receipt-print-again"
          onClick={handlePrintAgain}
          style={{
            width: "100%",
            height: 50,
            borderRadius: 100,
            background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.45)",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
          }}
        >
          ↻ Print again
        </button>

        {/* Done */}
        <button
          id="receipt-done"
          onClick={onDone}
          style={{
            width: "100%",
            height: 50,
            borderRadius: 100,
            background: "#fff",
            border: "none",
            color: "#0D0D0D",
            fontSize: 15,
            fontWeight: 800,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(255,255,255,0.15)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(255,255,255,0.22)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(255,255,255,0.15)";
          }}
        >
          Done
        </button>
      </div>

      <style>{`
        @keyframes ct-paper-slide {
          from { transform: translateY(-24px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes ct-blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
