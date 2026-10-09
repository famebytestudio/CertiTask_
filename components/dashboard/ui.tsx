"use client";

import type { CSSProperties, ReactNode } from "react";
import { statusLabel } from "@/lib/enums";

/* ── Status badge ── */
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  // application
  PENDING:      { bg: "#EDF2F7",               color: "#4A5568" },
  SHORTLISTED:  { bg: "rgba(49,130,206,0.12)", color: "#2B6CB0" },
  SELECTED:     { bg: "rgba(56,161,105,0.12)", color: "#276749" },
  WITHDRAWN:    { bg: "#EDF2F7",               color: "#718096" },
  // submission
  SUBMITTED:    { bg: "rgba(49,130,206,0.12)", color: "#2B6CB0" },
  APPROVED:     { bg: "rgba(56,161,105,0.12)", color: "#276749" },
  // shared
  REJECTED:     { bg: "rgba(229,62,62,0.12)",  color: "#9B2C2C" },
  // certificate
  VERIFIED:     { bg: "rgba(56,161,105,0.12)", color: "#276749" },
  REVOKED:      { bg: "rgba(229,62,62,0.12)",  color: "#9B2C2C" },
  DISPUTED:     { bg: "rgba(236,201,75,0.18)", color: "#97640E" },
  // project
  DRAFT:        { bg: "#EDF2F7",               color: "#4A5568" },
  PENDING_PAYMENT: { bg: "rgba(236,201,75,0.18)", color: "#97640E" },
  ACTIVE:       { bg: "rgba(56,161,105,0.12)", color: "#276749" },
  PAUSED:       { bg: "rgba(236,201,75,0.18)", color: "#97640E" },
  CLOSED:       { bg: "#EDF2F7",               color: "#4A5568" },
  COMPLETED:    { bg: "rgba(15,42,74,0.08)",   color: "var(--navy)" },
  // verification
  UNVERIFIED:   { bg: "rgba(229,62,62,0.10)",  color: "#9B2C2C" },
  PENDING_REVIEW: { bg: "rgba(236,201,75,0.18)", color: "#97640E" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "#EDF2F7", color: "#4A5568" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {label ?? statusLabel(status)}
    </span>
  );
}

/* ── Form input style ── */
export const inputStyle = (err?: boolean): CSSProperties => ({
  width: "100%", padding: "10px 14px", border: `1.5px solid ${err ? "#E53E3E" : "var(--border)"}`,
  borderRadius: 8, fontSize: 14, outline: "none", background: "var(--paper)", color: "var(--ink)",
  transition: "border-color 0.2s",
});
export const textareaStyle = (err?: boolean): CSSProperties => ({ ...inputStyle(err), resize: "vertical", height: "auto" });
export const selectStyle = (err?: boolean): CSSProperties => ({ ...inputStyle(err), background: "#fff" });

export function Field({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 5 }}>
        {label}{required && " *"}
      </label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--ink-subtle)" }}>{hint}</p>}
    </div>
  );
}

/* ── Buttons ── */
type Variant = "primary" | "gold" | "success" | "danger" | "ghost" | "outline";
const VARIANT: Record<Variant, CSSProperties> = {
  primary: { background: "var(--navy)", color: "#fff", border: "none" },
  gold:    { background: "var(--gold)", color: "var(--navy)", border: "none" },
  success: { background: "var(--success)", color: "#fff", border: "none" },
  danger:  { background: "#9B2C2C", color: "#fff", border: "none" },
  ghost:   { background: "transparent", color: "var(--navy)", border: "1px solid var(--border)" },
  outline: { background: "#fff", color: "#9B2C2C", border: "1px solid var(--border)" },
};
export function Btn({ variant = "primary", small, style, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        padding: small ? "6px 12px" : "9px 18px", borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        ...VARIANT[variant], ...style,
      }}
    />
  );
}

/* ── Section header ── */
export function SectionHeader({ icon, title, subtitle, action }: { icon: string; title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", margin: "0 0 4px" }}>{icon} {title}</h2>
        <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: 0 }}>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="workspace-empty" style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-subtle)" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--ink-muted)" }}>{title}</div>
      {hint && <div style={{ fontSize: 13, marginBottom: 16 }}>{hint}</div>}
      {action}
    </div>
  );
}

/* ── Card ── */
export function Card({ children, style, accent }: { children: ReactNode; style?: CSSProperties; accent?: boolean }) {
  return (
    <div className="workspace-card" style={{ border: `1px solid ${accent ? "rgba(201,162,39,0.25)" : "var(--border)"}`, borderRadius: 14, padding: 22, background: accent ? "linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)" : "#FAFAFA", ...style }}>
      {children}
    </div>
  );
}

/* ── Notice ── */
export function Notice({ kind, children }: { kind: "success" | "error" | "warning" | "info"; children: ReactNode }) {
  const map = {
    success: { bg: "rgba(56,161,105,0.08)", border: "rgba(56,161,105,0.25)", color: "#276749" },
    error:   { bg: "rgba(229,62,62,0.08)",  border: "rgba(229,62,62,0.25)",  color: "#9B2C2C" },
    warning: { bg: "rgba(236,201,75,0.10)", border: "rgba(236,201,75,0.35)", color: "#744210" },
    info:    { bg: "rgba(49,130,206,0.08)", border: "rgba(49,130,206,0.25)", color: "#2B6CB0" },
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : undefined} style={{ marginTop: 14, padding: "12px 16px", background: map.bg, border: `1px solid ${map.border}`, borderRadius: 10, color: map.color, fontWeight: 600, fontSize: 13 }}>
      {children}
    </div>
  );
}

/* ── Modal ── */
export function Modal({ title, subtitle, onClose, children, maxWidth = 520 }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; maxWidth?: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,29,51,0.6)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth, width: "100%", boxShadow: "var(--shadow-lg)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", margin: "0 0 4px" }}>{title}</h3>
        {subtitle && <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: "0 0 20px" }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/* ── Helpers ── */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function SkillChips({ skills, max = 8 }: { skills: string[]; max?: number }) {
  if (!skills?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {skills.slice(0, max).map(sk => (
        <span key={sk} style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", background: "rgba(15,42,74,0.07)", border: "1px solid rgba(15,42,74,0.12)", borderRadius: 6, padding: "3px 10px" }}>{sk}</span>
      ))}
      {skills.length > max && <span style={{ fontSize: 11, color: "var(--ink-subtle)", padding: "3px 4px" }}>+{skills.length - max}</span>}
    </div>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  const verified = status === "VERIFIED";
  const pending = status === "PENDING_REVIEW";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
      background: verified ? "rgba(56,161,105,0.1)" : pending ? "rgba(236,201,75,0.18)" : "rgba(229,62,62,0.1)",
      color: verified ? "var(--success)" : pending ? "#97640E" : "#9B2C2C" }}>
      {verified ? "✓ Verified" : pending ? "⟳ Pending review" : "✗ Not verified"}
    </span>
  );
}
