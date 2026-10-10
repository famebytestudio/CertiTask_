"use client";

import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Btn,
  EmptyState,
  Field,
  Modal,
  Notice,
  SectionHeader,
  SkillChips,
  VerificationBadge,
  daysUntil,
  formatDate,
  inputStyle,
  selectStyle,
  textareaStyle,
} from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABEL, CLIENT_TYPE_LABEL } from "@/lib/enums";
import type { ApplicationDto, ProjectDto, SubmissionDto, TeamFullDto } from "@/lib/types";
import type { TalentTab } from "@/app/talent/dashboard/page";
import { PlanRequiredModal } from "@/components/client/PlanRequiredModal";

export function ProjectsTab({
  projects,
  applications,
  submissions,
  teams,
  onChanged,
  goTo,
}: {
  projects: ProjectDto[];
  applications: ApplicationDto[];
  submissions: SubmissionDto[];
  teams: TeamFullDto[];
  onChanged: () => void;
  goTo: (t: TalentTab) => void;
}) {
  const params = useSearchParams();
  const applyParam = params.get("apply");
  const [choice, setChoice] = useState<ProjectDto | null>(() => {
    if (!applyParam) return null;
    const p = projects.find(x => x.id === applyParam);
    const taken =
      applications.some(a => a.projectId === applyParam && a.status !== "WITHDRAWN") ||
      teams.some(t => t.projectId === applyParam && !t.application);
    return p && !taken ? p : null;
  });
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [filterMode, setFilterMode] = useState<"all" | "teams" | "solo" | "urgent">("all");
  const [applying, setApplying] = useState<ProjectDto | null>(null);
  const [form, setForm] = useState({ teamName: "", pitch: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planModal, setPlanModal] = useState<"PLAN_REQUIRED" | "LIMIT_REACHED" | null>(null);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter(p => {
      const matchCat = category === "all" || p.category === category;
      const matchSearch =
        !needle ||
        p.title.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle) ||
        p.requiredSkills.some(s => s.toLowerCase().includes(needle)) ||
        p.client?.name.toLowerCase().includes(needle);

      const days = daysUntil(p.deadline);
      let matchMode = true;
      if (filterMode === "teams") matchMode = p.teamCap > 1;
      else if (filterMode === "solo") matchMode = p.teamCap === 1;
      else if (filterMode === "urgent") matchMode = days >= 0 && days <= 3;

      return matchCat && matchSearch && matchMode;
    });
  }, [projects, q, category, filterMode]);

  function appFor(projectId: string) {
    return applications.find(a => a.projectId === projectId && a.status !== "WITHDRAWN");
  }
  function teamFor(projectId: string) {
    return teams.find(t => t.projectId === projectId && !t.application);
  }

  function startApply(p: ProjectDto) {
    if (p.teamCap > 1) {
      setChoice(p);
      return;
    }
    setApplying(p);
    setForm({ teamName: "", pitch: "" });
    setError(null);
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!choice) return;
    setCreating(true);
    setError(null);
    const r = await api("/api/teams", "POST", { projectId: choice.id, name: teamName });
    setCreating(false);
    if (!r.ok) {
      setError(r.error ?? "Could not create team");
      return;
    }
    setChoice(null);
    setTeamName("");
    onChanged();
    goTo("teams");
  }

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!applying) return;
    setBusy(true);
    setError(null);
    const res = await api("/api/applications", "POST", { projectId: applying.id, ...form });
    setBusy(false);
    if (!res.ok) {
      if (res.code === "PLAN_REQUIRED" || res.code === "LIMIT_REACHED") {
        setPlanModal(res.code);
        return;
      }
      setError(res.error ?? "Could not apply");
      return;
    }
    setApplying(null);
    setForm({ teamName: "", pitch: "" });
    onChanged();
    goTo("applications");
  }

  return (
    <div>
      <SectionHeader
        icon={<WorkspaceIcon name="projects" />}
        title="Find Projects"
        subtitle="Explore real-world client projects. Apply as an individual or form a team to collaborate and earn verified certificates."
        action={
          <div style={{ fontSize: 13, color: "var(--ink-muted)", background: "rgba(15,42,74,0.06)", padding: "6px 14px", borderRadius: 20, fontWeight: 700 }}>
            {projects.length} Open Project{projects.length !== 1 ? "s" : ""}
          </div>
        }
      />

      {/* Filter and Search Bar */}
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
          <div style={{ position: "relative", flex: "1 1 280px" }}>
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
              id="proj-search"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ ...inputStyle(), paddingLeft: 34 }}
              placeholder="Search by title, required skills, or client name…"
              aria-label="Search projects"
            />
          </div>

          <select
            id="proj-cat"
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ ...selectStyle(), width: "auto", minWidth: 200, cursor: "pointer" }}
            aria-label="Filter by category"
          >
            <option value="all">All Categories ({projects.length})</option>
            {PROJECT_CATEGORIES.map(c => {
              const count = projects.filter(p => p.category === c).length;
              return (
                <option key={c} value={c}>
                  {PROJECT_CATEGORY_LABEL[c]} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Quick Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-subtle)", marginRight: 4 }}>Quick Filters:</span>
          {(
            [
              { id: "all", label: "All Projects" },
              { id: "teams", label: "Team Projects" },
              { id: "solo", label: "Solo Only" },
              { id: "urgent", label: "Closing Soon (≤3d)" },
            ] as const
          ).map(f => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: filterMode === f.id ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                background: filterMode === f.id ? "var(--navy)" : "#FAFAFA",
                color: filterMode === f.id ? "#fff" : "var(--ink-muted)",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
          {(q || category !== "all" || filterMode !== "all") && (
            <button
              onClick={() => {
                setQ("");
                setCategory("all");
                setFilterMode("all");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#9B2C2C",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 8px",
                marginLeft: "auto",
              }}
            >
              Reset Filters ✕
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<WorkspaceIcon name="mail" />}
          title={projects.length === 0 ? "No open projects right now" : "No projects match your search criteria"}
          hint={
            projects.length === 0
              ? "New client projects are posted regularly. Check back soon or ensure your profile is up to date."
              : "Try adjusting your search terms or clearing the selected category filter."
          }
          action={
            (q || category !== "all" || filterMode !== "all") && (
              <Btn
                variant="ghost"
                onClick={() => {
                  setQ("");
                  setCategory("all");
                  setFilterMode("all");
                }}
              >
                Clear all filters
              </Btn>
            )
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visible.map(p => {
            const app = appFor(p.id);
            const sub = app ? submissions.find(s => s.teamId === app.teamId) : undefined;
            const days = daysUntil(p.deadline);
            const isUrgent = days >= 0 && days <= 3;
            const isClosed = days < 0;

            return (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: p.featured ? "1.5px solid rgba(201,162,39,0.5)" : "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "22px 24px",
                  boxShadow: "var(--shadow-sm)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
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
                            background: "linear-gradient(135deg, #F1E3B4 0%, #C9A227 100%)",
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

                    {p.client && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Link href={`/clients/${p.client.id}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", textDecoration: "none" }}>
                          <WorkspaceIcon name="building" /> {p.client.name}
                        </Link>
                        {p.client.clientType && (
                          <span style={{ fontSize: 11, color: "var(--ink-subtle)", background: "#EDF2F7", padding: "1px 6px", borderRadius: 4 }}>
                            {CLIENT_TYPE_LABEL[p.client.clientType]}
                          </span>
                        )}
                        <VerificationBadge status={p.client.verificationStatus} />
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: isUrgent ? 800 : 600,
                      color: isClosed ? "var(--ink-subtle)" : isUrgent ? "#9B2C2C" : "var(--navy)",
                      background: isClosed ? "#EDF2F7" : isUrgent ? "rgba(229,62,62,0.1)" : "rgba(15,42,74,0.06)",
                      padding: "4px 12px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span><WorkspaceIcon name="calendar" /></span>
                    <span>
                      {isClosed ? "Deadline passed" : `Due ${formatDate(p.deadline)} (${days} day${days !== 1 ? "s" : ""} left)`}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: "0 0 14px", lineHeight: 1.6 }}>{p.description}</p>

                {/* Required Skills */}
                <div style={{ marginBottom: 16 }}>
                  <SkillChips skills={p.requiredSkills} />
                </div>

                {/* Footer Controls */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    paddingTop: 14,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--ink-subtle)", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                      <span><WorkspaceIcon name="teams" /></span> {p.teamCap > 1 ? `Teams of up to ${p.teamCap}` : "Individual applicants only"}
                    </span>
                    <span>•</span>
                    <span>{p._count?.applications ?? 0} applied</span>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Link
                      href={`/projects/${p.id}`}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--navy)",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        textDecoration: "none",
                      }}
                    >
                      Details ↗
                    </Link>

                    {sub && sub.status !== "REJECTED" ? (
                      <Btn variant="ghost" small onClick={() => goTo("submissions")}>
                        View Submission
                      </Btn>
                    ) : app?.status === "SELECTED" ? (
                      <Btn variant="success" onClick={() => goTo("submissions")}>
                        <WorkspaceIcon name="submissions" /> Submit Deliverables
                      </Btn>
                    ) : app ? (
                      <Btn variant="ghost" disabled>
                        {app.status === "REJECTED"
                          ? "Not selected"
                          : app.status === "SHORTLISTED"
                          ? "Shortlisted ✓"
                          : "Application pending"}
                      </Btn>
                    ) : teamFor(p.id) ? (
                      <Btn variant="gold" onClick={() => goTo("teams")}>
                        <WorkspaceIcon name="teams" /> Continue with Your Team
                      </Btn>
                    ) : (
                      <Btn variant="primary" onClick={() => startApply(p)}>
                        Apply Now →
                      </Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Choice Modal: Solo vs Build Team */}
      {choice && (
        <Modal
          title={`Apply to ${choice.title}`}
          subtitle={`${choice.client?.name ?? "Client"} · Supports teams of up to ${choice.teamCap}. Apply solo, or assemble a team with friends — all members earn verified certificates on completion.`}
          onClose={() => setChoice(null)}
          maxWidth={560}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }} className="mobile-dashboard-form-grid">
            <button
              onClick={() => {
                const p = choice;
                setChoice(null);
                setApplying(p);
                setForm({ teamName: "", pitch: "" });
                setError(null);
              }}
              style={{
                textAlign: "left",
                padding: 18,
                border: "1.5px solid var(--border)",
                borderRadius: 14,
                background: "#FAFAFA",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--navy)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div>
                <div style={{ fontSize: 24, marginBottom: 8 }}><WorkspaceIcon name="profile" /></div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>Apply Solo</div>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4, lineHeight: 1.4 }}>
                  Apply as an individual applicant. Fast, direct submission.
                </div>
              </div>
              <span style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: "var(--navy)" }}>Proceed Solo →</span>
            </button>

            <div
              style={{
                padding: 18,
                border: "1.5px solid var(--gold)",
                borderRadius: 14,
                background: "linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 24, marginBottom: 8 }}><WorkspaceIcon name="teams" /></div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>Build a Team</div>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", margin: "4px 0 12px", lineHeight: 1.4 }}>
                  Create your team workspace, invite collaborators via email, and apply together.
                </div>
              </div>

              <form onSubmit={createTeam} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  id="team-name"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  style={{ ...inputStyle(), padding: "8px 12px", fontSize: 13 }}
                  placeholder="Enter team name"
                  maxLength={100}
                  required
                />
                <Btn type="submit" variant="gold" small disabled={creating}>
                  {creating ? "Creating Team…" : "Create & Build Team →"}
                </Btn>
              </form>
            </div>
          </div>
          {error && <Notice kind="error">{error}</Notice>}
        </Modal>
      )}

      {/* Solo Application Form Modal */}
      {applying && (
        <Modal
          title={`Apply to ${applying.title}`}
          subtitle={`${applying.client?.name ?? "Client"} · Due ${formatDate(applying.deadline)}. You are applying as an individual.`}
          onClose={() => setApplying(null)}
          maxWidth={540}
        >
          <form onSubmit={apply} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Applicant Display Name" required hint="How the client will see your application name.">
              <input
                id="apply-team"
                value={form.teamName}
                onChange={e => setForm({ ...form, teamName: e.target.value })}
                style={inputStyle()}
                placeholder="e.g. Ayesha Khan"
                maxLength={100}
                required
                autoFocus
              />
            </Field>

            <Field
              label="Your Pitch & Approach"
              required
              hint="Explain why you are the best fit, highlight relevant previous work or portfolio links, and describe your planned timeline."
            >
              <textarea
                id="apply-pitch"
                value={form.pitch}
                onChange={e => setForm({ ...form, pitch: e.target.value })}
                rows={5}
                style={textareaStyle()}
                placeholder="Hi! I have built similar systems using React and TypeScript. My approach would be..."
                required
              />
            </Field>

            {error && <Notice kind="error">{error}</Notice>}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Btn type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setApplying(null)}>
                Cancel
              </Btn>
              <Btn type="submit" variant="primary" style={{ flex: 2 }} disabled={busy}>
                {busy ? "Sending Application…" : "Submit Application →"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {planModal && <PlanRequiredModal reason={planModal} audience="talent" onClose={() => setPlanModal(null)} />}
    </div>
  );
}
