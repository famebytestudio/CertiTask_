import { randomBytes } from "node:crypto";
import { background } from "@/lib/background";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { sendTeamInviteEmail } from "@/lib/email";
import { appUrl } from "@/lib/email-verification";
import { audit } from "@/lib/audit";
import type { SessionPayload } from "@/lib/auth-token";

export const INVITE_TTL_DAYS = 7;
const inviteExpiry = () => new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);

export const teamInclude = {
  project: { select: { id: true, title: true, status: true, deadline: true, teamCap: true, client: { select: { id: true, name: true } } } },
  lead: { select: { id: true, name: true } },
  members: {
    select: {
      id: true, role: true, status: true, invitedAt: true, expiresAt: true, respondedAt: true,
      user: { select: { id: true, name: true, email: true, verificationStatus: true } },
    },
    orderBy: { invitedAt: "asc" },
  },
  invites: { where: { acceptedAt: null }, select: { id: true, email: true, expiresAt: true, createdAt: true } },
  application: { select: { id: true, status: true, createdAt: true } },
  submission: { select: { id: true, status: true } },
} satisfies Prisma.TeamInclude;

export type TeamWithAll = Prisma.TeamGetPayload<{ include: typeof teamInclude }>;

/** Accepted + still-open invitations count toward the cap. */
export function seatsUsed(team: { members: { status: string }[]; invites: unknown[] }): number {
  return team.members.filter((m) => m.status === "ACCEPTED" || m.status === "INVITED").length + team.invites.length;
}

export function isFrozen(team: { application: { id: string } | null }): boolean {
  return !!team.application;
}

/** True if the user is ACCEPTED on any team for this project (one team per project). */
export async function isOnAnotherTeam(userId: string, projectId: string, exceptTeamId?: string): Promise<boolean> {
  const hit = await prisma.teamMember.findFirst({
    where: { userId, status: "ACCEPTED", team: { projectId, ...(exceptTeamId ? { id: { not: exceptTeamId } } : {}) } },
    select: { id: true },
  });
  return !!hit;
}

export class TeamError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

/**
 * Invite an email to a team. Registered talent gets a TeamMember(INVITED);
 * unknown emails get a TeamInvite that converts on signup.
 */
export async function inviteToTeam(actor: SessionPayload, teamId: string, rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: teamInclude });
  if (!team || team.leadId !== actor.userId) throw new TeamError("Team not found", 404);
  if (isFrozen(team)) throw new TeamError("This team has already applied; the roster is frozen. Withdraw the application to change it.", 409);
  if (team.project.status !== "ACTIVE" || team.project.deadline < new Date()) throw new TeamError("This project is no longer open", 409);
  if (email === actor.email.toLowerCase()) throw new TeamError("You are already the lead of this team");
  if (seatsUsed(team) >= team.project.teamCap) throw new TeamError(`This project allows teams of up to ${team.project.teamCap}. Remove someone or cancel an invitation first.`, 409);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, role: true, suspendedAt: true } });
  const inviteUrl = `${appUrl()}/talent/dashboard?tab=teams`;

  if (user) {
    if (user.role !== "TALENT" || user.suspendedAt) throw new TeamError("That email belongs to an account that cannot join teams");
    if (await isOnAnotherTeam(user.id, team.projectId, team.id)) throw new TeamError(`${user.name} is already on another team for this project`, 409);
    const existing = team.members.find((m) => m.user.id === user.id);
    if (existing && (existing.status === "ACCEPTED" || existing.status === "INVITED")) throw new TeamError(`${user.name} is already ${existing.status === "ACCEPTED" ? "on the team" : "invited"}`, 409);

    const member = existing
      ? await prisma.teamMember.update({ where: { id: existing.id }, data: { status: "INVITED", invitedById: actor.userId, invitedAt: new Date(), expiresAt: inviteExpiry(), respondedAt: null } })
      : await prisma.teamMember.create({ data: { teamId, userId: user.id, role: "MEMBER", status: "INVITED", invitedById: actor.userId, expiresAt: inviteExpiry() } });
    await notify(user.id, "team.invite", `Team invitation: ${team.name}`, `${actor.name} invited you to join "${team.name}" for "${team.project.title}". Expires in ${INVITE_TTL_DAYS} days.`, "/talent/dashboard?tab=teams");
    background("Team invitation email", () => sendTeamInviteEmail(email, user.name, actor.name, team.name, team.project.title, inviteUrl, true));
    await audit(actor, "team.member_invited", "team", teamId, { userId: user.id });
    return { kind: "member" as const, member };
  }

  const existingInvite = team.invites.find((i) => i.email === email);
  if (existingInvite) throw new TeamError("That email has already been invited", 409);
  const token = randomBytes(24).toString("hex");
  const invite = await prisma.teamInvite.create({ data: { teamId, email, invitedById: actor.userId, token, expiresAt: inviteExpiry() } });
  background("Team invitation email", () => sendTeamInviteEmail(email, null, actor.name, team.name, team.project.title, `${appUrl()}/auth/signup?invite=${token}`, false));
  await audit(actor, "team.email_invited", "team", teamId, { email });
  return { kind: "invite" as const, invite };
}

