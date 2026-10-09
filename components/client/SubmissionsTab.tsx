"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Btn,
  Card,
  EmptyState,
  Modal,
  Notice,
  SectionHeader,
  StatusBadge,
  formatDate,
  textareaStyle,
} from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import type { SubmissionDto } from "@/lib/types";
import { SUBMISSION_STATUS_LABEL } from "@/lib/enums";

export function SubmissionsTab({
  submissions,
  onChanged,
}: {
  submissions: SubmissionDto[];
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<SubmissionDto | null>(null);
  const [feedback, setFeedback] = useState("");
  const [issued, setIssued] = useState<{ issued: number; held: number } | null>(null);

  const pending = submissions.filter(s => s.status === "SUBMITTED");
  const done = submissions.filter(s => s.status !== "SUBMITTED");

  async function approve(sub: SubmissionDto) {
    const n = sub.team.members?.filter(m => m.status === "ACCEPTED").length ?? 1;
    if (
      !confirm(
        `Approve this completed project and issue ${n} verified certificate${n !== 1 ? "s" : ""}? This permanently mints certificates for all team members.`
      )
    )
      return;
    setError(null);
    setBusyId(sub.id);
    const res = await api<{ certificatesIssued: number; certificatesHeld: number }>(
      `/api/submissions/${sub.id}`,
      "PATCH",
      { status: "APPROVED" }
    );
    setBusyId(null);
    if (!res.ok) {
      setError(res.error ?? "Could not approve submission");
      return;
    }
    setIssued({ issued: res.data?.certificatesIssued ?? 0, held: res.data?.certificatesHeld ?? 0 });
    onChanged();
  }

  async function reject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejecting) return;
    setError(null);
    setBusyId(rejecting.id);
    const res = await api(`/api/submissions/${rejecting.id}`, "PATCH", { status: "REJECTED", feedback });
    setBusyId(null);
    if (!res.ok) {
      setError(res.error ?? "Could not send change request");
      return;
    }
    setRejecting(null);
    setFeedback("");
    onChanged();
  }

  function SubmissionCard({ sub }: { sub: SubmissionDto }) {
    const busy = busyId === sub.id;
    const isApproved = sub.status === "APPROVED";
    const isRejected = sub.status === "REJECTED";

    return (
      <div
        style={{
          background: "#fff",
          border: sub.status === "SUBMITTED"
            ? "1.5px solid rgba(201,162,39,0.5)"
            : isApproved
            ? "1.5px solid rgba(56,161,105,0.4)"
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
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>
              Project: {sub.project.title}
            </span>
            <h4 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", margin: "4px 0 2px" }}>
              {sub.team.name}
            </h4>
            <div style={{ fontSize: 12, color: "var(--ink-subtle)" }}>
              Submitted by <strong>{sub.submittedBy.name}</strong> · {formatDate(sub.createdAt)}
            </div>
          </div>

          <StatusBadge status={sub.status} label={SUBMISSION_STATUS_LABEL[sub.status]} />
        </div>

        {/* Deliverable Link Preview */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#F8FAFC",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 16px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 16 }}>🔗</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase" }}>
            Deliverable Link:
          </span>
          <a
            href={sub.submissionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--navy)",
              textDecoration: "underline",
              wordBreak: "break-all",
            }}
          >
            {sub.submissionUrl} ↗
          </a>
        </div>

        {/* Notes from the Developer/Team */}
        {sub.notes && (
          <div
            style={{
              padding: "12px 16px",
              background: "#FAFAFA",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--ink)",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-subtle)", textTransform: "uppercase", marginBottom: 4 }}>
              Notes from the Team:
            </div>
            {sub.notes}
          </div>
        )}

        {/* Client Feedback (if previously sent) */}
        {sub.feedback && (
          <div
            style={{
              padding: "12px 16px",
              background: isRejected ? "rgba(229,62,62,0.06)" : "#FFFDF5",
              borderLeft: `4px solid ${isRejected ? "var(--error)" : "var(--gold)"}`,
              borderRadius: "0 10px 10px 0",
              fontSize: 13,
              color: "var(--ink)",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: isRejected ? "#9B2C2C" : "var(--gold)", textTransform: "uppercase", marginBottom: 4 }}>
              Your Feedback / Change Request:
            </div>
            {sub.feedback}
          </div>
        )}

        {/* Action Buttons */}
        {sub.status === "SUBMITTED" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            <Btn
              variant="success"
              disabled={busy}
              onClick={() => approve(sub)}
              style={{ padding: "10px 20px", fontWeight: 800 }}
            >
              ✓ Approve &amp; Issue Certificates
            </Btn>
            <Btn
              variant="outline"
              disabled={busy}
              onClick={() => {
                setRejecting(sub);
                setFeedback("");
              }}
              style={{ padding: "10px 18px" }}
            >
              💬 Request Changes / Feedback
            </Btn>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        icon="📤"
        title="Review Deliverables"
        subtitle="Evaluate submitted project links and code repositories. Approving automatically generates verified certificates for all confirmed team members."
      />

      {error && <Notice kind="error">{error}</Notice>}

      {issued !== null && (
        <Notice kind="success">
          🎉 Deliverables approved! <strong>{issued.issued} certificate{issued.issued !== 1 ? "s" : ""}</strong> have been minted and emailed to the recipients.
          {issued.held > 0 && (
            <span>
              {" "}
              {issued.held} member{issued.held > 1 ? "s have" : " has"} not yet verified their identity; their certificate will be released automatically once identity verification is completed.
            </span>
          )}
        </Notice>
      )}

      {submissions.length === 0 ? (
        <EmptyState
          icon="📂"
          title="No deliverables submitted yet"
          hint="When a selected team submits their repository or live project link, it will appear here for evaluation."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 8 }}>
          {pending.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#9B2C2C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                ⚡ Action Required: Awaiting Your Evaluation ({pending.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {pending.map(s => (
                  <SubmissionCard key={s.id} sub={s} />
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Reviewed Submissions ({done.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {done.map(s => (
                  <SubmissionCard key={s.id} sub={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request Changes Modal */}
      {rejecting && (
        <Modal
          title="Request Changes & Provide Feedback"
          subtitle={`Deliverable from "${rejecting.team.name}" for project "${rejecting.project.title}". The team will be notified to revise and resubmit before the deadline.`}
          onClose={() => setRejecting(null)}
          maxWidth={540}
        >
          <form onSubmit={reject} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <textarea
              id="reject-feedback"
              rows={5}
              style={textareaStyle()}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Be specific: What requirements are incomplete? What needs to be fixed or improved before you can approve?"
              required
              autoFocus
            />

            <div style={{ display: "flex", gap: 10 }}>
              <Btn type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setRejecting(null)}>
                Cancel
              </Btn>
              <Btn type="submit" variant="danger" style={{ flex: 2 }} disabled={busyId === rejecting.id}>
                {busyId === rejecting.id ? "Sending Feedback…" : "Send Change Request →"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
