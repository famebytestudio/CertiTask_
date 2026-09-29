"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

export interface TabDef<T extends string> {
  id: T;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
}

interface Props<T extends string> {
  workspaceLabel: string;
  userName: string;
  userSubline: string;
  userBadge?: ReactNode;
  tabs: TabDef<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  headerActions?: ReactNode;
  sidebarExtra?: ReactNode;
  onSignOut: () => void;
  navId: string;
  banner?: ReactNode;
  children: ReactNode;
}

/**
 * Header + sidebar + main panel shared by the client and talent dashboards.
 * Keeps the responsive class names that app/globals.css already styles.
 */
export function DashboardShell<T extends string>({
  workspaceLabel, userName, userSubline, userBadge, tabs, activeTab, onTabChange,
  headerActions, sidebarExtra, onSignOut, navId, banner, children,
}: Props<T>) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileNavOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

  const initial = userName.charAt(0).toUpperCase() || "?";

  return (
    <div className="dashboard-responsive mobile-dashboard-shell" style={{ minHeight: "100vh", background: "var(--paper)", fontFamily: "var(--font-geist-sans)" }}>
      <header className="mobile-dashboard-header" style={{ background: "linear-gradient(135deg, #0A1D33 0%, #0F2A4A 60%, #1a3a5c 100%)", color: "#fff", padding: "0 24px", boxShadow: "0 2px 12px rgba(10,29,51,0.25)" }}>
        <div className="dashboard-responsive-header mobile-dashboard-header-inner" style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div className="mobile-dashboard-brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="mobile-dashboard-menu-button" type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open dashboard navigation" aria-expanded={mobileNavOpen} aria-controls={navId}>
              <span aria-hidden="true">☰</span>
            </button>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>Certi<span style={{ color: "var(--gold)" }}>Task</span></span>
            </Link>
            <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{workspaceLabel}</span>
          </div>
          <div className="dashboard-responsive-actions mobile-dashboard-header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "var(--navy)", flexShrink: 0 }}>{initial}</div>
            <NotificationBell />
            {headerActions}
            <button onClick={onSignOut} style={{ padding: "6px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="dashboard-responsive-layout mobile-dashboard-body" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px", display: "grid", gridTemplateColumns: "230px 1fr", gap: 24 }}>
        <div className={`mobile-dashboard-backdrop${mobileNavOpen ? " is-open" : ""}`} onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
        <aside id={navId} aria-hidden={!mobileNavOpen} className={`dashboard-responsive-sidebar mobile-dashboard-sidebar${mobileNavOpen ? " is-open" : ""}`} style={{ position: "sticky", top: 24, height: "fit-content" }}>
          <button className="mobile-dashboard-close-button" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close dashboard navigation"><span aria-hidden="true">×</span></button>
          <nav style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, #F8FAFC 0%, #EDF2F7 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "var(--gold)", flexShrink: 0 }}>{initial}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userSubline}</div>
                </div>
              </div>
              {userBadge}
            </div>
            <div style={{ padding: "8px 0" }}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => { onTabChange(tab.id); setMobileNavOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", border: "none", borderRadius: 0,
                      background: isActive ? "rgba(15,42,74,0.06)" : "transparent", color: isActive ? "var(--navy)" : "var(--ink-muted)",
                      fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: "pointer", transition: "all 0.15s",
                      borderLeft: isActive ? "3px solid var(--navy)" : "3px solid transparent" }}>
                    <span style={{ fontSize: 16 }}>{tab.icon}</span>
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: tab.badgeColor ?? "var(--navy)", color: "#fff", borderRadius: 10, padding: "1px 6px" }}>{tab.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Shown only on phones, where the header actions are hidden */}
            <div className="mobile-dashboard-drawer-actions" style={{ display: "none", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
              <NotificationBell light />
              <button onClick={onSignOut} style={{ padding: "8px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--navy)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Sign out</button>
            </div>
          </nav>
          {sidebarExtra}
        </aside>

        <main className="dashboard-responsive-content mobile-dashboard-main" style={{ minWidth: 0 }}>
          {banner}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, padding: 28, boxShadow: "var(--shadow-sm)", minHeight: 450 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function SidebarStats({ title, rows }: { title: string; rows: { label: string; value: ReactNode; color?: string }[] }) {
  return (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 16, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{title}</div>
      {rows.map((r, i) => (
        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{r.label}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: r.color ?? "var(--navy)" }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function LoadingScreen({ text }: { text: string }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--navy)", animation: "spin-slow 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--ink-muted)", fontWeight: 600 }}>{text}</p>
      </div>
    </div>
  );
}

export function StatTiles({ tiles }: { tiles: { label: string; value: number; icon: string; color: string; bg: string }[] }) {
  return (
    <div className="mobile-dashboard-stats-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${tiles.length}, 1fr)`, gap: 16, marginBottom: 28 }}>
      {tiles.map(s => (
        <div key={s.label} style={{ background: s.bg, border: "1px solid var(--border)", borderRadius: 12, padding: "18px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function Banner({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #0A1D33 0%, #0F2A4A 100%)", borderRadius: 14, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(201,162,39,0.08)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{eyebrow}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5 }}>{title}</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 6, marginBottom: 0 }}>{subtitle}</p>
        {actions && <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    </div>
  );
}

/** Shown above the main panel until the user confirms their email. */
export function EmailBanner({ email, verified, onVerify }: { email: string; verified: boolean; onVerify: () => void }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  if (verified) return null;
  async function resend() {
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push("/auth/verify-email");
    } else {
      setMsg(json.error ?? "Could not send");
    }
  }
  return (
    <div role="status" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ fontSize: 13, color: "#744210" }}>
        <strong>Confirm your email.</strong> We sent a 6-digit code to <strong>{email}</strong>. Until then you can browse and edit your profile, but not apply or post.
        {msg && <span style={{ display: "block", marginTop: 4 }}>{msg}</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={resend} style={{ padding: "6px 12px", background: "#fff", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#744210", cursor: "pointer" }}>Resend code</button>
        <button onClick={() => router.push("/auth/verify-email")} style={{ padding: "6px 12px", background: "#744210", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Enter code</button>
      </div>
    </div>
  );
}
