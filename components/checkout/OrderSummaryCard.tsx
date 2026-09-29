"use client";

import React from "react";
import type { Order } from "./models";

const usd = (cents: number) =>
  `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

interface Props {
  order: Order;
  /** If true, show a compact version (no header). */
  compact?: boolean;
  style?: React.CSSProperties;
}

/** Rounded white summary card showing line items + bold total. */
export function OrderSummaryCard({ order, compact, style }: Props) {
  const rows = [
    ...order.items.map((item) => ({
      label: item.label,
      value: item.amount === null ? "FREE" : usd(item.amount),
      bold: false,
    })),
    ...(order.issuanceFee > 0
      ? [{ label: "Issuance fee", value: usd(order.issuanceFee), bold: false }]
      : []),
    ...(order.delivery > 0
      ? [{ label: "Delivery", value: usd(order.delivery), bold: false }]
      : []),
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        ...style,
      }}
    >
      {!compact && (
        <div
          style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>
            Order summary
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--ink-subtle)",
            }}
          >
            {order.currency}
          </span>
        </div>
      )}

      <div style={{ padding: "12px 20px" }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom:
                i < rows.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: row.bold ? "var(--navy)" : "var(--ink-muted)",
                fontWeight: row.bold ? 700 : 400,
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: 14,
                color: row.value === "FREE" ? "var(--success)" : "var(--ink)",
                fontWeight: row.value === "FREE" ? 700 : 500,
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Bold total row */}
      <div
        style={{
          margin: "0 20px",
          padding: "14px 0",
          borderTop: "2px solid var(--navy)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)" }}>
          Total today
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "var(--navy)",
            letterSpacing: "-0.5px",
          }}
        >
          {usd(order.total)} {order.currency}
        </span>
      </div>
    </div>
  );
}
