"use client";

import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Btn,
  EmptyState,
  Notice,
  SectionHeader,
  SkillChips,
  StatusBadge,
  formatDate,
  inputStyle,
} from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import { PROJECT_CATEGORY_LABEL } from "@/lib/enums";
import type { ApplicationDto, ProjectDto } from "@/lib/types";
import type { ClientTab } from "@/app/client/dashboard/page";
import { EditProjectModal } from "@/components/client/EditProjectModal";
import { PlanRequiredModal } from "@/components/client/PlanRequiredModal";

export function ProjectsTab({
  projects,
  applications,
  goTo,
  onChanged,
  verified,
  features,
}: {
  projects: ProjectDto[];
  applications: ApplicationDto[];
  goTo: (t: ClientTab) => void;
  onChanged: () => void;
  verified: boolean;
  features?: { analytics: boolean; featured: boolean };
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "DRAFT" | "PAUSED" | "CLOSED">("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProjectDto | null>(null);
  const [planModal, setPlanModal] = useState<"PLAN_REQUIRED" | "LIMIT_REACHED" | null>(null);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter(p => {
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchSearch =
        !needle ||
        p.title.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle) ||
        p.requiredSkills.some(s => s.toLowerCase().includes(needle));

      return matchStatus && matchSearch;
    });
  }, [projects, q, statusFilter]);

  async function toggleFeatured(p: ProjectDto) {
    setError(null);
    setBusyId(p.id);
    const res = await api(`/api/projects/${p.id}`, "PATCH", { featured: !p.featured });
    setBusyId(null);
    if (!res.ok) {
      if (res.code === "PLAN_REQUIRED") setPlanModal("PLAN_REQUIRED");
      else setError(res.error ?? "Could not update project");
      return;
    }
    onChanged();
  }

  async function setStatus(id: string, status: "ACTIVE" | "PAUSED" | "CLOSED") {
    if (
      status === "CLOSED" &&
      !confirm("Are you sure you want to close this project? Talent will no longer be able to apply or submit deliverables.")
    )
      return;
    setError(null);
    setBusyId(id);
    const res = await api<unknown>(`/api/projects/${id}`, "PATCH", { status });
    setBusyId(null);
    if (!res.ok) {
      if (res.code === "PLAN_REQUIRED" || res.code === "LIMIT_REACHED") {
        setPlanModal(res.code);
        return;
      }
      setError(res.error ?? "Could not update project status");
      return;
    }
    onChanged();
  }

  return (
    <div>
      <SectionHeader
        icon={<WorkspaceIcon name="rocket" />}
        title="My Projects"
        subtitle="Manage your posted projects, review candidate application counts, pause or resume listings, and track deliverables."
        action={
          <Btn variant="gold" onClick={() => goTo("post-project")} style={{ fontWeight: 800 }}>
            + Post a New Project
          </Btn>
        }
      />

      {error && <Notice kind="error">{error}</Notice>}
      {editing && <EditProjectModal project={editing} onClose={() => setEditing(null)} onSaved={onChanged} />}
      {planModal && <PlanRequiredModal reason={planModal} onClose={() => setPlanModal(null)} />}

      {/* Filter and Search Bar */}
      {projects.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 260px" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--ink-subtle)",
                  fontSize: 14,
                  pointerEvents: "none",
                }}
              >
                <WorkspaceIcon name="projects" />
              </span>
              <input
                id="client-proj-search"
                value={q}
                onChange={e => setQ(e.target.value)}
                style={{ ...inputStyle(), paddingLeft: 34 }}
                placeholder="Search projects by title, description or skills…"
              />
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-subtle)", marginRight: 4 }}>Status:</span>
            {(
              [
                { id: "all", label: `All (${projects.length})` },
                { id: "ACTIVE", label: `Active (${projects.filter(p => p.status === "ACTIVE").length})` },
                { id: "DRAFT", label: `Drafts (${projects.filter(p => p.status === "DRAFT").length})` },
                { id: "PAUSED", label: `Paused (${projects.filter(p => p.status === "PAUSED").length})` },
                { id: "CLOSED", label: `Closed (${projects.filter(p => p.status === "CLOSED").length})` },
              ] as const
            ).map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: statusFilter === f.id ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                  background: statusFilter === f.id ? "var(--navy)" : "#FAFAFA",
                  color: statusFilter === f.id ? "#fff" : "var(--ink-muted)",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Projects List or Empty State */}
      {projects.length === 0 ? (
        <EmptyState
          icon={<WorkspaceIcon name="mail" />}
          title="No projects created yet"
          hint="Post your first project challenge to receive pitches from vetted developers and designers."
          action={
            <Btn variant="gold" onClick={() => goTo("post-project")} style={{ fontWeight: 800 }}>
              + Post Your First Project
            </Btn>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<WorkspaceIcon name="projects" />}
          title="No projects match your filter"
          hint="Try resetting your search query or selecting a different status filter."
          action={
            <Btn
              variant="ghost"
              small
              onClick={() => {
                setQ("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Btn>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visible.map(p => {
            const apps = applications.filter(a => a.projectId === p.id);
            const busy = busyId === p.id;

            return (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: p.featured ? "1.5px solid rgba(201,162,39,0.5)" : "1px solid var(--border)",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          color: "var(--gold)",
                          textTransform: "uppercase",
                          background: "rgba(201,162,39,0.12)",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {PROJECT_CATEGORY_LABEL[p.category]}
                      </span>
                      {p.featured && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "var(--navy)",
                            background: "var(--gold)",
                            padding: "2px 8px",
                            borderRadius: 6,
                            textTransform: "uppercase",
                          }}
                        >
                          Featured
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", margin: "4px 0 6px" }}>
                      <Link href={`/projects/${p.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {p.title}
                      </Link>
                    </h4>

                    <SkillChips skills={p.requiredSkills} />
                  </div>

                  {/* Actions Group */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <StatusBadge status={p.status} />

                    {p.status === "ACTIVE" && features?.featured && (
                      <Btn variant="ghost" small disabled={busy} onClick={() => toggleFeatured(p)}>
                        {p.featured ? "Unfeature" : "Feature"}
                      </Btn>
                    )}

                    {p.status === "DRAFT" && (
                      verified ? (
                        <Btn variant="gold" small disabled={busy} onClick={() => setStatus(p.id, "ACTIVE")}>
                          <WorkspaceIcon name="rocket" /> Publish
                        </Btn>
                      ) : (
                        <button
                          onClick={() => goTo("verification")}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#97640E",
                            background: "rgba(236,201,75,0.18)",
                            border: "none",
                            borderRadius: 8,
                            padding: "6px 12px",
                            cursor: "pointer",
                          }}
                        >
                          Verify to publish
                        </button>
                      )
                    )}

                    {(p.status === "ACTIVE" || p.status === "PAUSED" || p.status === "DRAFT") && (
                      <Btn variant="ghost" small disabled={busy} onClick={() => setEditing(p)}>
                        <WorkspaceIcon name="edit" /> Edit
                      </Btn>
                    )}

                    {p.status === "ACTIVE" && (
                      <Btn variant="ghost" small disabled={busy} onClick={() => setStatus(p.id, "PAUSED")}>
                        <WorkspaceIcon name="pause" /> Pause
                      </Btn>
                    )}

                    {p.status === "PAUSED" && (
                      <Btn variant="ghost" small disabled={busy} onClick={() => setStatus(p.id, "ACTIVE")}>
                        <WorkspaceIcon name="play" /> Resume
                      </Btn>
                    )}

                    {(p.status === "ACTIVE" || p.status === "PAUSED") && (
                      <Btn variant="outline" small disabled={busy} onClick={() => setStatus(p.id, "CLOSED")}>
                        Close
                      </Btn>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: 0, lineHeight: 1.6 }}>
                  {p.description}
                </p>

                {/* Footer Metadata & Analytics */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    borderTop: "1px solid var(--border)",
                    paddingTop: 12,
                    fontSize: 12,
                    color: "var(--ink-subtle)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span><WorkspaceIcon name="calendar" /> Due <strong>{formatDate(p.deadline)}</strong></span>
                    {p.status === "CLOSED" && p.closedAt && <span>· Closed {formatDate(p.closedAt)}</span>}
                    <span>· {p.teamCap > 1 ? `Teams up to ${p.teamCap}` : "Solo applicants"}</span>
                    <span>· Posted {formatDate(p.createdAt)}</span>
                    {features?.analytics && p.status !== "DRAFT" && (
                      <span>
                        · <WorkspaceIcon name="eye" /> <strong>{p.viewCount ?? 0}</strong> views · <strong>{p._count?.applications ?? 0}</strong> applied
                        {(p.viewCount ?? 0) > 0 ? ` (${Math.round(((p._count?.applications ?? 0) / (p.viewCount ?? 1)) * 100)}% conversion)` : ""}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => goTo("applications")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--navy)",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Applications ({apps.length}) →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
