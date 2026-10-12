import { NextResponse } from "next/server";

/**
 * POST /api/safepay/webhook — Safepay notifies us of tracker events.
 * The raw body is used for the HMAC check. The payload's own state is never
 * trusted: the tracker is looked up and confirmPayment asks Safepay directly.
 */
export async function POST() {
  return NextResponse.json({ error: "Payment integration disabled" }, { status: 410 });
}
