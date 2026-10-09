"use client";

import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

import { useMemo, useState } from "react";
import {
  Btn,
  Field,
  Notice,
  SectionHeader,
  SkillChips,
  inputStyle,
  selectStyle,
  textareaStyle,
} from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import {
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_LABEL,
  TEAM_CAP_DEFAULT,
  TEAM_CAP_MAX,
  TEAM_CAP_MIN,
  type ProjectCategory,
} from "@/lib/enums";
import { PlanRequiredModal } from "@/components/client/PlanRequiredModal";

const EMPTY = {
  title: "",
  description: "",
  category: "" as ProjectCategory | "",
  requiredSkills: "",
  deliverables: "",
  deadline: "",
  teamCap: TEAM_CAP_DEFAULT,
  draft: false,
};

export function PostProjectTab({
  clientName,
  onCreated,
  verified,
  billing,
}: {
  clientName: string;
  onCreated: () => void;
  verified: boolean;
  billing?: {
    canPost: boolean;
    reason: string;
    freePostsLeft: number;
    postsLeftInPeriod: number | null;
  };
}) {
  const [planModal, setPlanModal] = useState<"PLAN_REQUIRED" | "LIMIT_REACHED" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [minDate] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));

  const parsedSkills = useMemo(() => {
    return form.requiredSkills
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }, [form.requiredSkills]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await api<{ notice?: string | null; billing?: string }>("/api/projects", "POST", form);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not create the project");
      return;
    }
    setForm(EMPTY);
    if (res.data?.billing === "PLAN_REQUIRED" || res.data?.billing === "LIMIT_REACHED") {
      setPlanModal(res.data.billing);
      return;
    }
    if (res.data?.notice) alert(res.data.notice);
    onCreated();
  }

  return (
    <div>
      <SectionHeader
        icon={<WorkspaceIcon name="post" />}
        title="Post a New Project"
        subtitle="Define project requirements, deliverables, and skill sets. Verified talent and teams will submit pitches to collaborate with you."
      />

      {/* Plan and Verification Status Notices */}
      {!verified && (
        <Notice kind="warning">
          Your organization is not yet verified. This project will be saved as a <strong>draft</strong> and can be published immediately once your identity/organization verification is approved.
        </Notice>
      )}

      {verified && billing && !billing.canPost && (
        <Notice kind="warning">
          {billing.reason === "LIMIT_REACHED"
            ? "Your plan's posting quota for this billing period is reached. This project will be saved as a draft until you upgrade or renew."
            : "You have used your free project posts. This project will be saved as a draft until you select a plan."}
        </Notice>
      )}

      {verified && billing?.canPost && (
        <Notice kind="info">
          {billing.reason === "FREE"
            ? `Publishing uses 1 of your ${billing.freePostsLeft} remaining free post${billing.freePostsLeft === 1 ? "" : "s"}.`
            : billing.postsLeftInPeriod === null
            ? "Your subscription includes unlimited project postings."
            : `Publishing uses 1 of ${billing.postsLeftInPeriod} post${billing.postsLeftInPeriod === 1 ? "" : "s"} remaining in this period.`}
        </Notice>
      )}

      {planModal && (
        <PlanRequiredModal
          reason={planModal}
          onClose={() => {
            setPlanModal(null);
            onCreated();
          }}
        />
      )}

      <div style={{ height: 16 }} />

      <div className="mobile-dashboard-two-col" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Form Container */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section 1: Overview */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
              <WorkspaceIcon name="applications" /> Project Overview
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Project Title" required hint="Clear, concise headline describing the challenge or system to build">
                <input
                  id="proj-title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  style={inputStyle()}
                  placeholder="e.g. AI-Powered Customer Support Portal"
                  maxLength={200}
                  required
                />
              </Field>

              <div className="mobile-dashboard-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Category" required>
                  <select
                    id="proj-category"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as ProjectCategory })}
                    style={selectStyle()}
                    required
                  >
                    <option value="">Select Category</option>
                    {PROJECT_CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {PROJECT_CATEGORY_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Team Capacity"
                  required
                  hint={`Max teammates (${TEAM_CAP_MIN}–${TEAM_CAP_MAX}). Set to 1 for solo.`}
                >
                  <input
                    id="proj-teamcap"
                    type="number"
                    min={TEAM_CAP_MIN}
                    max={TEAM_CAP_MAX}
                    value={form.teamCap}
                    onChange={e =>
                      setForm({
                        ...form,
                        teamCap: Math.max(TEAM_CAP_MIN, Math.min(TEAM_CAP_MAX, parseInt(e.target.value) || TEAM_CAP_MIN)),
                      })
                    }
                    style={inputStyle()}
                    required
                  />
                </Field>
              </div>

              <Field label="Project Scope & Description" required hint="Detailed requirements, goals, and technical expectations">
                <textarea
                  id="proj-description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  style={textareaStyle()}
                  placeholder="Explain the background, key objectives, technical context, and success metrics for this project..."
                  required
                />
              </Field>
            </div>
          </div>

          {/* Section 2: Requirements & Deliverables */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
              <WorkspaceIcon name="tools" /> Skills & Expected Deliverables
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field
                label="Required Skills & Technologies"
                required
                hint="Comma-separated skills (e.g. React, Next.js, Figma). These skills will be printed on the verified certificates."
              >
                <input
                  id="proj-skills"
                  value={form.requiredSkills}
                  onChange={e => setForm({ ...form, requiredSkills: e.target.value })}
                  style={inputStyle()}
                  placeholder="e.g. React, TypeScript, Node.js, TailwindCSS"
                  required
                />
              </Field>

              {parsedSkills.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-subtle)", marginBottom: 4 }}>
                    Certificate Skills Tags ({parsedSkills.length}):
                  </div>
                  <SkillChips skills={parsedSkills} max={15} />
                </div>
              )}

              <Field
                label="Deliverables"
                required
                hint="What talent must submit for review (e.g., GitHub repo, live URL, Figma link)"
              >
                <textarea
                  id="proj-deliverables"
                  value={form.deliverables}
                  onChange={e => setForm({ ...form, deliverables: e.target.value })}
                  rows={3}
                  style={textareaStyle()}
                  placeholder="e.g. Public GitHub repository link, deployed live demo URL, and README setup guide."
                  required
                />
              </Field>

              <Field label="Submission Deadline" required hint="Final date for teams to submit completed deliverables">
                <input
                  id="proj-deadline"
                  type="date"
                  min={minDate}
                  value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                  style={{ ...inputStyle(), maxWidth: 260 }}
                  required
                />
              </Field>
            </div>
          </div>

          {/* Draft Toggle & Submit Actions */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 20,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {verified && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--navy)", marginBottom: 16, cursor: "pointer", fontWeight: 600 }}>
                <input
                  id="proj-draft"
                  type="checkbox"
                  checked={form.draft}
                  onChange={e => setForm({ ...form, draft: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: "var(--navy)" }}
                />
                Save as draft only (do not publish to public talent marketplace yet)
              </label>
            )}

            <Btn
              type="submit"
              variant="primary"
              disabled={busy}
              style={{ width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 800 }}
            >
              {busy
                ? "Processing…"
                : verified && !form.draft && (billing?.canPost ?? true)
                ? "Publish Project to Marketplace"
                : "Save Project as Draft"}
            </Btn>
          </div>

          {error && <Notice kind="error">{error}</Notice>}
        </form>

        {/* Live Talent Preview Card Widget */}
        <div style={{ position: "sticky", top: 96 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            <WorkspaceIcon name="eye" /> Live Talent Card Preview
          </div>

          <div
            style={{
              border: "1.5px solid rgba(201,162,39,0.5)",
              borderRadius: 16,
              padding: 24,
              background: "linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)",
              boxShadow: "0 4px 20px rgba(201,162,39,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--gold)",
                  background: "rgba(201,162,39,0.18)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  textTransform: "uppercase",
                }}
              >
                {form.category ? PROJECT_CATEGORY_LABEL[form.category] : "Category"}
              </span>

              <span style={{ fontSize: 11, color: "var(--ink-subtle)" }}>
                <WorkspaceIcon name="calendar" /> {form.deadline ? `Due ${form.deadline}` : "No deadline set"}
              </span>
            </div>

            <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", margin: "8px 0 4px" }}>
              {form.title || "Project Title Preview"}
            </h4>

            <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 700, marginBottom: 10 }}>
              <WorkspaceIcon name="building" /> {clientName}
            </div>

            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
              {form.description || "Your project overview and requirements will display here in real-time as you type."}
            </p>

            {parsedSkills.length > 0 ? (
              <div style={{ marginBottom: 14 }}>
                <SkillChips skills={parsedSkills} max={6} />
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--ink-subtle)", fontStyle: "italic", marginBottom: 14 }}>
                Required skills will appear here...
              </div>
            )}

            <div
              style={{
                borderTop: "1px dashed rgba(201,162,39,0.4)",
                paddingTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 11,
                color: "var(--ink-subtle)",
              }}
            >
              <span><WorkspaceIcon name="teams" /> {form.teamCap > 1 ? `Teams up to ${form.teamCap}` : "Solo applicants"}</span>
              <span style={{ fontWeight: 700, color: "var(--navy)" }}>Apply Now →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
