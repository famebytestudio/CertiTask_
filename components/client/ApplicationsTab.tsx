"use client";

import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Btn,
  EmptyState,
  Notice,
  SectionHeader,
  StatusBadge,
  VerificationBadge,
  formatDate,
  selectStyle,
} from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import type { ApplicationDto, ProjectDto } from "@/lib/types";
import type { ClientTab } from "@/app/client/dashboard/page";

export function ApplicationsTab({
  applications,
  projects,
  onChanged,
  filtersEnabled,
  goTo,
}: {
  applications: ApplicationDto[];
  projects: ProjectDto[];
  onChanged: () => void;
  filtersEnabled?: boolean;
  goTo?: (t: ClientTab) => void;
}) {
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minTeam, setMinTeam] = useState(1);
  const [filter, setFilter] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<"all" | "PENDING" | "SHORTLISTED" | "SELECTED" | "REJECTED">("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      all: applications.length,
      PENDING: applications.filter(a => a.status === "PENDING").length,
      SHORTLISTED: applications.filter(a => a.status === "SHORTLISTED").length,
      SELECTED: applications.filter(a => a.status === "SELECTED").length,
      REJECTED: applications.filter(a => a.status === "REJECTED").length,
    };
  }, [applications]);

  const visible = useMemo(() => {
    return applications.filter(a => {
      if (filter !== "all" && a.projectId !== filter) return false;
      if (statusTab !== "all" && a.status !== statusTab) return false;

      if (!filtersEnabled) return true;
      const members = a.team.members.filter(m => m.status === "ACCEPTED");
      if (verifiedOnly && !members.every(m => m.user.verificationStatus === "VERIFIED")) return false;
      if (members.length < minTeam) return false;
      return true;
    });
  }, [applications, filter, statusTab, filtersEnabled, verifiedOnly, minTeam]);

  async function decide(id: string, status: "SHORTLISTED" | "SELECTED" | "REJECTED") {
    setError(null);
    setBusyId(id);
    const res = await api(`/api/applications/${id}`, "PATCH", { status });
    setBusyId(null);
    if (!res.ok) {
      setError(res.error ?? "Could not update application status");
      return;
    }
    onChanged();
  }

  return (
    <div>
      <SectionHeader
        icon={<WorkspaceIcon name="applications" />}
        title="Candidate Applications"
        subtitle="Review pitches from talent and teams, evaluate verified member profiles, and select the winning team to build your project."
        action={
          projects.length > 1 ? (
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ ...selectStyle(), width: "auto", minWidth: 220 }}
              aria-label="Filter by project"
            >
              <option value="all">All Projects ({applications.length})</option>
              {projects.map(p => {
                const pApps = applications.filter(a => a.projectId === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.title} ({pApps})
                  </option>
                );
              })}
            </select>
          ) : undefined
        }
      />

      {error && <Notice kind="error">{error}</Notice>}

      {/* Status Filter Tabs */}
      {applications.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
          {(
            [
              { id: "all", label: "All Applications", count: counts.all },
              { id: "PENDING", label: "Pending Review", count: counts.PENDING },
              { id: "SHORTLISTED", label: "Shortlisted", count: counts.SHORTLISTED },
              { id: "SELECTED", label: "Selected", count: counts.SELECTED },
              { id: "REJECTED", label: "Rejected", count: counts.REJECTED },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                border: statusTab === tab.id ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                background: statusTab === tab.id ? "var(--navy)" : "#fff",
                color: statusTab === tab.id ? "#fff" : "var(--ink-muted)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: statusTab === tab.id ? "rgba(255,255,255,0.25)" : "#EDF2F7",
                  color: statusTab === tab.id ? "#fff" : "var(--ink-subtle)",
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Advanced Applicant Filters (Growth / Pro Plan) */}
      {filtersEnabled ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            padding: "12px 16px",
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "#FAFAFA",
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <WorkspaceIcon name="bolt" /> Advanced Filters:
          </span>

          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600, color: "var(--navy)" }}>
            <input
              id="f-verified-only"
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              style={{ accentColor: "var(--navy)" }}
            />
            All members verified
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-muted)" }}>
            Min team size:
            <input
              id="f-min-team"
              type="number"
              min={1}
              max={20}
              value={minTeam}
              onChange={e => setMinTeam(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: 55, padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 6, background: "#fff" }}
            />
          </label>

        </div>
      ) : (
        <div
          style={{
            padding: "12px 16px",
            border: "1px dashed var(--border)",
            borderRadius: 12,
            background: "#F8FAFC",
            marginBottom: 20,
            fontSize: 12,
            color: "var(--ink-muted)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span><WorkspaceIcon name="sparkles" /> <strong>Growth &amp; Pro Feature:</strong> Filter applicants by verified ID status and team size threshold.</span>
          {goTo && (
            <button
              onClick={() => goTo("billing")}
              style={{ fontSize: 12, fontWeight: 800, color: "var(--navy)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Upgrade Plan →
            </button>
          )}
        </div>
      )}

      {/* Applications List */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<WorkspaceIcon name="mail" />}
          title="No candidate applications found"
          hint={applications.length === 0 ? "Applications will appear here as soon as talent pitches for your active projects." : "Try adjusting your active project filter or search criteria."}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visible.map(app => {
            const members = app.team.members.filter(m => m.status === "ACCEPTED");
            const busy = busyId === app.id;
            const decided = app.status === "SELECTED" || app.status === "REJECTED" || app.status === "WITHDRAWN";

            return (
              <div
                key={app.id}
                style={{
                  background: "#fff",
                  border: app.status === "SELECTED" ? "1.5px solid rgba(56,161,105,0.4)" : "1px solid var(--border)",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>
                      Project: {app.project.title}
                    </span>
                    <h4 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", margin: "4px 0 2px" }}>
                      {app.team.name}
                    </h4>
                    <div style={{ fontSize: 12, color: "var(--ink-subtle)" }}>
                      Applied {formatDate(app.createdAt)} · {members.length} confirmed member{members.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <StatusBadge status={app.status} />
                </div>

                {/* Team Roster */}
                <div style={{ background: "#FAFAFA", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-subtle)", textTransform: "uppercase", marginBottom: 8 }}>
                    Applicant Roster
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {members.map(m => (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 13,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: m.role === "LEAD" ? "var(--navy)" : "#EDF2F7",
                            color: m.role === "LEAD" ? "var(--gold)" : "var(--navy)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {m.user.name.charAt(0).toUpperCase()}
                        </div>
                        <Link
                          href={`/talents/${m.user.id}`}
                          target="_blank"
                          style={{ fontWeight: 700, color: "var(--navy)", textDecoration: "none" }}
                        >
                          {m.user.name} ↗
                        </Link>
                        <span style={{ fontSize: 11, color: "var(--ink-subtle)" }}>
                          ({m.role === "LEAD" ? "Lead" : "Member"})
                        </span>
                        <VerificationBadge status={m.user.verificationStatus} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pitch Block */}
                <div
                  style={{
                    padding: "14px 18px",
                    background: "#F8FAFC",
                    borderRadius: 12,
                    borderLeft: "4px solid var(--navy)",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-subtle)", textTransform: "uppercase", marginBottom: 4 }}>
                    Applicant Pitch &amp; Proposal
                  </div>
                  <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {app.pitch}
                  </p>
                </div>

                {/* Decision Actions */}
                {!decided && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    <Btn
                      variant="success"
                      disabled={busy}
                      onClick={() => decide(app.id, "SELECTED")}
                      style={{ padding: "8px 18px", fontWeight: 800 }}
                    >
                      ✓ Select this Team
                    </Btn>

                    {app.status !== "SHORTLISTED" && (
                      <Btn
                        disabled={busy}
                        style={{ background: "#3182CE", padding: "8px 16px", fontWeight: 700 }}
                        onClick={() => decide(app.id, "SHORTLISTED")}
                      >
                        <WorkspaceIcon name="star" /> Shortlist
                      </Btn>
                    )}

                    <Btn
                      variant="outline"
                      disabled={busy}
                      onClick={() => decide(app.id, "REJECTED")}
                      style={{ padding: "8px 16px" }}
                    >
                      Decline
                    </Btn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
