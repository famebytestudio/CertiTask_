"use client";

import React, { useEffect, useState } from "react";

interface Props {
  /** When true the LED blinks and paper is "printing". */
  printing: boolean;
}

/**
 * PrinterSlot — metallic printer header slot mounted at the top of the ReceiptScreen.
 * A green LED blinks while `printing` is true.
 */
export function PrinterSlot({ printing }: Props) {
  const [ledOn, setLedOn] = useState(false);

  useEffect(() => {
    if (!printing) { setLedOn(false); return; }
    const interval = setInterval(() => setLedOn((v) => !v), 500);
    return () => clearInterval(interval);
  }, [printing]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 340,
        margin: "0 auto",
        background: "linear-gradient(180deg, #374151 0%, #1F2937 60%, #111827 100%)",
        borderRadius: "0 0 12px 12px",
        padding: "14px 20px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Metallic sheen */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 60%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Paper slot opening */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 5,
          background: "#0D0D0D",
          borderRadius: "6px 6px 0 0",
        }}
      />

      {/* Brand text */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: 2,
          textTransform: "uppercase",
          zIndex: 1,
        }}
      >
        CertiTask
      </span>

      {/* LED + label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>
          {printing ? "PRINT" : "READY"}
        </span>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: ledOn ? "#4ADE80" : "rgba(74, 222, 128, 0.2)",
            boxShadow: ledOn ? "0 0 8px 2px #4ADE80" : "none",
            transition: "background 0.15s ease, box-shadow 0.15s ease",
          }}
        />
      </div>
    </div>
  );
}
