"use client";

import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

import Link from "next/link";
import { Btn, StatusBadge, VerificationBadge, formatDate } from "@/components/dashboard/ui";
import type { DashboardResponse } from "@/lib/types";
import type { TalentTab } from "@/app/talent/dashboard/page";

export function profileCompletion(p: DashboardResponse["profile"]) {
  const items = [
    { label: "Email verified", done: !!p.emailVerifiedAt },
    { label: "Identity verified", done: p.verificationStatus === "VERIFIED" },
    { label: "University added", done: !!p.universityName },
    { label: "Degree program added", done: !!p.degreeProgram },
    { label: "Skills added", done: p.skills.length > 0 },
    { label: "Portfolio link added", done: !!p.portfolioUrl },
    { label: "Phone number added", done: !!p.phone },
    { label: "Bio written", done: !!p.bio },
  ];
  const pct = Math.round((items.filter(i => i.done).length / items.length) * 100);
  return { items, pct };
}

export function OverviewTab({ data, goTo }: { data: DashboardResponse; goTo: (t: TalentTab) => void }) {
  const { profile, projects, applications, submissions, certificates } = data;
  const { items, pct } = profileCompletion(profile);
  const selected = applications.filter(a => a.status === "SELECTED");
  const awaitingSubmission = selected.filter(a => !submissions.some(s => s.teamId === a.teamId && s.status !== "REJECTED"));
  const pendingApps = applications.filter(a => a.status === "PENDING" || a.status === "SHORTLISTED");

  const stages = [
    { icon: <WorkspaceIcon name="target" />, title: "Join & explore", desc: "Browse real projects posted by verified clients.", status: "done" },
    { icon: <WorkspaceIcon name="edit" />, title: "Complete your profile", desc: "Skills, education and portfolio make your applications stand out.", status: pct >= 60 ? "done" : "active" },
    { icon: <WorkspaceIcon name="applications" />, title: "Apply to a project", desc: "Pitch yourself (or create a team) for projects matching your skills.", status: applications.length > 0 ? "done" : pct >= 60 ? "active" : "pending" },
    { icon: <WorkspaceIcon name="tools" />, title: "Build & submit deliverables", desc: "Once selected, build the solution and submit your work before the deadline.", status: submissions.length > 0 ? "done" : selected.length > 0 ? "active" : "pending" },
    { icon: <WorkspaceIcon name="check" />, title: "Client review & approval", desc: "The client evaluates your deliverables and approves the project.", status: submissions.some(s => s.status === "APPROVED") ? "done" : submissions.length > 0 ? "active" : "pending" },
    { icon: <WorkspaceIcon name="certificates" />, title: "Earn verified credentials", desc: "Receive a permanent, publicly verifiable certificate in your name.", status: certificates.length > 0 ? "done" : "pending" },
  ];

  const stats = [
    { label: "Available Projects", value: projects.length, icon: <WorkspaceIcon name="projects" />, color: "#0F2A4A", bg: "linear-gradient(135deg, rgba(15,42,74,0.06) 0%, rgba(15,42,74,0.02) 100%)", border: "rgba(15,42,74,0.12)", tab: "projects" as const, hint: "Open for applications" },
    { label: "Active Applications", value: applications.length, icon: <WorkspaceIcon name="applications" />, color: "#2B6CB0", bg: "linear-gradient(135deg, rgba(49,130,206,0.08) 0%, rgba(49,130,206,0.02) 100%)", border: "rgba(49,130,206,0.2)", tab: "applications" as const, hint: `${pendingApps.length} in review` },
    { label: "Selected Projects", value: selected.length, icon: <WorkspaceIcon name="target" />, color: "#B7791F", bg: "linear-gradient(135deg, rgba(236,201,75,0.14) 0%, rgba(236,201,75,0.04) 100%)", border: "rgba(201,162,39,0.3)", tab: "submissions" as const, hint: awaitingSubmission.length > 0 ? `${awaitingSubmission.length} ready to submit` : "All work submitted" },
    { label: "Earned Certificates", value: certificates.length, icon: <WorkspaceIcon name="certificates" />, color: "#276749", bg: "linear-gradient(135deg, rgba(56,161,105,0.1) 0%, rgba(56,161,105,0.03) 100%)", border: "rgba(56,161,105,0.25)", tab: "certificates" as const, hint: "Verifiable credentials" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0A1D33 0%, #0F2A4A 60%, #15385B 100%)",
          borderRadius: 16,
          padding: "30px 32px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(10,29,51,0.15)",
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
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: "40%",
            width: 220,
            height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(49,130,206,0.12) 0%, transparent 70%)",
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
              Talent Workspace
            </span>
            <VerificationBadge status={profile.verificationStatus} />
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5, lineHeight: 1.2 }}>
            Welcome back, {profile.name} <WorkspaceIcon name="wave" />
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, marginTop: 8, marginBottom: 0, maxWidth: 640, lineHeight: 1.5 }}>
            Work on real-world projects from vetted clients, collaborate in teams, and build a verified portfolio of verifiable certificates.
          </p>

          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Btn
              variant="gold"
              onClick={() => goTo("projects")}
              style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span><WorkspaceIcon name="projects" /></span> Explore Open Projects
            </Btn>
            {awaitingSubmission.length > 0 && (
              <Btn
                variant="success"
                onClick={() => goTo("submissions")}
                style={{ padding: "10px 18px", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <span><WorkspaceIcon name="submissions" /></span> Submit Deliverables ({awaitingSubmission.length})
              </Btn>
            )}
            <Link
              href={`/talents/${profile.id}`}
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
                transition: "all 0.15s",
              }}
            >
              <span><WorkspaceIcon name="profile" /></span> Public Profile ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Verification Notice */}
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
            <span style={{ fontSize: 24 }}>{profile.verificationStatus === "PENDING_REVIEW" ? <WorkspaceIcon name="clock" /> : <WorkspaceIcon name="verification" />}</span>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: profile.verificationStatus === "PENDING_REVIEW" ? "#744210" : "#9B2C2C",
                }}
              >
                {profile.verificationStatus === "PENDING_REVIEW"
                  ? "Identity verification is under review"
                  : "Complete your identity verification"}
              </div>
              <div style={{ fontSize: 13, color: profile.verificationStatus === "PENDING_REVIEW" ? "#97640E" : "#742A2A", marginTop: 2 }}>
                {profile.verificationStatus === "PENDING_REVIEW"
                  ? "An administrator is reviewing your submitted government ID. Decisions are typically made within 24 hours."
                  : "Verified credentials are only issued to confirmed identities. Verify now so approved work converts to certificates immediately."}
              </div>
            </div>
          </div>
          <Btn
            variant={profile.verificationStatus === "PENDING_REVIEW" ? "ghost" : "primary"}
            small
            onClick={() => goTo("verification")}
            style={{ whiteSpace: "nowrap" }}
          >
            {profile.verificationStatus === "PENDING_REVIEW" ? "View status →" : "Verify identity →"}
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

      {/* Selected Projects Urgency Callout */}
      {awaitingSubmission.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(56,161,105,0.12) 0%, rgba(56,161,105,0.04) 100%)",
            border: "1.5px solid rgba(56,161,105,0.4)",
            borderRadius: 14,
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            boxShadow: "0 4px 14px rgba(56,161,105,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 30 }}><WorkspaceIcon name="celebrate" /></span>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "#1C4532", margin: "0 0 4px" }}>
                Selected for {awaitingSubmission.length} project{awaitingSubmission.length > 1 ? "s" : ""} — Ready for Submission!
              </h4>
              <p style={{ fontSize: 13, color: "#276749", margin: 0, lineHeight: 1.4 }}>
                {awaitingSubmission.map(a => a.project.title).join(", ")}. Prepare your GitHub / deployment links and submit before deadline.
              </p>
            </div>
          </div>
          <Btn variant="success" onClick={() => goTo("submissions")} style={{ padding: "10px 20px", fontWeight: 800 }}>
            Submit Deliverables →
          </Btn>
        </div>
      )}

      {/* Two-Column Grid: Profile Readiness & Quick Checklist */}
      <div className="mobile-dashboard-two-col" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20 }}>
        {/* Profile Strength */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", margin: 0 }}><WorkspaceIcon name="chart" /> Profile Strength</h3>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: pct >= 80 ? "var(--success)" : pct >= 50 ? "#97640E" : "var(--ink-subtle)",
                background: pct >= 80 ? "rgba(56,161,105,0.1)" : pct >= 50 ? "rgba(236,201,75,0.2)" : "#EDF2F7",
                padding: "3px 10px",
                borderRadius: 12,
              }}
            >
              {pct >= 80 ? "All-Star" : pct >= 50 ? "Intermediate" : "Getting Started"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
            <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#EDF2F7" strokeWidth="7" />
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="none"
                  stroke={pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--gold)" : "#3182CE"}
                  strokeWidth="7"
                  strokeDasharray={`${(pct / 100) * 188.5} 188.5`}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                  style={{ transition: "stroke-dasharray 0.8s ease" }}
                />
              </svg>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--navy)",
                }}
              >
                {pct}%
              </span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>
                {pct === 100
                  ? "Your profile is fully optimized!"
                  : pct >= 75
                  ? "Nearly complete — standing out to top clients"
                  : "A complete profile gets 3x more acceptances"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4, lineHeight: 1.4 }}>
                Clients review your skills, degree, and portfolio links when choosing applicants.
              </div>
            </div>
          </div>

          <Btn
            variant="ghost"
            style={{ width: "100%", padding: "10px", fontWeight: 700, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}
            onClick={() => goTo("profile")}
          >
            <span><WorkspaceIcon name="edit" /></span> Edit & Enhance Profile
          </Btn>
        </div>

        {/* Profile Checklist */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", margin: 0 }}><WorkspaceIcon name="check" /> Profile Checklist</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-subtle)" }}>
              {items.filter(i => i.done).length} of {items.length} completed
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }} className="mobile-dashboard-project-grid">
            {items.map(item => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: item.done ? "var(--navy)" : "var(--ink-subtle)",
                  fontWeight: item.done ? 600 : 400,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: item.done ? "var(--success)" : "#EDF2F7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: item.done ? "#fff" : "var(--ink-subtle)",
                    flexShrink: 0,
                    fontWeight: 800,
                  }}
                >
                  {item.done ? "✓" : "○"}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Missing items?</span>
            <button
              onClick={() => goTo(items.find(i => !i.done)?.label.includes("Identity") ? "verification" : "profile")}
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
              Complete next step →
            </button>
          </div>
        </div>
      </div>

      {/* Talent Career Pathway Stepper */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          background: "#fff",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", margin: "0 0 4px" }}><WorkspaceIcon name="map" /> Your Talent Journey</h3>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>Follow this clear path to complete real work and earn verified certificates.</p>
        </div>

        <div style={{ position: "relative", paddingLeft: 28 }}>
          <div
            style={{
              position: "absolute",
              left: 11,
              top: 24,
              bottom: 24,
              width: 2,
              background: "linear-gradient(to bottom, var(--success) 0%, var(--border) 100%)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {stages.map((s, i) => {
              const isDone = s.status === "done";
              const isActive = s.status === "active";
              const dotColor = isDone ? "var(--success)" : isActive ? "var(--gold)" : "var(--border)";

              return (
                <div key={i} style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: -24,
                      top: 16,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: dotColor,
                      border: "3px solid #fff",
                      boxShadow: `0 0 0 2px ${dotColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      border: `1.5px solid ${isDone ? "rgba(56,161,105,0.2)" : isActive ? "rgba(201,162,39,0.35)" : "var(--border)"}`,
                      background: isDone
                        ? "linear-gradient(135deg, rgba(56,161,105,0.04) 0%, #fff 100%)"
                        : isActive
                        ? "linear-gradient(135deg, rgba(201,162,39,0.08) 0%, #FFFDF5 100%)"
                        : "#FAFAFA",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{s.icon}</span>
                        <span>{s.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 3 }}>{s.desc}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 12,
                        whiteSpace: "nowrap",
                        background: isDone ? "rgba(56,161,105,0.12)" : isActive ? "rgba(201,162,39,0.18)" : "#EDF2F7",
                        color: isDone ? "var(--success)" : isActive ? "#97640E" : "var(--ink-subtle)",
                      }}
                    >
                      {isDone ? "✓ Completed" : isActive ? "⟳ In Progress" : "○ Upcoming"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Certificates Preview */}
      {certificates.length > 0 && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            background: "#fff",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", margin: "0 0 2px" }}><WorkspaceIcon name="certificates" /> Recent Verified Certificates</h3>
              <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: 0 }}>Permanent proof of your completed projects.</p>
            </div>
            <button
              onClick={() => goTo("certificates")}
              style={{
                background: "none",
                border: "none",
                color: "var(--navy)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              View All ({certificates.length}) →
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {certificates.slice(0, 3).map(c => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: 16,
                  border: "1.5px solid rgba(201,162,39,0.3)",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}><WorkspaceIcon name="certificates" /></span>
                    <StatusBadge status={c.status} />
                  </div>
                  <Link
                    href={`/certificates/${c.certId}`}
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--navy)",
                      textDecoration: "none",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {c.title}
                  </Link>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    Issued by <strong>{c.issuerName}</strong> · {formatDate(c.issuedAt)}
                  </div>
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed rgba(201,162,39,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--ink-subtle)" }}>{c.certId}</span>
                  <Link
                    href={`/certificates/${c.certId}`}
                    style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textDecoration: "underline" }}
                  >
                    Verify Certificate ↗
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
