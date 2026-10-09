"use client";

import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Btn, EmptyState, Notice, SectionHeader, StatusBadge, formatDate } from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import type { ApplicationDto } from "@/lib/types";
import type { TalentTab } from "@/app/talent/dashboard/page";

export function ApplicationsTab({
  applications,
  onChanged,
  goTo,
}: {
  applications: ApplicationDto[];
  onChanged: () => void;
  goTo: (t: TalentTab) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "SELECTED" | "SHORTLISTED" | "PENDING" | "REJECTED" | "WITHDRAWN">("all");

  const counts = useMemo(() => {
    return {
      all: applications.length,
      SELECTED: applications.filter(a => a.status === "SELECTED").length,
      SHORTLISTED: applications.filter(a => a.status === "SHORTLISTED").length,
      PENDING: applications.filter(a => a.status === "PENDING").length,
      REJECTED: applications.filter(a => a.status === "REJECTED").length,
      WITHDRAWN: applications.filter(a => a.status === "WITHDRAWN").length,
    };
  }, [applications]);

  const visible = useMemo(() => {
    if (filter === "all") return applications;
    return applications.filter(a => a.status === filter);
  }, [applications, filter]);

  async function withdraw(id: string) {
    if (
      !confirm(
        "Are you sure you want to withdraw this application? Your team's roster will unfreeze and you can submit a new application while the project remains open."
      )
    )
      return;
    setError(null);
    setBusyId(id);
    const res = await api(`/api/applications/${id}`, "PATCH", { status: "WITHDRAWN" });
    setBusyId(null);
    if (!res.ok) {
      setError(res.error ?? "Could not withdraw application");
      return;
    }
    onChanged();
  }

  return (
    <div>
      <SectionHeader
        icon={<WorkspaceIcon name="applications" />}
        title="My Applications"
        subtitle="Track the status of all your submitted pitches. Once a client selects your application, you can submit deliverables to earn verified credentials."
        action={
          <div style={{ fontSize: 13, color: "var(--ink-muted)", background: "rgba(15,42,74,0.06)", padding: "6px 14px", borderRadius: 20, fontWeight: 700 }}>
            {applications.length} Total Submission{applications.length !== 1 ? "s" : ""}
          </div>
        }
      />

      {error && <Notice kind="error">{error}</Notice>}

      {/* Filter Tabs */}
      {applications.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            marginBottom: 20,
          }}
        >
          {(
            [
              { id: "all", label: "All", count: counts.all },
              { id: "SELECTED", label: "Selected", count: counts.SELECTED },
              { id: "SHORTLISTED", label: "Shortlisted", count: counts.SHORTLISTED },
              { id: "PENDING", label: "Under Review", count: counts.PENDING },
              { id: "REJECTED", label: "Not Selected", count: counts.REJECTED },
              { id: "WITHDRAWN", label: "Withdrawn", count: counts.WITHDRAWN },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                border: filter === tab.id ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                background: filter === tab.id ? "var(--navy)" : "#fff",
                color: filter === tab.id ? "#fff" : "var(--ink-muted)",
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
                  background: filter === tab.id ? "rgba(255,255,255,0.25)" : "#EDF2F7",
                  color: filter === tab.id ? "#fff" : "var(--ink-subtle)",
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {applications.length === 0 ? (
        <EmptyState
          icon={<WorkspaceIcon name="mail" />}
          title="No applications submitted yet"
          hint="Browse open projects from clients, pick one that matches your skills, and send a compelling pitch."
          action={
            <Btn variant="primary" onClick={() => goTo("projects")}>
              Browse Open Projects →
            </Btn>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<WorkspaceIcon name="projects" />}
          title="No applications in this category"
          hint="Try switching to another filter tab."
          action={
            <Btn variant="ghost" small onClick={() => setFilter("all")}>
              View All Applications
            </Btn>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visible.map(app => {
            const isSelected = app.status === "SELECTED";
            const canWithdraw = app.status === "PENDING" || app.status === "SHORTLISTED";

            return (
              <div
                key={app.id}
                style={{
                  background: "#fff",
                  border: isSelected ? "1.5px solid rgba(56,161,105,0.4)" : "1px solid var(--border)",
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
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", margin: "0 0 4px" }}>
                      <Link href={`/projects/${app.project.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {app.project.title}
                      </Link>
                    </h4>
                    <div style={{ fontSize: 13, color: "var(--ink-muted)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span>Client: <strong>{app.project.client?.name ?? "Client"}</strong></span>
                      <span>•</span>
                      <span>Team: &ldquo;{app.team.name}&rdquo;</span>
                      <span>•</span>
                      <span>Applied {formatDate(app.createdAt)}</span>
                    </div>
                  </div>

                  <StatusBadge status={app.status} />
                </div>

                {/* Pitch Quote Box */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid var(--border)",
                    borderLeft: "4px solid var(--navy)",
                    borderRadius: "0 10px 10px 0",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase", marginBottom: 4 }}>
                    Your Submitted Pitch
                  </div>
                  <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {app.pitch}
                  </p>
                </div>

                {/* Selected Callout Banner */}
                {isSelected && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(56,161,105,0.1) 0%, rgba(56,161,105,0.03) 100%)",
                      border: "1px solid rgba(56,161,105,0.3)",
                      borderRadius: 12,
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#276749" }}><WorkspaceIcon name="celebrate" /> You were selected for this project!</div>
                      <div style={{ fontSize: 12, color: "#2F855A", marginTop: 2 }}>
                        Build the required deliverables and submit before the deadline to earn your verified certificate.
                      </div>
                    </div>
                    <Btn variant="success" small onClick={() => goTo("submissions")}>
                      Go to Submissions →
                    </Btn>
                  </div>
                )}

                {/* Footer Actions */}
                {canWithdraw && (
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    <Btn
                      variant="outline"
                      small
                      disabled={busyId === app.id}
                      onClick={() => withdraw(app.id)}
                    >
                      {busyId === app.id ? "Withdrawing…" : "Withdraw Application"}
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
