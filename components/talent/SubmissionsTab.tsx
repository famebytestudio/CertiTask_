"use client";

import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

import { useState } from "react";
import Link from "next/link";
import {
  Btn,
  EmptyState,
  Field,
  Modal,
  Notice,
  SectionHeader,
  StatusBadge,
  formatDate,
  inputStyle,
  textareaStyle,
} from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import type { ApplicationDto, SubmissionDto } from "@/lib/types";
import { SUBMISSION_STATUS_LABEL } from "@/lib/enums";

export function SubmissionsTab({
  applications,
  submissions,
  onChanged,
}: {
  applications: ApplicationDto[];
  submissions: SubmissionDto[];
  onChanged: () => void;
}) {
  const [target, setTarget] = useState<{ projectId: string; title: string; existing?: SubmissionDto } | null>(null);
  const [form, setForm] = useState({ submissionUrl: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = applications.filter(a => a.status === "SELECTED");
  const todo = selected.filter(a => !submissions.some(s => s.teamId === a.teamId));

  function open(projectId: string, title: string, existing?: SubmissionDto) {
    setTarget({ projectId, title, existing });
    setForm({ submissionUrl: existing?.submissionUrl ?? "", notes: existing?.notes ?? "" });
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setBusy(true);
    setError(null);
    const res = await api("/api/submissions", "POST", { projectId: target.projectId, ...form });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not submit deliverables");
      return;
    }
    setTarget(null);
    onChanged();
  }

  return (
    <div>
      <SectionHeader
        icon={<WorkspaceIcon name="submissions" />}
        title="My Submissions"
        subtitle="Submit project deliverables for client review, track reviewer feedback, and earn your verified credentials."
        action={
          <div style={{ fontSize: 13, color: "var(--ink-muted)", background: "rgba(15,42,74,0.06)", padding: "6px 14px", borderRadius: 20, fontWeight: 700 }}>
            {submissions.length} Submission{submissions.length !== 1 ? "s" : ""}
          </div>
        }
      />

      {/* Action Required: Selected Projects Awaiting Deliverables */}
      {todo.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#276749", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            <WorkspaceIcon name="bolt" /> Action Required: Ready for Submission ({todo.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {todo.map(a => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px 22px",
                  border: "1.5px solid rgba(56,161,105,0.4)",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(56,161,105,0.08) 0%, rgba(56,161,105,0.02) 100%)",
                  boxShadow: "0 2px 8px rgba(56,161,105,0.08)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>
                    <Link href={`/projects/${a.projectId}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {a.project.title}
                    </Link>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 4 }}>
                    Client: <strong>{a.project.client?.name ?? "Client"}</strong> · Team &ldquo;{a.team.name}&rdquo;
                  </div>
                </div>

                <Btn variant="success" onClick={() => open(a.projectId, a.project.title)}>
                  <WorkspaceIcon name="submissions" /> Submit Deliverables Now →
                </Btn>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Submissions List */}
      {submissions.length === 0 && todo.length === 0 ? (
        <EmptyState
          icon={<WorkspaceIcon name="folder" />}
          title="No submissions yet"
          hint="When a client selects your application, you will be able to submit your work here and track client reviews."
        />
      ) : (
        submissions.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Submission History ({submissions.length})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {submissions.map(sub => {
                const isApproved = sub.status === "APPROVED";
                const isRejected = sub.status === "REJECTED";

                return (
                  <div
                    key={sub.id}
                    style={{
                      background: "#fff",
                      border: isApproved
                        ? "1.5px solid rgba(56,161,105,0.4)"
                        : isRejected
                        ? "1.5px solid rgba(229,62,62,0.4)"
                        : "1px solid var(--border)",
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
                          <Link href={`/projects/${sub.projectId}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {sub.project.title}
                          </Link>
                        </h4>
                        <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                          Client: <strong>{sub.project.client?.name ?? "Client"}</strong> · Submitted {formatDate(sub.createdAt)}
                        </div>
                      </div>

                      <StatusBadge status={sub.status} label={SUBMISSION_STATUS_LABEL[sub.status]} />
                    </div>

                    {/* Submission URL Preview */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#F8FAFC",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: "10px 14px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 14 }}><WorkspaceIcon name="link" /></span>
                      <a
                        href={sub.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 13,
                          color: "var(--navy)",
                          fontWeight: 700,
                          textDecoration: "underline",
                          wordBreak: "break-all",
                        }}
                      >
                        {sub.submissionUrl} ↗
                      </a>
                    </div>

                    {/* Developer Notes */}
                    {sub.notes && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase", marginBottom: 4 }}>
                          Notes Provided to Reviewer:
                        </div>
                        <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                          {sub.notes}
                        </p>
                      </div>
                    )}

                    {/* Client Feedback Box */}
                    {sub.feedback && (
                      <div
                        style={{
                          background: isRejected ? "rgba(229,62,62,0.06)" : "linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)",
                          border: isRejected ? "1px solid rgba(229,62,62,0.3)" : "1px solid rgba(201,162,39,0.4)",
                          borderRadius: 10,
                          padding: "14px 18px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: isRejected ? "#9B2C2C" : "var(--gold)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 4,
                          }}
                        >
                          <WorkspaceIcon name="message" /> Client Feedback & Review
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {sub.feedback}
                        </p>
                      </div>
                    )}

                    {/* Status Banners / CTAs */}
                    {isRejected && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 13, color: "#9B2C2C", fontWeight: 600 }}>
                          Changes requested. Update your deliverable and resubmit.
                        </span>
                        <Btn variant="primary" small onClick={() => open(sub.projectId, sub.project.title, sub)}>
                          <WorkspaceIcon name="edit" /> Resubmit Deliverables
                        </Btn>
                      </div>
                    )}

                    {isApproved && (
                      <div
                        style={{
                          background: "rgba(56,161,105,0.08)",
                          border: "1px solid rgba(56,161,105,0.3)",
                          borderRadius: 10,
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 20 }}><WorkspaceIcon name="certificates" /></span>
                        <div style={{ fontSize: 13, color: "#276749", fontWeight: 700 }}>
                          Deliverables approved! Your verified certificate has been issued. Check the &ldquo;My Certificates&rdquo; tab to view and share it.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Submission Modal */}
      {target && (
        <Modal
          title={target.existing ? "Resubmit Project Deliverables" : "Submit Project Deliverables"}
          subtitle={`Project: ${target.title}`}
          onClose={() => setTarget(null)}
          maxWidth={540}
        >
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field
              label="Deliverables URL"
              required
              hint="Provide a public GitHub repository, deployed live link, Figma URL, or Google Drive folder. Verify that client permissions are granted."
            >
              <input
                id="sub-url"
                type="url"
                value={form.submissionUrl}
                onChange={e => setForm({ ...form, submissionUrl: e.target.value })}
                style={inputStyle()}
                placeholder="https://github.com/username/project-repo"
                required
                autoFocus
              />
            </Field>

            <Field
              label="Notes for Reviewer"
              hint="Include instructions on how to test/run your solution, credentials if needed, or key highlights."
            >
              <textarea
                id="sub-notes"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={4}
                style={textareaStyle()}
                placeholder="README instructions, live demo URL, or summary of deliverables..."
              />
            </Field>

            {error && <Notice kind="error">{error}</Notice>}

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <Btn type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setTarget(null)}>
                Cancel
              </Btn>
              <Btn type="submit" variant="success" style={{ flex: 2 }} disabled={busy}>
                {busy ? "Submitting Work…" : target.existing ? "Submit Updated Work →" : "Submit for Client Review →"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
