"use client";

import Link from "next/link";
import { Banner } from "@/components/dashboard/DashboardShell";
import { Btn, Notice, StatusBadge, VerificationBadge, formatDate } from "@/components/dashboard/ui";
import type { DashboardResponse } from "@/lib/types";
import type { ClientTab } from "@/app/client/dashboard/page";

export function OverviewTab({
  data,
  goTo,
}: {
  data: DashboardResponse;
  goTo: (t: ClientTab) => void;
  onChanged: () => void;
}) {
  const { profile, projects, applications, submissions, certificates } = data;
  const reviewQueue = submissions.filter(s => s.status === "SUBMITTED");
  const newApps = applications.filter(a => a.status === "PENDING");
  const activeProjects = projects.filter(p => p.status === "ACTIVE");
  const draftProjects = projects.filter(p => p.status === "DRAFT");

  const stats = [
    {
      label: "Active Projects",
      value: activeProjects.length,
      icon: "🚀",
      color: "#0F2A4A",
      bg: "linear-gradient(135deg, rgba(15,42,74,0.06) 0%, rgba(15,42,74,0.02) 100%)",
      border: "rgba(15,42,74,0.12)",
      tab: "projects" as const,
      hint: `${draftProjects.length} draft${draftProjects.length !== 1 ? "s" : ""}`,
    },
    {
      label: "New Applications",
      value: newApps.length,
      icon: "📋",
      color: "#2B6CB0",
      bg: "linear-gradient(135deg, rgba(49,130,206,0.08) 0%, rgba(49,130,206,0.02) 100%)",
      border: "rgba(49,130,206,0.2)",
      tab: "applications" as const,
      hint: `${applications.length} total received`,
    },
    {
      label: "Awaiting Review",
      value: reviewQueue.length,
      icon: "📤",
      color: reviewQueue.length > 0 ? "#9B2C2C" : "var(--ink-muted)",
      bg: reviewQueue.length > 0
        ? "linear-gradient(135deg, rgba(229,62,62,0.12) 0%, rgba(229,62,62,0.04) 100%)"
        : "linear-gradient(135deg, rgba(15,42,74,0.04) 0%, #FAFAFA 100%)",
      border: reviewQueue.length > 0 ? "rgba(229,62,62,0.3)" : "var(--border)",
      tab: "submissions" as const,
      hint: reviewQueue.length > 0 ? "Action required" : "Queue is clear",
    },
    {
      label: "Certificates Issued",
      value: certificates.length,
      icon: "🏅",
      color: "#276749",
      bg: "linear-gradient(135deg, rgba(56,161,105,0.1) 0%, rgba(56,161,105,0.03) 100%)",
      border: "rgba(56,161,105,0.25)",
      tab: "certificates" as const,
      hint: "Verifiable credentials",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Executive Hero Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #071526 0%, #0F2A4A 60%, #15385B 100%)",
          borderRadius: 16,
          padding: "30px 32px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(10,29,51,0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,162,39,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "rgba(201,162,39,0.2)",
                color: "var(--gold-light)",
                padding: "3px 10px",
                borderRadius: 20,
                border: "1px solid rgba(201,162,39,0.35)",
              }}
            >
              Client Enterprise Hub
            </span>
            <VerificationBadge status={profile.verificationStatus} />
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5, lineHeight: 1.2 }}>
            Welcome, {profile.name} 👋
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, marginTop: 8, marginBottom: 0, maxWidth: 640, lineHeight: 1.5 }}>
            Post project challenges, collaborate with vetted talent and teams, review completed deliverables, and issue permanent verified certificates.
          </p>

          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Btn
              variant="gold"
              onClick={() => goTo("post-project")}
              style={{ padding: "10px 20px", fontSize: 13, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span>➕</span> Post a New Project
            </Btn>
            {reviewQueue.length > 0 && (
              <Btn
                variant="danger"
                onClick={() => goTo("submissions")}
                style={{ padding: "10px 18px", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <span>📤</span> Review Submissions ({reviewQueue.length})
              </Btn>
            )}
            <Link
              href={`/clients/${profile.id}`}
              target="_blank"
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🏢</span> Public Client Page ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {profile.verificationStatus !== "VERIFIED" && (
        <div
          style={{
            background: profile.verificationStatus === "PENDING_REVIEW" ? "rgba(236,201,75,0.12)" : "rgba(229,62,62,0.07)",
            border: `1.5px solid ${profile.verificationStatus === "PENDING_REVIEW" ? "rgba(201,162,39,0.4)" : "rgba(229,62,62,0.3)"}`,
            borderRadius: 14,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 24 }}>{profile.verificationStatus === "PENDING_REVIEW" ? "⏳" : "🪪"}</span>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: profile.verificationStatus === "PENDING_REVIEW" ? "#744210" : "#9B2C2C",
                }}
              >
                {profile.verificationStatus === "PENDING_REVIEW"
                  ? "Organization verification is under review"
                  : "Complete account verification to publish live projects"}
              </div>
              <div style={{ fontSize: 13, color: profile.verificationStatus === "PENDING_REVIEW" ? "#97640E" : "#742A2A", marginTop: 2 }}>
                {profile.verificationStatus === "PENDING_REVIEW"
                  ? "Your verification documents are being evaluated by an administrator. You can prepare projects as drafts in the meantime."
                  : "Unverified accounts can draft projects. Complete verification so your listings go live and your organization name appears on issued certificates."}
              </div>
            </div>
          </div>
          <Btn
            variant={profile.verificationStatus === "PENDING_REVIEW" ? "ghost" : "primary"}
            small
            onClick={() => goTo("verification")}
            style={{ whiteSpace: "nowrap" }}
          >
            {profile.verificationStatus === "PENDING_REVIEW" ? "View Verification Status →" : "Verify Organization →"}
          </Btn>
        </div>
      )}

      {/* Stat Tiles */}
      <div className="mobile-dashboard-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {stats.map(s => (
          <div
            key={s.label}
            onClick={() => goTo(s.tab)}
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 14,
              padding: "20px 18px",
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-muted)" }}>{s.label}</span>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {s.icon}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-subtle)", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{s.hint}</span>
              <span style={{ fontWeight: 700, color: s.color }}>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Review Queue Urgent Callout Banner */}
      {reviewQueue.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(229,62,62,0.12) 0%, rgba(229,62,62,0.04) 100%)",
            border: "1.5px solid rgba(229,62,62,0.35)",
            borderRadius: 14,
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            boxShadow: "0 4px 14px rgba(229,62,62,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 30 }}>📥</span>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "#9B2C2C", margin: "0 0 4px" }}>
                {reviewQueue.length} Submission{reviewQueue.length > 1 ? "s" : ""} Awaiting Your Evaluation
              </h4>
              <p style={{ fontSize: 13, color: "#742A2A", margin: 0 }}>
                Review deliverables and approve to issue tamper-proof certificates to all team members, or request changes.
              </p>
            </div>
          </div>
          <Btn variant="danger" onClick={() => goTo("submissions")} style={{ padding: "10px 20px", fontWeight: 800 }}>
            Open Review Queue →
          </Btn>
        </div>
      )}

      {/* Two-Column Section: Recent Projects & Pipeline Summary */}
      <div className="mobile-dashboard-two-col" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        {/* Recent Projects Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", margin: 0 }}>🚀 Active Projects</h3>
              <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "2px 0 0" }}>Manage your current listings and candidate applications.</p>
            </div>
            <button
              onClick={() => goTo("projects")}
              style={{
                background: "none",
                border: "none",
                color: "var(--navy)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View All ({projects.length}) →
            </button>
          </div>

          {projects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", border: "1px dashed var(--border)", borderRadius: 12, color: "var(--ink-subtle)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p style={{ margin: "0 0 12px", fontWeight: 600, color: "var(--navy)" }}>You haven&apos;t posted any projects yet.</p>
              <Btn variant="gold" small onClick={() => goTo("post-project")}>
                + Post Your First Project
              </Btn>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    background: "#FAFAFA",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/projects/${p.id}`} style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)", textDecoration: "none" }}>
                      {p.title}
                    </Link>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 3 }}>
                      Due {formatDate(p.deadline)} · {p._count?.applications ?? 0} applied · {p._count?.submissions ?? 0} submitted
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Management Shortcuts & Insights */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", margin: "0 0 4px" }}>⚡ Quick Actions</h3>
            <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "0 0 16px" }}>Fast shortcuts to manage your client operations.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => goTo("post-project")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "#FAFAFA",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>➕</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Post a New Project</div>
                    <div style={{ fontSize: 11, color: "var(--ink-subtle)" }}>Set scope, deliverables and deadlines</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--navy)" }}>→</span>
              </button>

              <button
                onClick={() => goTo("applications")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "#FAFAFA",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Review Candidate Pitches</div>
                    <div style={{ fontSize: 11, color: "var(--ink-subtle)" }}>{newApps.length} pending candidate pitches</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--navy)" }}>→</span>
              </button>

              <button
                onClick={() => goTo("billing")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "#FAFAFA",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>💳</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Subscription &amp; Posting Quotas</div>
                    <div style={{ fontSize: 11, color: "var(--ink-subtle)" }}>Manage billing, invoices &amp; limits</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--navy)" }}>→</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Organization Profile</span>
            <button
              onClick={() => goTo("profile")}
              style={{
                background: "none",
                border: "none",
                color: "var(--navy)",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Edit Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
