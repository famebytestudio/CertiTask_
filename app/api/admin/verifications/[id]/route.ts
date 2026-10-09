import { NextResponse } from "next/server";
import { background } from "@/lib/background";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isString } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { sendVerificationDecisionEmail } from "@/lib/email";
import { appUrl } from "@/lib/email-verification";
import { deliverCertificates, releaseHeldCertificates } from "@/lib/issue-certificates";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/verifications/[id]  { decision: "APPROVE" | "REJECT", reason? }
 * Approve: user becomes VERIFIED, legal name copied from the request, any held
 * certificates are issued. Reject: reason required; user may resubmit.
 */
export async function PATCH(req: Request, { params }: Params) {
  const authorization = await requireAdmin();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const { id } = await params;
    const { decision, reason } = await req.json();
    if (decision !== "APPROVE" && decision !== "REJECT") return NextResponse.json({ error: "Decision must be APPROVE or REJECT" }, { status: 400 });
    if (decision === "REJECT" && !isString(reason, 1000)) return NextResponse.json({ error: "Give the applicant a reason they can act on" }, { status: 400 });

    const request = await prisma.verificationRequest.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (request.status !== "PENDING_REVIEW") return NextResponse.json({ error: `This request was already ${request.status.toLowerCase().replace("_", " ")}` }, { status: 409 });

    const form = (request.formData ?? {}) as { legalName?: string };
    const approved = decision === "APPROVE";

    const released = await prisma.$transaction(async (tx) => {
      await tx.verificationRequest.update({
        where: { id },
        data: { status: approved ? "VERIFIED" : "REJECTED", reviewedAt: new Date(), reviewedBy: authorization.userId, rejectionReason: approved ? null : String(reason).trim() },
      });
      await tx.user.update({
        where: { id: request.userId },
        data: approved
          ? { verificationStatus: "VERIFIED", verifiedAt: new Date(), legalName: form.legalName ?? undefined }
          : { verificationStatus: "REJECTED" },
      });
      await audit(authorization, approved ? "verification.approved" : "verification.rejected", "verification_request", id, { userId: request.userId, kind: request.kind, reason: approved ? null : reason }, tx);
      await notify(
        request.userId,
        approved ? "verification.approved" : "verification.rejected",
        approved ? "You're verified ✓" : "Verification not approved",
        approved ? "Your verification was approved. Your profile now shows a Verified badge." : `Reason: ${String(reason).trim()}. You can fix it and resubmit.`,
        `/${request.user.role.toLowerCase()}/dashboard?tab=verification`,
        tx
      );
      return approved && request.user.role === "TALENT" ? await releaseHeldCertificates(tx, authorization, request.userId) : [];
    }, { maxWait: 10_000, timeout: 60_000 });

    if (released.length > 0) background("Certificate delivery", () => deliverCertificates(released));
    background("Verification decision email", () => sendVerificationDecisionEmail(request.user.email, request.user.name, approved, approved ? null : String(reason).trim(), `${appUrl()}/${request.user.role.toLowerCase()}/dashboard?tab=verification`));

    return NextResponse.json({ success: true, status: approved ? "VERIFIED" : "REJECTED", certificatesReleased: released.length });
  } catch (error) {
    console.error("Verification decision error:", error);
    return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
  }
}