/** Called after a TALENT signs up: attach any pending email invitations. */
export async function attachPendingInvites(user: { id: string; email: string; name: string }): Promise<number> {
  const invites = await prisma.teamInvite.findMany({
    where: { email: user.email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
    include: { team: { select: { id: true, name: true, projectId: true, project: { select: { title: true } }, lead: { select: { name: true } } } } },
  });
  let n = 0;
  for (const inv of invites) {
    const exists = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: inv.teamId, userId: user.id } } });
    if (!exists) {
      await prisma.teamMember.create({ data: { teamId: inv.teamId, userId: user.id, role: "MEMBER", status: "INVITED", invitedById: inv.invitedById, expiresAt: inv.expiresAt } });
      await notify(user.id, "team.invite", `Team invitation: ${inv.team.name}`, `${inv.team.lead.name} invited you to join "${inv.team.name}" for "${inv.team.project.title}".`, "/talent/dashboard?tab=teams");
      n++;
    }
    await prisma.teamInvite.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
  }
  return n;
}

/** Member responds to an invitation. */
export async function respondToInvite(actor: SessionPayload, memberId: string, accept: boolean) {
  const m = await prisma.teamMember.findUnique({ where: { id: memberId }, include: { team: { include: teamInclude } } });
  if (!m || m.userId !== actor.userId) throw new TeamError("Invitation not found", 404);
  if (m.status !== "INVITED") throw new TeamError("This invitation is no longer open", 409);
  if (m.expiresAt && m.expiresAt < new Date()) {
    await prisma.teamMember.update({ where: { id: m.id }, data: { status: "EXPIRED" } });
    throw new TeamError("This invitation has expired. Ask the team lead to invite you again.", 409);
  }
  if (accept) {
    if (isFrozen(m.team)) throw new TeamError("This team has already applied and its roster is frozen", 409);
    if (m.team.project.status !== "ACTIVE" || m.team.project.deadline < new Date()) throw new TeamError("This project is no longer open", 409);
    if (await isOnAnotherTeam(actor.userId, m.team.projectId, m.teamId)) throw new TeamError("You are already on another team for this project. Leave it first.", 409);
    const accepted = m.team.members.filter((x) => x.status === "ACCEPTED").length;
    if (accepted >= m.team.project.teamCap) throw new TeamError("The team is already full", 409);
  }
  const updated = await prisma.teamMember.update({ where: { id: m.id }, data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() } });
  await notify(m.team.leadId, accept ? "team.accepted" : "team.declined", accept ? `${actor.name} joined ${m.team.name}` : `${actor.name} declined`, `${actor.name} ${accept ? "accepted" : "declined"} your invitation to "${m.team.name}" (${m.team.project.title}).`, "/talent/dashboard?tab=teams");
  await audit(actor, accept ? "team.invite_accepted" : "team.invite_declined", "team", m.teamId, { memberId: m.id });
  return updated;
}

/** Lead removes a member, or a member leaves — only before the team has applied. */
export async function removeOrLeave(actor: SessionPayload, memberId: string) {
  const m = await prisma.teamMember.findUnique({ where: { id: memberId }, include: { team: { include: teamInclude } } });
  if (!m) throw new TeamError("Member not found", 404);
  const isLead = m.team.leadId === actor.userId;
  const isSelf = m.userId === actor.userId;
  if (!isLead && !isSelf) throw new TeamError("Not allowed", 403);
  if (m.role === "LEAD") throw new TeamError("The lead cannot be removed. Delete the team instead.", 400);
  if (isFrozen(m.team)) throw new TeamError("This team has already applied; the roster is frozen.", 409);
  const status = isSelf && !isLead ? "LEFT" : "REMOVED";
  const updated = await prisma.teamMember.update({ where: { id: m.id }, data: { status, respondedAt: new Date() } });
  if (isLead && !isSelf) await notify(m.userId, "team.removed", `Removed from ${m.team.name}`, `${actor.name} removed you from the team for "${m.team.project.title}".`, "/talent/dashboard?tab=teams");
  else await notify(m.team.leadId, "team.left", `${actor.name} left ${m.team.name}`, `${actor.name} left your team for "${m.team.project.title}".`, "/talent/dashboard?tab=teams");
  await audit(actor, status === "LEFT" ? "team.member_left" : "team.member_removed", "team", m.teamId, { memberId: m.id });
  return updated;
}
