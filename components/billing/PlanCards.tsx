"use client";

import type { PlanTier } from "@/lib/plans";
import Link from "next/link";

export interface PlanCatalogItem {
  tier: PlanTier; name: string; tagline: string; price: string; priceCents: number; postLimit: number | null; perks: string[];
}

/**
 * Plan comparison cards, used by /pricing and the in-dashboard picker.
 * `current` marks the active plan; `onChoose` (when given) turns cards into buttons.
 */
export function PlanCards({ plans, current, onChoose, busy, compact, displayOnly = false, quotaLabel = "project post" }: {
  plans: PlanCatalogItem[]; current?: PlanTier | null; onChoose?: (tier: PlanTier) => void; busy?: PlanTier | null; compact?: boolean; displayOnly?: boolean; quotaLabel?: string;
}) {
  const rank: Record<PlanTier, number> = { STARTER: 1, GROWTH: 2, PRO: 3 };
  return (
    <div className="plan-grid mobile-dashboard-form-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: compact ? 12 : 20 }}>
      {plans.map(p => {
        const isCurrent = current === p.tier;
        const lower = current ? rank[p.tier] < rank[current] : false;
        const highlight = p.tier === "GROWTH";
        return (
          <div key={p.tier} className={`plan-card ${highlight ? "plan-highlight" : ""}`} style={{ border: `2px solid ${isCurrent ? "var(--success)" : highlight ? "var(--gold)" : "var(--border)"}`, borderRadius: 16, padding: compact ? 18 : 24, background: highlight ? "#FFFDF5" : "#fff", position: "relative", display: "flex", flexDirection: "column" }}>
            {highlight && !isCurrent && <span style={{ position: "absolute", top: -11, left: 18, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", background: "var(--gold)", color: "var(--navy)", padding: "3px 10px", borderRadius: 10 }}>Most popular</span>}
            {isCurrent && <span style={{ position: "absolute", top: -11, left: 18, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", background: "var(--success)", color: "#fff", padding: "3px 10px", borderRadius: 10 }}>Your plan</span>}
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: 1 }}>{p.name}</div>
            <div style={{ fontSize: compact ? 28 : 36, fontWeight: 800, color: "var(--navy)", margin: "6px 0 0", lineHeight: 1 }}>{p.price}<span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-subtle)" }}> / 30 days</span></div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", margin: "6px 0 14px" }}>{p.tagline}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 10 }}>{p.postLimit === null ? "Unlimited" : p.postLimit} {quotaLabel}{p.postLimit === 1 ? "" : "s"}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              {p.perks.map(k => <li key={k} style={{ fontSize: 13, color: "var(--ink-muted)", display: "flex", gap: 8 }}><span style={{ color: "var(--success)", fontWeight: 800 }}>✓</span>{quotaLabel === "project request" ? k.replaceAll("project posts", "project requests") : k}</li>)}
            </ul>
            {displayOnly && <button disabled style={{ padding: "11px 0", borderRadius: 10, border: "1px solid var(--border)", fontWeight: 800, fontSize: 14, background: "#F7FAFC", color: "var(--ink-muted)", cursor: "not-allowed" }}>Payments coming soon</button>}
            {!displayOnly && !onChoose && <Link href={`/auth/signup?role=${quotaLabel === "project request" ? "talent" : "client"}`} className="ct-button ct-button-dark">Get started with {p.name} ↗</Link>}
            {onChoose && (
              <button onClick={() => onChoose(p.tier)} disabled={!!busy || lower}
                style={{ padding: "11px 0", borderRadius: 10, border: "none", fontWeight: 800, fontSize: 14, cursor: busy || lower ? "not-allowed" : "pointer", background: highlight ? "var(--gold)" : "var(--navy)", color: highlight ? "var(--navy)" : "#fff", opacity: busy && busy !== p.tier ? 0.6 : 1 }}>
                {busy === p.tier ? "Opening checkout…" : isCurrent ? "Renew plan" : lower ? "Available after current period" : current ? `Upgrade to ${p.name}` : `Choose ${p.name}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
