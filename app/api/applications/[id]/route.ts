import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { applicationInclude } from "@/lib/queries";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { APPLICATION_STATUS_LABEL } from "@/lib/enums";

type Params = { params: Promise<{ id: string }> };

const CLIENT_DECISIONS = ["SHORTLISTED", "SELECTED", "REJECTED"] as const;

/**
 * PATCH /api/applications/[id]
 * - Client (project owner): SHORTLISTED | SELECTED | REJECTED.
 * - Talent (team lead): WITHDRAWN, only while still pending/shortlisted.
 */
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { status } = await req.json();

    const application = await prisma.application.findUnique({
      where: { id },
      include: { project: { select: { clientId: true, teamCap: true } }, team: { select: { leadId: true } } },
    });
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    if (auth.role === "CLIENT") {
      if (application.project.clientId !== auth.userId) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }
      if (!CLIENT_DECISIONS.includes(status)) {
        return NextResponse.json({ error: "Status must be SHORTLISTED, SELECTED or REJECTED" }, { status: 400 });
      }
      if (application.status === "WITHDRAWN") {
        return NextResponse.json({ error: "This application was withdrawn by the applicant" }, { status: 409 });
      }
    } else {
      if (application.team.leadId !== auth.userId) {
        return NextResponse.json({ error: "Only the team lead can withdraw an application" }, { status: 403 });
      }
      if (status !== "WITHDRAWN") {
        return NextResponse.json({ error: "Applicants can only withdraw" }, { status: 400 });
      }
      if (!["PENDING", "SHORTLISTED"].includes(application.status)) {
        return NextResponse.json({ error: "This application can no longer be withdrawn" }, { status: 409 });
      }
    }

    // Withdrawal removes the application so the team's roster unfreezes; a solo
    // team disappears with it. The audit log keeps the record.
    if (status === "WITHDRAWN") {
      const team = await prisma.team.findUnique({ where: { id: application.teamId }, include: { members: { where: { status: "ACCEPTED" }, select: { id: true } }, invites: { select: { id: true } } } });
      const solo = team && team.members.length <= 1 && team.invites.length === 0;
      await audit(auth, "application.withdrawn", "application", id, { projectId: application.projectId, teamId: application.teamId, teamDeleted: !!solo });
      if (solo) await prisma.team.delete({ where: { id: application.teamId } });
      else await prisma.application.delete({ where: { id } });
      return NextResponse.json({ success: true, withdrawn: true });
    }

    if (status === "SELECTED") {
      const existingRoom = await prisma.chatRoom.findUnique({ where: { projectId: application.projectId } });
      if (existingRoom && existingRoom.talentId !== application.team.leadId) {
        return NextResponse.json({ error: "This project already has a selected talent" }, { status: 409 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.application.update({
        where: { id },
        data: { status, reviewedAt: new Date() },
        include: applicationInclude,
      });

      if (status === "SELECTED") {
        await tx.chatRoom.upsert({
          where: { projectId: application.projectId },
          update: {},
          create: {
            projectId: application.projectId,
            clientId: application.project.clientId,
            talentId: application.team.leadId,
            reads: {
              create: [
                { userId: application.project.clientId },
                { userId: application.team.leadId },
              ],
            },
            messages: {
              create: {
                clientId: `system:application-selected:${id}`,
                type: "SYSTEM",
                body: "Request accepted. This private project chat is now active.",
              },
            },
          },
        });
      }

      return result;
    });
    await audit(auth, "application.status_changed", "application", id, { from: application.status, to: status });
    if (auth.role === "CLIENT") {
      const label = APPLICATION_STATUS_LABEL[status as keyof typeof APPLICATION_STATUS_LABEL];
      for (const m of updated.team.members.filter((x) => x.status === "ACCEPTED")) {
        await notify(m.user.id, "application.status", `Application ${label.toLowerCase()}`, `${updated.project.title}: your team "${updated.team.name}" was ${label.toLowerCase()}.${status === "SELECTED" ? " You can now submit your work." : ""}`, "/talent/dashboard?tab=applications");
      }
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("Update application status error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
