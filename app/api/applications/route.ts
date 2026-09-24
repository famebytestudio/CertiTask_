import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isString } from "@/lib/validation";
import { applicationInclude } from "@/lib/queries";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { isOnAnotherTeam, teamInclude } from "@/lib/teams";
import { BillingError, consumeApplication } from "@/lib/billing";

/**
 * GET /api/applications
 * - Client: applications to their projects.
 * - Talent: applications from any team they belong to.
 */
export async function GET() {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;

  try {
    const where =
      auth.role === "CLIENT"
        ? { project: { clientId: auth.userId } }
        : { team: { members: { some: { userId: auth.userId, status: "ACCEPTED" as const } } } };

    const applications = await prisma.application.findMany({
      where,
      include: applicationInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Fetch applications error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

/**
 * POST /api/applications
 *  - { teamId, pitch }              lead applies with an existing team (roster freezes)
 *  - { projectId, teamName, pitch } quick solo apply: creates a team of one and applies
 */
export async function POST(req: Request) {
  const auth = await requireRole("TALENT");
  if (auth instanceof NextResponse) return auth;

  try {
    const me = await prisma.user.findUnique({ where: { id: auth.userId }, select: { emailVerifiedAt: true } });
    if (!me?.emailVerifiedAt) {
      return NextResponse.json({ error: "Confirm your email address before applying" }, { status: 403 });
    }

    const { projectId: bodyProjectId, teamId, teamName, pitch } = await req.json();
    if (!isString(pitch, 10000)) return NextResponse.json({ error: "A pitch is required" }, { status: 400 });

    // ── Team apply ──
    if (isString(teamId, 100)) {
      const team = await prisma.team.findUnique({ where: { id: teamId }, include: teamInclude });
      if (!team || team.leadId !== auth.userId) return NextResponse.json({ error: "Only the team lead can apply" }, { status: 403 });
      if (team.application) return NextResponse.json({ error: "This team has already applied" }, { status: 409 });
      if (team.project.status !== "ACTIVE" || team.project.deadline < new Date()) return NextResponse.json({ error: "This project is not accepting applications" }, { status: 409 });
      const accepted = team.members.filter((m) => m.status === "ACCEPTED");
      if (accepted.length > team.project.teamCap) return NextResponse.json({ error: `This project allows teams of up to ${team.project.teamCap}` }, { status: 409 });
      const pending = team.members.filter((m) => m.status === "INVITED").length + team.invites.length;
      const application = await prisma.$transaction(async (tx) => {
        await consumeApplication(tx, auth.userId);
        // Open invitations lapse once the roster is frozen.
        if (pending > 0) {
          await tx.teamMember.updateMany({ where: { teamId, status: "INVITED" }, data: { status: "EXPIRED" } });
          await tx.teamInvite.deleteMany({ where: { teamId, acceptedAt: null } });
        }
        const app = await tx.application.create({ data: { projectId: team.projectId, teamId, pitch: pitch.trim() }, include: applicationInclude });
        await audit(auth, "application.submitted", "application", app.id, { projectId: team.projectId, teamId, members: accepted.length }, tx);
        return app;
      }, { maxWait: 10_000, timeout: 30_000 });
      for (const m of accepted) if (m.user.id !== auth.userId) {
        await notify(m.user.id, "application.status", `${team.name} applied`, `${auth.name} submitted your team's application for "${team.project.title}".`, "/talent/dashboard?tab=applications");
      }
      return NextResponse.json({ success: true, application, lapsedInvites: pending });
    }

    // ── Solo quick apply ──
    const projectId = bodyProjectId;
    if (!isString(projectId, 100) || !isString(teamName, 100)) {
      return NextResponse.json({ error: "Project, team name and pitch are required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, status: "ACTIVE", deadline: { gte: new Date() } },
      select: { id: true, title: true, clientId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "This project is not accepting applications" }, { status: 404 });
    }
    if (await isOnAnotherTeam(auth.userId, projectId)) {
      return NextResponse.json({ error: "You are already on a team for this project" }, { status: 409 });
    }

    const application = await prisma.$transaction(async (tx) => {
      await consumeApplication(tx, auth.userId);
      const team = await tx.team.create({
        data: {
          name: teamName.trim(),
          projectId,
          leadId: auth.userId,
          members: {
            create: { userId: auth.userId, role: "LEAD", status: "ACCEPTED", respondedAt: new Date() },
          },
        },
      });
      const app = await tx.application.create({
        data: { projectId, teamId: team.id, pitch: pitch.trim() },
        include: applicationInclude,
      });
      await audit(auth, "application.submitted", "application", app.id, { projectId, teamId: team.id }, tx);
      return app;
    }, { maxWait: 10_000, timeout: 30_000 });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    if (error instanceof BillingError) return NextResponse.json({ error: error.message, code: error.code, billing: error.code }, { status: error.status });
    console.error("Submit application error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
