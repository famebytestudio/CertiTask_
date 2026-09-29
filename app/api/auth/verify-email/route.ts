import { NextResponse } from "next/server";
import { confirmEmailOtp } from "@/lib/email-verification";
import { isRateLimited } from "@/lib/rate-limit";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

// Force dynamic — never let Vercel cache this route
export const dynamic = "force-dynamic";

/** POST /api/auth/verify-email { otp } — validate a 6-digit OTP for the signed-in user. */
export async function POST(req: Request) {
  // User must be logged in (session cookie set at signup)
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;

  // Rate-limit by userId — max 10 attempts per hour
  if (await isRateLimited(`verify-email-otp:${auth.userId}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Wait a while and try again." }, { status: 429 });
  }

  let otp: unknown;
  try {
    const body = await req.json();
    otp = body?.otp;
  } catch {
    console.error("[verify-email] Failed to parse request body");
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Must be exactly 6 digits
  if (typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
    console.log(`[verify-email] Invalid OTP format: length=${typeof otp === "string" ? otp.length : "non-string"}`);
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  try {
    const ok = await confirmEmailOtp(auth.userId, otp.trim());
    if (!ok) {
      return NextResponse.json(
        { error: "Incorrect code or it has expired. Request a new one below." },
        { status: 400 }
      );
    }

    await audit("system", "user.email_verified", "user", auth.userId);
    console.log(`[verify-email] SUCCESS userId=${auth.userId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-email] EXCEPTION:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
