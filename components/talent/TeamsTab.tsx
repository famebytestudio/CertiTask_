"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Btn,
  Card,
  EmptyState,
  Field,
  Modal,
  Notice,
  SectionHeader,
  StatusBadge,
  VerificationBadge,
  daysUntil,
  formatDate,
  inputStyle,
  textareaStyle,
} from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import type { TeamFullDto } from "@/lib/types";
import type { TalentTab } from "@/app/talent/dashboard/page";
import { PlanRequiredModal } from "@/components/client/PlanRequiredModal";

const MEMBER_LABEL: Record<string, string> = {
  INVITED: "Invited",
  ACCEPTED: "Member",
  DECLINED: "Declined",
  REMOVED: "Removed",
  EXPIRED: "Invite Expired",
  LEFT: "Left",
};

export function TeamsTab({
  teams,
  meId,
  onChanged,
  goTo,
}: {
  teams: TeamFullDto[];
  meId: string;
  onChanged: () => void;
  goTo: (t: TalentTab) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inviteFor, setInviteFor] = useState<TeamFullDto | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [applyFor, setApplyFor] = useState<TeamFullDto | null>(null);
  const [pitch, setPitch] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [planModal, setPlanModal] = useState<"PLAN_REQUIRED" | "LIMIT_REACHED" | null>(null);

  const myInvites = teams.filter(t => t.members.some(m => m.user.id === meId && m.status === "INVITED"));
  const myTeams = teams.filter(
    t => t.members.some(m => m.user.id === meId && m.status === "ACCEPTED") && t.project.teamCap > 1
  );

  async function act(key: string, fn: () => Promise<{ ok: boolean; error?: string; code?: string }>, okMsg?: string) {
    setError(null);
    setInfo(null);
    setBusy(key);
    const r = await fn();
    setBusy(null);
    if (!r.ok) {
      if (r.code === "PLAN_REQUIRED" || r.code === "LIMIT_REACHED") {
        setPlanModal(r.code);
        setBusy(null);
        return false;
      }
      setError(r.error ?? "Something went wrong");
      return false;
    }
    if (okMsg) setInfo(okMsg);
    onChanged();
    return true;
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteFor) return;
    const ok = await act(
      "invite",
      () => api<{ kind: string }>(`/api/teams/${inviteFor.id}/invites`, "POST", { email: inviteEmail }),
      "Invitation sent successfully."
    );
    if (ok) {
      setInviteEmail("");
      setInviteFor(null);
    }
  }

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!applyFor) return;
    const ok = await act(
      "apply",
      () => api("/api/applications", "POST", { teamId: applyFor.id, pitch }),
      "Application sent successfully. The roster is now locked."
    );
    if (ok) {
      setPitch("");
      setApplyFor(null);
      goTo("applications");
    }
  }

  function TeamCard({ t }: { t: TeamFullDto }) {
    const isLead = t.leadId === meId;
    const accepted = t.members.filter(m => m.status === "ACCEPTED");
    const pending = t.members.filter(m => m.status === "INVITED");
    const frozen = !!t.application;
    const open = t.project.status === "ACTIVE" && daysUntil(t.project.deadline) >= 0;
    const seats = accepted.length + pending.length + t.invites.length;
    const me = t.members.find(m => m.user.id === meId);

    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>
                <Link href={`/projects/${t.project.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {t.project.title}
                </Link>{" "}
                · {t.project.client.name}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h4 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", margin: 0 }}>{t.name}</h4>
              {isLead && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--navy)",
                    background: "var(--gold-light)",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  👑 Team Lead
                </span>
              )}
            </div>

            <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginTop: 4 }}>
              {isLead ? "You organized this team" : `Led by ${t.lead.name}`} · {accepted.length} of {t.project.teamCap} seats filled · Deadline {formatDate(t.project.deadline)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {t.application ? (
              <StatusBadge status={t.application.status} />
            ) : (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#97640E",
                  background: "rgba(236,201,75,0.18)",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}
              >
                Not applied yet
              </span>
            )}
            {!open && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--ink-subtle)",
                  background: "#EDF2F7",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}
              >
                Project closed
              </span>
            )}
          </div>
        </div>

        {/* Seat Progress Indicator */}
        <div style={{ background: "#F8FAFC", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: "var(--navy)" }}>Team Capacity</span>
            <span style={{ color: "var(--ink-muted)" }}>
              {accepted.length}/{t.project.teamCap} Confirmed ({t.invites.length + pending.length} pending)
            </span>
          </div>
          <div style={{ height: 6, background: "#E2E8F0", borderRadius: 10, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (accepted.length / t.project.teamCap) * 100)}%`,
                background: "var(--navy)",
                borderRadius: 10,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Team Members List */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            Active Members & Invites
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {t.members
              .filter(m => ["ACCEPTED", "INVITED"].includes(m.status))
              .map(m => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "#FAFAFA",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: m.role === "LEAD" ? "var(--navy)" : "#EDF2F7",
                        color: m.role === "LEAD" ? "var(--gold)" : "var(--navy)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Link
                          href={`/talents/${m.user.id}`}
                          style={{ fontWeight: 700, color: "var(--navy)", textDecoration: "none", fontSize: 13 }}
                        >
                          {m.user.name}
                          {m.user.id === meId ? " (You)" : ""}
                        </Link>
                        <VerificationBadge status={m.user.verificationStatus} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-subtle)" }}>
                        {m.role === "LEAD" ? "Team Leader" : MEMBER_LABEL[m.status]}
                        {m.status === "INVITED" && m.expiresAt ? ` · Expires ${formatDate(m.expiresAt)}` : ""}
                      </div>
                    </div>
                  </div>

                  {isLead && !frozen && m.role !== "LEAD" && (
                    <button
                      disabled={busy === m.id}
                      onClick={() =>
                        act(m.id, () => api(`/api/teams/${t.id}/members/${m.id}`, "PATCH", { action: "REMOVE" }))
                      }
                      style={{
                        fontSize: 12,
                        color: "#9B2C2C",
                        background: "none",
                        border: "1px solid rgba(229,62,62,0.3)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

            {t.invites.map(i => (
              <div
                key={i.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#FFFDF5",
                  border: "1px dashed rgba(201,162,39,0.5)",
                  borderRadius: 10,
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>📧 {i.email}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-subtle)" }}>
                    Invited via email · Pending signup · Expires {formatDate(i.expiresAt)}
                  </div>
                </div>

                {isLead && !frozen && (
                  <button
                    disabled={busy === i.id}
                    onClick={() => act(i.id, () => api(`/api/teams/${t.id}/invites/${i.id}`, "DELETE"))}
                    style={{
                      fontSize: 12,
                      color: "#9B2C2C",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    Cancel Invite
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {frozen && (
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-muted)",
              background: "#F8FAFC",
              padding: "10px 14px",
              borderRadius: 8,
              borderLeft: "3px solid var(--navy)",
            }}
          >
            🔒 Roster locked because the team application is in review. Withdraw the application from &quot;My Applications&quot; if you need to alter the team roster.
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          {isLead && !frozen && open && seats < t.project.teamCap && (
            <Btn
              variant="ghost"
              small
              onClick={() => {
                setInviteFor(t);
                setInviteEmail("");
                setError(null);
              }}
            >
              + Invite Teammate
            </Btn>
          )}

          {isLead && !frozen && open && (
            <Btn
              variant="gold"
              small
              onClick={() => {
                setApplyFor(t);
                setPitch("");
                setError(null);
              }}
            >
              Apply with this Team ({accepted.length}) →
            </Btn>
          )}

          {isLead && !frozen && (
            <Btn
              variant="outline"
              small
              disabled={busy === t.id}
              onClick={() => {
                if (confirm("Disband this team? All pending invites will be cancelled.")) {
                  void act(t.id, () => api(`/api/teams/${t.id}`, "DELETE"));
                }
              }}
            >
              Disband Team
            </Btn>
          )}

          {!isLead && me && !frozen && (
            <Btn
              variant="outline"
              small
              disabled={busy === me.id}
              onClick={() => {
                if (confirm("Are you sure you want to leave this team?")) {
                  void act(me.id, () => api(`/api/teams/${t.id}/members/${me.id}`, "PATCH", { action: "LEAVE" }));
                }
              }}
            >
              Leave Team
            </Btn>
          )}

          {t.submission && (
            <Btn variant="ghost" small onClick={() => goTo("submissions")}>
              View Submission
            </Btn>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        icon="👥"
        title="My Teams"
        subtitle="Form teams with colleagues, invite partners by email, and apply to collaborative projects together. Every team member receives a verified certificate upon client approval."
      />

      {error && <Notice kind="error">{error}</Notice>}
      {info && <Notice kind="success">{info}</Notice>}

      {/* Pending Invitations Section */}
      {myInvites.length > 0 && (
        <div style={{ marginBottom: 28, marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Invitations for You ({myInvites.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myInvites.map(t => {
              const m = t.members.find(x => x.user.id === meId)!;
              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 14,
                    padding: "18px 22px",
                    border: "1.5px solid rgba(201,162,39,0.5)",
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)",
                    boxShadow: "0 2px 8px rgba(201,162,39,0.08)",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>
                      👥 {t.lead.name} invited you to join &ldquo;{t.name}&rdquo;
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 4 }}>
                      Project: <strong>{t.project.title}</strong> · {t.project.client.name} (Max team size: {t.project.teamCap})
                      {m.expiresAt ? ` · Expires ${formatDate(m.expiresAt)}` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <Btn
                      variant="success"
                      small
                      disabled={busy === m.id}
                      onClick={() =>
                        act(
                          m.id,
                          () => api(`/api/teams/${t.id}/members/${m.id}`, "PATCH", { action: "ACCEPT" }),
                          "You joined the team!"
                        )
                      }
                    >
                      ✓ Accept & Join
                    </Btn>
                    <Btn
                      variant="outline"
                      small
                      disabled={busy === m.id}
                      onClick={() =>
                        act(m.id, () => api(`/api/teams/${t.id}/members/${m.id}`, "PATCH", { action: "DECLINE" }))
                      }
                    >
                      Decline
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Teams List */}
      {myTeams.length === 0 ? (
        <EmptyState
          icon="👥"
          title="You're not on any teams yet"
          hint="Explore Find Projects to create a team for collaborative projects, or wait for invitations from team leaders."
          action={
            <Btn variant="primary" onClick={() => goTo("projects")}>
              Find Collaborative Projects →
            </Btn>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {myTeams.map(t => (
            <TeamCard key={t.id} t={t} />
          ))}
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteFor && (
        <Modal
          title={`Invite to ${inviteFor.name}`}
          subtitle={`${inviteFor.project.title} · ${
            inviteFor.members.filter(m => m.status === "ACCEPTED").length +
            inviteFor.members.filter(m => m.status === "INVITED").length +
            inviteFor.invites.length
          }/${inviteFor.project.teamCap} seats used. Invitations expire after 7 days.`}
          onClose={() => setInviteFor(null)}
          maxWidth={500}
        >
          <form onSubmit={sendInvite} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field
              label="Teammate's Email Address"
              required
              hint="If they have an account, the invite will show up on their dashboard immediately. Otherwise, an email link will invite them to sign up."
            >
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                style={inputStyle()}
                placeholder="colleague@university.edu"
                required
                autoFocus
              />
            </Field>

            {error && <Notice kind="error">{error}</Notice>}

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <Btn type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setInviteFor(null)}>
                Cancel
              </Btn>
              <Btn type="submit" variant="primary" style={{ flex: 2 }} disabled={busy === "invite"}>
                {busy === "invite" ? "Sending Invitation…" : "Send Invitation →"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Apply with Team Modal */}
      {applyFor && (
        <Modal
          title={`Apply with ${applyFor.name}`}
          subtitle={`${applyFor.project.title} · ${
            applyFor.members.filter(m => m.status === "ACCEPTED").length
          } confirmed member(s). Once you submit, your team roster will be locked for client review.`}
          onClose={() => setApplyFor(null)}
          maxWidth={540}
        >
          <form onSubmit={submitApplication} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field
              label="Team Pitch & Approach"
              required
              hint="Highlight how your team will collaborate, key skills of each member, and your execution strategy."
            >
              <textarea
                id="team-pitch"
                value={pitch}
                onChange={e => setPitch(e.target.value)}
                rows={5}
                style={textareaStyle()}
                placeholder="We are a team of 3 developers specializing in full-stack web applications. Our roles will be..."
                required
                autoFocus
              />
            </Field>

            {error && <Notice kind="error">{error}</Notice>}

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <Btn type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setApplyFor(null)}>
                Cancel
              </Btn>
              <Btn type="submit" variant="gold" style={{ flex: 2 }} disabled={busy === "apply"}>
                {busy === "apply" ? "Submitting Application…" : "Submit Team Application →"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {planModal && <PlanRequiredModal reason={planModal} audience="talent" onClose={() => setPlanModal(null)} />}
    </div>
  );
}
