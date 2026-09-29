import { NextResponse } from "next/server";
import { confirmEmailToken } from "@/lib/email-verification";
import { isRateLimited } from "@/lib/rate-limit";
import { isString } from "@/lib/validation";
import { audit } from "@/lib/audit";

// Force dynamic — never let Vercel cache this route
export const dynamic = "force-dynamic";

/** POST /api/auth/verify-email { token } — consume an email-verification link. */
export async function POST(req: Request) {
  const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (await isRateLimited(`verify-email:${clientKey}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let token: unknown;
  try {
    const body = await req.json();
    token = body?.token;
  } catch {
    console.error("[verify-email] Failed to parse request body");
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // --- Diagnostic logging (no secrets logged) ---
  const tokenLen = typeof token === "string" ? token.length : "not-a-string";
  console.log(`[verify-email] token_length=${tokenLen} client=${clientKey}`);

  if (!isString(token, 128)) {
    console.log(`[verify-email] REJECTED: token failed isString check (length=${tokenLen})`);
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  try {
    const result = await confirmEmailToken(token);
    console.log(`[verify-email] confirmEmailToken result=${result === null ? "null (not found / expired / used)" : "userId:" + result}`);

    if (!result) {
      return NextResponse.json(
        { error: "This link is invalid or has expired. Request a new one from your dashboard." },
        { status: 400 }
      );
    }

    await audit("system", "user.email_verified", "user", result);
    console.log(`[verify-email] SUCCESS userId=${result}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    // Log the real error so it appears in Vercel logs
    console.error("[verify-email] EXCEPTION during confirmEmailToken:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 400 });
  }
}
