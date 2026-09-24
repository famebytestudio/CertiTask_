"use client";

import { useState } from "react";
import Link from "next/link";
import { Btn, Card, EmptyState, Field, Modal, Notice, SectionHeader, StatusBadge, VerificationBadge, daysUntil, formatDate, inputStyle, textareaStyle } from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import type { TeamFullDto } from "@/lib/types";
import type { TalentTab } from "@/app/talent/dashboard/page";
import { PlanRequiredModal } from "@/components/client/PlanRequiredModal";

const MEMBER_LABEL: Record<string, string> = { INVITED: "Invited", ACCEPTED: "Member", DECLINED: "Declined", REMOVED: "Removed", EXPIRED: "Invite expired", LEFT: "Left" };

export function TeamsTab({ teams, meId, onChanged, goTo }: { teams: TeamFullDto[]; meId: string; onChanged: () => void; goTo: (t: TalentTab) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inviteFor, setInviteFor] = useState<TeamFullDto | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [applyFor, setApplyFor] = useState<TeamFullDto | null>(null);
  const [pitch, setPitch] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [planModal, setPlanModal] = useState<"PLAN_REQUIRED" | "LIMIT_REACHED" | null>(null);

  const myInvites = teams.filter(t => t.members.some(m => m.user.id === meId && m.status === "INVITED"));
  // Solo applications create a one-person team behind the scenes; only real teams belong here.
  const myTeams = teams.filter(t => t.members.some(m => m.user.id === meId && m.status === "ACCEPTED") && t.project.teamCap > 1);

  async function act(key: string, fn: () => Promise<{ ok: boolean; error?: string; code?: string }>, okMsg?: string) {
    setError(null); setInfo(null); setBusy(key);
    const r = await fn();
    setBusy(null);
    if (!r.ok) { if (r.code === "PLAN_REQUIRED" || r.code === "LIMIT_REACHED") { setPlanModal(r.code); setBusy(null); return false; } setError(r.error ?? "Something went wrong"); return false; }
    if (okMsg) setInfo(okMsg);
    onChanged();
    return true;
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteFor) return;
    const ok = await act("invite", () => api<{ kind: string }>(`/api/teams/${inviteFor.id}/invites`, "POST", { email: inviteEmail }), "Invitation sent.");
    if (ok) { setInviteEmail(""); setInviteFor(null); }
  }

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!applyFor) return;
    const ok = await act("apply", () => api("/api/applications", "POST", { teamId: applyFor.id, pitch }), "Application sent. The roster is now frozen.");
    if (ok) { setPitch(""); setApplyFor(null); goTo("applications"); }
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
      <Card style={{ background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>
              <Link href={`/projects/${t.project.id}`} style={{ color: "inherit", textDecoration: "none" }}>{t.project.title}</Link> · {t.project.client.name}
            </span>
            <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", margin: "4px 0 2px" }}>{t.name}</h4>
            <div style={{ fontSize: 12, color: "var(--ink-subtle)" }}>
              {isLead ? "You lead this team" : `Led by ${t.lead.name}`} · {accepted.length}/{t.project.teamCap} seats filled · deadline {formatDate(t.project.deadline)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {t.application ? <StatusBadge status={t.application.status} /> : <span style={{ fontSize: 11, fontWeight: 700, color: "#97640E", background: "rgba(236,201,75,0.18)", padding: "3px 10px", borderRadius: 20 }}>Not applied yet</span>}
            {!open && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-subtle)", background: "#EDF2F7", padding: "3px 10px", borderRadius: 20 }}>Project closed</span>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {t.members.filter(m => ["ACCEPTED", "INVITED"].includes(m.status)).map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, flexWrap: "wrap" }}>
              <Link href={`/talents/${m.user.id}`} style={{ fontWeight: 700, color: "var(--navy)", textDecoration: "none" }}>{m.user.name}{m.user.id === meId ? " (you)" : ""}</Link>
              <span style={{ fontSize: 11, color: "var(--ink-subtle)" }}>{m.role === "LEAD" ? "Lead" : MEMBER_LABEL[m.status]}{m.status === "INVITED" && m.expiresAt ? ` · expires ${formatDate(m.expiresAt)}` : ""}</span>
              <VerificationBadge status={m.user.verificationStatus} />
              {isLead && !frozen && m.role !== "LEAD" && (
                <button disabled={busy === m.id} onClick={() => act(m.id, () => api(`/api/teams/${t.id}/members/${m.id}`, "PATCH", { action: "REMOVE" }))} style={{ fontSize: 11, color: "#9B2C2C", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Remove</button>
              )}
            </div>
          ))}
          {t.invites.map(i => (
            <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, color: "var(--ink-muted)" }}>{i.email}</span>
              <span style={{ fontSize: 11, color: "var(--ink-subtle)" }}>Invited by email · no account yet · expires {formatDate(i.expiresAt)}</span>
              {isLead && !frozen && <button disabled={busy === i.id} onClick={() => act(i.id, () => api(`/api/teams/${t.id}/invites/${i.id}`, "DELETE"))} style={{ fontSize: 11, color: "#9B2C2C", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Cancel</button>}
            </div>
          ))}
        </div>

        {frozen && <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 10 }}>Roster frozen since the application was sent{t.application?.status === "PENDING" || t.application?.status === "SHORTLISTED" ? " — withdraw it from My Applications to change the team." : "."}</div>}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isLead && !frozen && open && seats < t.project.teamCap && <Btn variant="ghost" small onClick={() => { setInviteFor(t); setInviteEmail(""); setError(null); }}>+ Invite by email</Btn>}
          {isLead && !frozen && open && <Btn small onClick={() => { setApplyFor(t); setPitch(""); setError(null); }}>Apply with this team ({accepted.length})</Btn>}
          {isLead && !frozen && <Btn variant="outline" small disabled={busy === t.id} onClick={() => { if (confirm("Disband this team? Members will be notified.")) void act(t.id, () => api(`/api/teams/${t.id}`, "DELETE")); }}>Disband</Btn>}
          {!isLead && me && !frozen && <Btn variant="outline" small disabled={busy === me.id} onClick={() => { if (confirm("Leave this team?")) void act(me.id, () => api(`/api/teams/${t.id}/members/${me.id}`, "PATCH", { action: "LEAVE" })); }}>Leave team</Btn>}
          {t.submission && <Btn variant="ghost" small onClick={() => goTo("submissions")}>View submission</Btn>}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <SectionHeader icon="👥" title="My teams" subtitle="Build a team for a project, invite people by email, then apply together. Everyone on the team gets a certificate when the work is approved." />
      {error && <Notice kind="error">{error}</Notice>}
      {info && <Notice kind="success">{info}</Notice>}

      {myInvites.length > 0 && (
        <div style={{ marginBottom: 24, marginTop: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>Invitations for you ({myInvites.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myInvites.map(t => {
              const m = t.members.find(x => x.user.id === meId)!;
              return (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 18px", border: "1px solid rgba(201,162,39,0.4)", borderRadius: 12, background: "rgba(201,162,39,0.06)", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>{t.lead.name} invited you to &ldquo;{t.name}&rdquo;</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{t.project.title} · {t.project.client.name} · team of up to {t.project.teamCap}{m.expiresAt ? ` · expires ${formatDate(m.expiresAt)}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="success" small disabled={busy === m.id} onClick={() => act(m.id, () => api(`/api/teams/${t.id}/members/${m.id}`, "PATCH", { action: "ACCEPT" }), "You joined the team.")}>Accept</Btn>
                    <Btn variant="outline" small disabled={busy === m.id} onClick={() => act(m.id, () => api(`/api/teams/${t.id}/members/${m.id}`, "PATCH", { action: "DECLINE" }))}>Decline</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {myTeams.length === 0 ? (
        <EmptyState icon="👥" title="You're not on a team yet" hint="Open Find Projects, pick one that allows teams, and choose “Build a team”. Or wait for an invitation." action={<Btn onClick={() => goTo("projects")}>Find projects →</Btn>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{myTeams.map(t => <TeamCard key={t.id} t={t} />)}</div>
      )}

      {inviteFor && (
        <Modal title={`Invite to ${inviteFor.name}`} subtitle={`${inviteFor.project.title} · ${inviteFor.members.filter(m => m.status === "ACCEPTED").length + inviteFor.members.filter(m => m.status === "INVITED").length + inviteFor.invites.length}/${inviteFor.project.teamCap} seats used. Invitations expire after 7 days.`} onClose={() => setInviteFor(null)}>
          <form onSubmit={sendInvite} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Email address" required hint="If they already have a CertiTask talent account they'll see it in their dashboard; otherwise they get an email to sign up and the invite attaches automatically.">
              <input id="invite-email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={inputStyle()} placeholder="teammate@example.com" required autoFocus />
            </Field>
            {error && <Notice kind="error">{error}</Notice>}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setInviteFor(null)}>Cancel</Btn>
              <Btn type="submit" style={{ flex: 2 }} disabled={busy === "invite"}>{busy === "invite" ? "Sending…" : "Send invitation"}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {applyFor && (
        <Modal title={`Apply with ${applyFor.name}`} subtitle={`${applyFor.project.title}. ${applyFor.members.filter(m => m.status === "ACCEPTED").length} member(s) will be on the application. Pending invitations lapse and the roster freezes once you apply.`} onClose={() => setApplyFor(null)}>
          <form onSubmit={submitApplication} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Pitch" required>
              <textarea id="team-pitch" value={pitch} onChange={e => setPitch(e.target.value)} rows={5} style={textareaStyle()} placeholder="Why this team? Who does what, relevant work, how you'll approach it." required autoFocus />
            </Field>
            {error && <Notice kind="error">{error}</Notice>}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setApplyFor(null)}>Cancel</Btn>
              <Btn type="submit" style={{ flex: 2 }} disabled={busy === "apply"}>{busy === "apply" ? "Sending…" : "Send application"}</Btn>
            </div>
          </form>
        </Modal>
      )}
      {planModal && <PlanRequiredModal reason={planModal} audience="talent" onClose={() => setPlanModal(null)} />}
    </div>
  );
}
