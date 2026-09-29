import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PLANS } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/billing/payment/[id]
 * Returns the payment record for the checkout confirmation screen.
 * Only the owner or an admin may fetch it.
 */
export async function GET(_req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT", "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const p = await prisma.payment.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, legalName: true, email: true } },
      subscription: { select: { periodStart: true, periodEnd: true } },
    },
  });

  if (!p || (auth.role !== "ADMIN" && p.clientId !== auth.userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const planDef = p.plan ? PLANS[p.plan] : null;

  return NextResponse.json({
    id: p.id,
    plan: p.plan,
    planName: planDef?.name ?? "Plan",
    amountCents: p.amountCents,
    currency: p.currency,
    status: p.status,
    receiptNumber: p.receiptNumber,
    paidAt: p.paidAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    cardholder: p.client.legalName || p.client.name,
    periodStart: p.subscription?.periodStart?.toISOString() ?? null,
    periodEnd: p.subscription?.periodEnd?.toISOString() ?? null,
  });
}
