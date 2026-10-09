import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { sendEmailVerification } from "@/lib/email-verification";

/** POST /api/auth/resend-verification — re-send the confirmation link to the signed-in user. */
export async function POST() {
  try {
    const auth = await requireRole("CLIENT", "TALENT");
    if (auth instanceof NextResponse) return auth;

    if (await isRateLimited(`resend-verification:${auth.userId}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "You can request 3 codes per hour. Check your spam folder." }, { status: 429 });
    }
    const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { id: true, email: true, name: true, emailVerifiedAt: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.emailVerifiedAt) return NextResponse.json({ success: true, alreadyVerified: true });

    await sendEmailVerification(user);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[resend-verification] Failed to send code:", error);
    return NextResponse.json({ error: "We couldn't send a verification code right now. Please try again shortly." }, { status: 503 });
  }
}
