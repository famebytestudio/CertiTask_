import { NextResponse } from "next/server";
import { background } from "@/lib/background";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isString } from "@/lib/validation";
import { submissionInclude } from "@/lib/queries";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { deliverCertificates, issueCertificatesForSubmission } from "@/lib/issue-certificates";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/submissions/[id] — project owner reviews a submission.
 * - APPROVED: one-step approval; certificates are issued to every accepted team
 *   member in the same transaction (FR-C8, FR-V1).
 * - REJECTED: feedback is required; the team may resubmit.
 */
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { status, feedback } = await req.json();

    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Status must be APPROVED or REJECTED" }, { status: 400 });
    }
    if (status === "REJECTED" && !isString(feedback, 5000)) {
      return NextResponse.json({ error: "Tell the team what needs to change" }, { status: 400 });
    }
    if (feedback !== undefined && feedback !== null && feedback !== "" && !isString(feedback, 5000)) {
      return NextResponse.json({ error: "Feedback is too long" }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { project: { select: { clientId: true } } },
    });
    if (!submission || submission.project.clientId !== auth.userId) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (submission.status === "APPROVED") {
      return NextResponse.json({ error: "This submission is already approved" }, { status: 409 });
    }

    const { updated, result } = await prisma.$transaction(async (tx) => {
      const updated = await tx.submission.update({
        where: { id },
        data: {
          status,
          feedback: feedback ? String(feedback).trim() : null,
          reviewedAt: new Date(),
        },
        include: submissionInclude,
      });
      await audit(auth, status === "APPROVED" ? "submission.approved" : "submission.rejected", "submission", id, { from: submission.status }, tx);

      const result = status === "APPROVED"
        ? await issueCertificatesForSubmission(tx, auth, id)
        : { issued: [] as string[], held: [] as string[] };
      if (status === "REJECTED") {
        for (const m of updated.team.members.filter((x) => x.status === "ACCEPTED")) {
          await notify(m.user.id, "submission.reviewed", "Changes requested", `${updated.project.title}: the client asked for changes. See their feedback and resubmit.`, "/talent/dashboard?tab=submissions", tx);
        }
      }
      return { updated, result };
    }, { maxWait: 10_000, timeout: 60_000 }); // remote DB: several sequential round trips

    // Email delivery happens after commit and never blocks the response.
    if (result.issued.length > 0) background("Certificate delivery", () => deliverCertificates(result.issued));

    return NextResponse.json({ success: true, submission: updated, certificatesIssued: result.issued.length, certificatesHeld: result.held.length });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Failed to review submission" }, { status: 500 });
  }
}
