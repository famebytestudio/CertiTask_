"use client";

import React, { useEffect, useRef, useState } from "react";

type Phase =
  | "idle"       // waiting to start
  | "check"      // green check drawing
  | "receipt"    // receipt sliding out
  | "done";      // everything shown

interface Props {
  /** Call startAnimation() when payment succeeds to begin the sequence. */
  onAnimationComplete?: () => void;
  autoPlay?: boolean; // start immediately (default: false)
}

/**
 * PosTerminalAnimation — inline SVG/CSS animation of a POS terminal.
 * Phases: card slides in → green checkmark draws → receipt paper slides out.
 * Total duration ≈ 2.4 s.
 */
export function PosTerminalAnimation({ onAnimationComplete, autoPlay = false }: Props) {
  const [phase, setPhase] = useState<Phase>(autoPlay ? "check" : "idle");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!autoPlay) return;
    const t1 = setTimeout(() => setPhase("receipt"), 900);
    const t2 = setTimeout(() => {
      setPhase("done");
      if (!calledRef.current) {
        calledRef.current = true;
        onAnimationComplete?.();
      }
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [autoPlay, onAnimationComplete]);

  const checkProgress = phase === "check" || phase === "receipt" || phase === "done" ? 1 : 0;
  const receiptProgress = phase === "receipt" || phase === "done" ? 1 : 0;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
      role="img"
      aria-label="Payment terminal animation"
    >
      <style>{`
        @keyframes ct-slide-card {
          from { transform: translateY(-24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes ct-draw-check {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes ct-receipt-slide {
          from { transform: translateY(-100%); }
          to   { transform: translateY(0); }
        }
        @keyframes ct-glow-pulse {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 6px 2px #38A169; }
          50% { opacity: 1; box-shadow: 0 0 14px 4px #38A169; }
        }
      `}</style>

      {/* Receipt paper (slides down from above the terminal) */}
      <div
        style={{
          width: 70,
          minHeight: receiptProgress ? 70 : 0,
          maxHeight: receiptProgress ? 70 : 0,
          overflow: "hidden",
          transition: "max-height 0.6s cubic-bezier(0.4,0,0.2,1), min-height 0.6s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 2,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 70,
            height: 70,
            background: "#FDFBF3",
            borderRadius: "0 0 4px 4px",
            border: "1px solid #E2D9C0",
            borderTop: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 3,
            transform: receiptProgress ? "translateY(0)" : "translateY(-100%)",
            transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {["▌▌▌▌▌▌▌▌▌", "▌ ▌ ▌ ▌ ▌", "▌▌▌▌▌▌▌▌▌"].map((line, i) => (
            <div key={i} style={{ fontSize: 8, color: "#C4B07A", letterSpacing: 1, lineHeight: 1 }}>{line}</div>
          ))}
        </div>
      </div>

      {/* Terminal body */}
      <svg width="160" height="200" viewBox="0 0 160 200" fill="none" style={{ zIndex: 1 }}>
        {/* Body */}
        <rect x="10" y="30" width="140" height="165" rx="14" fill="url(#termGrad)" />
        <defs>
          <linearGradient id="termGrad" x1="10" y1="30" x2="150" y2="195" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2D3748" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>
        </defs>

        {/* Card slot at top */}
        <rect x="50" y="26" width="60" height="12" rx="4" fill="#111827" />
        <rect x="54" y="29" width="52" height="6" rx="2" fill="#374151" />

        {/* Screen */}
        <rect x="20" y="50" width="120" height="78" rx="8" fill="#0F172A" />
        <rect x="24" y="54" width="112" height="70" rx="6" fill={checkProgress ? "rgba(56,161,105,0.12)" : "#1E293B"} style={{ transition: "fill 0.5s ease" }} />

        {/* Checkmark on screen */}
        {checkProgress > 0 && (
          <>
            <circle cx="80" cy="89" r="22" fill="rgba(56,161,105,0.15)" />
            <circle cx="80" cy="89" r="18" fill="none" stroke="#38A169" strokeWidth="2.5" />
            <polyline
              points="70,89 77,96 92,82"
              fill="none"
              stroke="#38A169"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="60"
              strokeDashoffset="0"
              style={{ animation: "ct-draw-check 0.6s ease forwards" }}
            />
          </>
        )}

        {/* Screen idle state */}
        {checkProgress === 0 && (
          <>
            <rect x="34" y="72" width="60" height="6" rx="3" fill="#334155" />
            <rect x="34" y="84" width="40" height="4" rx="2" fill="#1E40AF" opacity="0.6" />
          </>
        )}

        {/* Keypad rows */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={26 + col * 36}
              y={140 + row * 16}
              width={26}
              height={10}
              rx={3}
              fill="#374151"
            />
          ))
        )}
        {/* Green button */}
        <rect x="98" y="172" width="32" height="10" rx="3" fill="#166534" opacity="0.8" />

        {/* LED indicator */}
        <circle cx="140" cy="42" r="4" fill={checkProgress ? "#4ADE80" : "#374151"} style={{ transition: "fill 0.4s ease" }} />
      </svg>

      {/* LED glow */}
      {checkProgress > 0 && (
        <div style={{
          position: "absolute",
          top: receiptProgress ? 143 : 73,
          right: 8,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#4ADE80",
          animation: "ct-glow-pulse 1.2s ease-in-out infinite",
        }} />
      )}
    </div>
  );
}
