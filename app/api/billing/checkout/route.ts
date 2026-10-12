import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

/** POST /api/billing/checkout { plan } — start a hosted checkout for a client or talent. */
export async function POST() {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ error: "Online payments are temporarily unavailable", code: "PAYMENTS_DISABLED" }, { status: 503 });
}
