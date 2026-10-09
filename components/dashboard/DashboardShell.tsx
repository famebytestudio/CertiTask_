"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

export interface TabDef<T extends string> {
  id: T;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
  category?: string;
}

export interface TabGroup<T extends string> {
  label: string;
  tabIds: T[];
}

interface Props<T extends string> {
  workspaceLabel: string;
  workspaceBadge?: ReactNode;
  userName: string;
  userSubline: string;
  userBadge?: ReactNode;
  userAvatarUrl?: string | null;
  profileCompleteness?: number;
  tabs: TabDef<T>[];
  tabGroups?: TabGroup<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  headerActions?: ReactNode;
  sidebarExtra?: ReactNode;
  onSignOut: () => void;
  navId: string;
  banner?: ReactNode;
  children: ReactNode;
  searchPlaceholder?: string;
  onSearchClick?: () => void;
  bottomNavTabs?: T[];
}

/**
 * Modern SaaS Navigation Bar + Floating Sidebar + Workspace Panel
 */
export function DashboardShell<T extends string>({
  workspaceLabel,
  workspaceBadge,
  userName,
  userSubline,
  userBadge,
  userAvatarUrl,
  profileCompleteness,
  tabs,
  tabGroups,
  activeTab,
  onTabChange,
  headerActions,
  sidebarExtra,
  onSignOut,
  navId,
  banner,
  children,
  searchPlaceholder,
  onSearchClick,
  bottomNavTabs,
}: Props<T>) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileNavOpen(false);
        setUserDropdownOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && onSearchClick) {
        e.preventDefault();
        onSearchClick();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen, onSearchClick]);

  const initial = userName.charAt(0).toUpperCase() || "?";
  const getTab = (id: T) => tabs.find(t => t.id === id);

  return (
    <div
      className="dashboard-responsive mobile-dashboard-shell"
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        fontFamily: "var(--font-geist-sans)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top Header / App Bar ── */}
      <header
        className="mobile-dashboard-header"
        style={{
          background: "linear-gradient(135deg, #071526 0%, #0D233A 50%, #123050 100%)",
          color: "#fff",
          padding: "0 24px",
          boxShadow: "0 4px 20px rgba(7, 21, 38, 0.35)",
          borderBottom: "1px solid rgba(201, 162, 39, 0.25)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="dashboard-responsive-header mobile-dashboard-header-inner"
          style={{
            maxWidth: 1340,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 68,
            gap: 16,
          }}
        >
          {/* Brand & Workspace Hub */}
          <div className="mobile-dashboard-brand" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="mobile-dashboard-menu-button"
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open workspace navigation"
              aria-expanded={mobileNavOpen}
              aria-controls={navId}
              style={{
                display: "none",
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: 20,
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span aria-hidden="true">☰</span>
            </button>

            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: -0.6,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Certi<span style={{ color: "var(--gold)" }}>Task</span>
              </span>
            </Link>

            <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.18)" }} />

            {workspaceBadge ? (
              workspaceBadge
            ) : (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "rgba(201,162,39,0.18)",
                  color: "var(--gold-light)",
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: "1px solid rgba(201,162,39,0.35)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--gold)",
                    display: "inline-block",
                  }}
                />
                {workspaceLabel}
              </span>
            )}
          </div>

          {/* Quick Search Shortcut Pill in Header */}
          {searchPlaceholder && (
            <div
              onClick={onSearchClick}
              className="mobile-dashboard-header-compact"
              style={{
                flex: "0 1 360px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 12,
                padding: "7px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                cursor: onSearchClick ? "pointer" : "default",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                if (onSearchClick) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)";
                }
              }}
              onMouseLeave={e => {
                if (onSearchClick) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "var(--gold-light)" }}>🔍</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {searchPlaceholder}
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.12)",
                  padding: "2px 6px",
                  borderRadius: 6,
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: "monospace",
                }}
              >
                ⌘K
              </span>
            </div>
          )}

          {/* Header Action Items & Profile Hub */}
          <div
            className="dashboard-responsive-actions mobile-dashboard-header-actions"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            {headerActions}

            <NotificationBell />

            {/* User Profile Trigger Button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 24,
                  padding: "4px 10px 4px 4px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--gold) 0%, #E2B93B 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 900,
                    color: "var(--navy)",
                    overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.25)",
                  }}
                >
                  {userAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userAvatarUrl} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    initial
                  )}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    maxWidth: 110,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {userName.split(" ")[0]}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>▼</span>
              </button>

              {/* Profile Popover Dropdown */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 44,
                    width: 230,
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    boxShadow: "var(--shadow-lg)",
                    padding: 8,
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {userName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {userSubline}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onTabChange("profile" as T);
                      setUserDropdownOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: "var(--navy)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>✏️</span> Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      onTabChange("verification" as T);
                      setUserDropdownOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: "var(--navy)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>🪪</span> Verification
                  </button>

                  <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6 }}>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSignOut();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "transparent",
                        color: "#9B2C2C",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(229,62,62,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Layout ── */}
      <div
        className="dashboard-responsive-layout mobile-dashboard-body"
        style={{
          maxWidth: 1340,
          margin: "0 auto",
          padding: "24px 20px 60px",
          display: "grid",
          gridTemplateColumns: "250px 1fr",
          gap: 24,
          flex: 1,
          width: "100%",
        }}
      >
        {/* Mobile Backdrop */}
        <div
          className={`mobile-dashboard-backdrop${mobileNavOpen ? " is-open" : ""}`}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />

        {/* ── Sidebar Navigation ── */}
        <aside
          id={navId}
          className={`dashboard-responsive-sidebar mobile-dashboard-sidebar${mobileNavOpen ? " is-open" : ""}`}
          style={{ position: "sticky", top: 88, height: "fit-content" }}
        >
          <button
            className="mobile-dashboard-close-button"
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <span aria-hidden="true">✕</span>
          </button>

          <nav
            className="workspace-nav"
            aria-label="Workspace Navigation"
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(15, 42, 74, 0.05)",
            }}
          >
            {/* User Profile Card Widget */}
            <div
              style={{
                padding: "20px 18px",
                borderBottom: "1px solid var(--border)",
                background: "linear-gradient(135deg, #F8FAFC 0%, #EDF2F7 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "var(--navy)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 900,
                      color: "var(--gold)",
                      flexShrink: 0,
                      border: "2px solid #fff",
                      boxShadow: "0 2px 8px rgba(15,42,74,0.15)",
                      overflow: "hidden",
                    }}
                  >
                    {userAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userAvatarUrl} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      initial
                    )}
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "var(--success)",
                      border: "2px solid #fff",
                    }}
                  />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {userName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {userSubline}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6 }}>
                {userBadge}
              </div>

              {/* Profile Strength Bar */}
              {profileCompleteness !== undefined && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "var(--ink-muted)", marginBottom: 5 }}>
                    <span>Profile Strength</span>
                    <span style={{ color: profileCompleteness >= 80 ? "var(--success)" : "var(--gold)" }}>
                      {profileCompleteness}%
                    </span>
                  </div>
                  <div style={{ height: 5, background: "#E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${profileCompleteness}%`,
                        background: profileCompleteness >= 80 ? "var(--success)" : "var(--gold)",
                        borderRadius: 10,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Nav Tab List (Grouped or Flat) */}
            <div style={{ padding: "10px 8px" }}>
              {tabGroups ? (
                tabGroups.map((group, gIdx) => (
                  <div key={group.label} style={{ marginBottom: gIdx < tabGroups.length - 1 ? 12 : 0 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "var(--ink-subtle)",
                        textTransform: "uppercase",
                        padding: "6px 12px 4px",
                      }}
                    >
                      {group.label}
                    </div>
                    {group.tabIds.map(tId => {
                      const tab = getTab(tId);
                      if (!tab) return null;
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => {
                            onTabChange(tab.id);
                            setMobileNavOpen(false);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            borderRadius: 10,
                            border: "none",
                            background: isActive
                              ? "linear-gradient(90deg, rgba(15,42,74,0.08) 0%, rgba(201,162,39,0.12) 100%)"
                              : "transparent",
                            color: isActive ? "var(--navy)" : "var(--ink-muted)",
                            fontSize: 13,
                            fontWeight: isActive ? 800 : 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            textAlign: "left",
                            position: "relative",
                            marginBottom: 2,
                          }}
                          onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.background = "rgba(15,42,74,0.04)";
                          }}
                          onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {isActive && (
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 6,
                                bottom: 6,
                                width: 3,
                                borderRadius: "0 4px 4px 0",
                                background: "var(--gold)",
                              }}
                            />
                          )}

                          <span style={{ color: isActive ? "var(--navy)" : "var(--ink-subtle)", display: "flex" }}>
                            <WorkspaceIcon name={tab.id} />
                          </span>

                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tab.label}
                          </span>

                          {tab.badge !== undefined && tab.badge > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                background: tab.badgeColor ?? "var(--navy)",
                                color: "#fff",
                                borderRadius: 12,
                                padding: "1px 7px",
                                minWidth: 18,
                                textAlign: "center",
                              }}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                tabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        onTabChange(tab.id);
                        setMobileNavOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: isActive
                          ? "linear-gradient(90deg, rgba(15,42,74,0.08) 0%, rgba(201,162,39,0.12) 100%)"
                          : "transparent",
                        color: isActive ? "var(--navy)" : "var(--ink-muted)",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                        position: "relative",
                        marginBottom: 2,
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = "rgba(15,42,74,0.04)";
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {isActive && (
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 6,
                            bottom: 6,
                            width: 3,
                            borderRadius: "0 4px 4px 0",
                            background: "var(--gold)",
                          }}
                        />
                      )}
                      <WorkspaceIcon name={tab.id} />
                      <span style={{ flex: 1 }}>{tab.label}</span>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            background: tab.badgeColor ?? "var(--navy)",
                            color: "#fff",
                            borderRadius: 12,
                            padding: "1px 7px",
                          }}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Mobile Drawer Sign Out */}
            <div
              className="mobile-dashboard-drawer-actions"
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "14px 16px",
                borderTop: "1px solid var(--border)",
                background: "#FAFAFA",
              }}
            >
              <NotificationBell light />
              <button
                onClick={onSignOut}
                style={{
                  padding: "8px 16px",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "#9B2C2C",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          </nav>

          {sidebarExtra}
        </aside>

        {/* ── Main Content Area ── */}
        <main className="dashboard-responsive-content mobile-dashboard-main" style={{ minWidth: 0 }}>
          {banner}
          <div
            key={activeTab}
            className="workspace-panel"
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 28,
              boxShadow: "0 2px 12px rgba(15, 42, 74, 0.04)",
              minHeight: 480,
            }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Floating Bottom Tab Dock ── */}
      {bottomNavTabs && bottomNavTabs.length > 0 && (
        <div
          className="mobile-bottom-nav-dock"
          style={{
            display: "none",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(10, 29, 51, 0.96)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(201, 162, 39, 0.3)",
            padding: "8px 12px",
            zIndex: 60,
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          {bottomNavTabs.map(tId => {
            const tab = getTab(tId);
            if (!tab) return null;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  background: isActive ? "rgba(201,162,39,0.2)" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  color: isActive ? "var(--gold-light)" : "rgba(255,255,255,0.65)",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: isActive ? 800 : 500,
                  position: "relative",
                  minWidth: 50,
                }}
              >
                <WorkspaceIcon name={tab.id} />
                <span>{tab.label.split(" ")[0]}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 6,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: tab.badgeColor ?? "var(--gold)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SidebarStats({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: ReactNode; color?: string }[];
}) {
  return (
    <div
      style={{
        marginTop: 16,
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "18px 16px",
        boxShadow: "0 2px 8px rgba(15, 42, 74, 0.04)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "var(--ink-subtle)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {rows.map((r, i) => (
        <div
          key={r.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--ink-muted)", fontWeight: 600 }}>{r.label}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: r.color ?? "var(--navy)", fontVariantNumeric: "tabular-nums" }}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Minimal, Clean, Modern Loading Screen for Workspaces
 */
export function LoadingScreen({ text }: { text: string }) {
  const isError = text.toLowerCase().includes("wrong") || text.toLowerCase().includes("error") || text.toLowerCase().includes("unable");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper)",
        padding: 24,
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 360,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Minimal Subtle Spinner */}
        {!isError ? (
          <div style={{ position: "relative", width: 40, height: 40 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "3px solid #E2E8F0",
                borderTopColor: "var(--navy)",
                borderRightColor: "var(--gold)",
                animation: "spin-slow 0.75s linear infinite",
              }}
            />
          </div>
        ) : (
          <div style={{ fontSize: 32 }}>⚠️</div>
        )}

        {/* Text */}
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: isError ? "#9B2C2C" : "var(--navy)",
              margin: 0,
              letterSpacing: -0.2,
            }}
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export function StatTiles({
  tiles,
}: {
  tiles: { label: string; value: number; icon: string; color: string; bg: string }[];
}) {
  return (
    <div
      className="mobile-dashboard-stats-grid"
      style={{ display: "grid", gridTemplateColumns: `repeat(${tiles.length}, 1fr)`, gap: 16, marginBottom: 28 }}
    >
      {tiles.map(s => (
        <div
          key={s.label}
          className="workspace-stat"
          style={{
            background: s.bg,
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "20px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>
            {s.value}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2, fontWeight: 600 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function Banner({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className="workspace-banner"
      style={{
        background: "linear-gradient(135deg, #0A1D33 0%, #0F2A4A 100%)",
        borderRadius: 16,
        padding: "28px 32px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(201,162,39,0.08)",
        }}
      />
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
export function EmailBanner({ email, verified }: { email: string; verified: boolean; onVerify: () => void }) {
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
    <div
      role="status"
      style={{
        background: "#FFFBEB",
        border: "1px solid #FDE68A",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontSize: 13, color: "#744210" }}>
        <strong>Confirm your email.</strong> We sent a 6-digit code to <strong>{email}</strong>. Until then you can browse and edit your profile, but not apply or post.
        {msg && <span style={{ display: "block", marginTop: 4 }}>{msg}</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={resend}
          style={{
            padding: "6px 12px",
            background: "#fff",
            border: "1px solid #FDE68A",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: "#744210",
            cursor: "pointer",
          }}
        >
          Resend code
        </button>
        <button
          onClick={() => router.push("/auth/verify-email")}
          style={{
            padding: "6px 12px",
            background: "#744210",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Enter code
        </button>
      </div>
    </div>
  );
}
