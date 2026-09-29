import { NextResponse } from "next/server";
import { confirmEmailToken } from "@/lib/email-verification";
import { isRateLimited } from "@/lib/rate-limit";
import { isString } from "@/lib/validation";
import { audit } from "@/lib/audit";

/** POST /api/auth/verify-email { token } — consume an email-verification link. */
export async function POST(req: Request) {
  const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await isRateLimited(`verify-email:${clientKey}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  try {
    const { token } = await req.json();
    if (!isString(token, 128)) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    const userId = await confirmEmailToken(token);
    if (!userId) return NextResponse.json({ error: "This link is invalid or has expired. Request a new one from your dashboard." }, { status: 400 });
    await audit("system", "user.email_verified", "user", userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 400 });
  }
}
