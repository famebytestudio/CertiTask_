import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { isString } from "@/lib/validation";

// Force dynamic — never let Vercel cache this route
export const dynamic = "force-dynamic";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (await isRateLimited(`password-reset-complete:${clientKey}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reset attempts. Try again later." }, { status: 429 });
  }

  let token: unknown;
  let password: unknown;
  try {
    const body: unknown = await req.json();
    token = body && typeof body === "object" && "token" in body ? body.token : undefined;
    password = body && typeof body === "object" && "password" in body ? body.password : undefined;
  } catch {
    console.error("[reset-password] Failed to parse request body");
    return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
  }

  // --- Diagnostic logging (no secrets logged) ---
  const tokenLen = typeof token === "string" ? token.length : "not-a-string";
  console.log(`[reset-password] token_length=${tokenLen} client=${clientKey}`);

  if (!isString(token, 128) || !isString(password, 128) || password.length < 8) {
    console.log(`[reset-password] REJECTED: validation failed token_ok=${isString(token, 128)} pwd_ok=${isString(password, 128)}`);
    return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
  }

  try {
    const tokenHash = hashToken(token);
    const now = new Date();
    console.log(`[reset-password] Looking up token hash (first 8 chars): ${tokenHash.slice(0, 8)}... at UTC=${now.toISOString()}`);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const resetToken = await tx.passwordResetToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: now },
        },
        select: { id: true, userId: true, expiresAt: true },
      });

      if (!resetToken) {
        // Extra diagnostic: check if token exists but is expired/used
        const anyToken = await tx.passwordResetToken.findFirst({
          where: { tokenHash },
          select: { usedAt: true, expiresAt: true },
        });
        if (anyToken) {
          console.log(`[reset-password] Token found but invalid: usedAt=${anyToken.usedAt?.toISOString() ?? "null"} expiresAt=${anyToken.expiresAt.toISOString()} now=${now.toISOString()} expired=${anyToken.expiresAt <= now}`);
        } else {
          console.log(`[reset-password] Token NOT found in DB (hash mismatch or never existed)`);
        }
        return false;
      }

      console.log(`[reset-password] Token found: userId=${resetToken.userId} expiresAt=${resetToken.expiresAt.toISOString()}`);

      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) {
        console.log(`[reset-password] RACE: token already claimed (claimed.count=${claimed.count})`);
        return false;
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: await hashPassword(password as string) },
      });
      await tx.session.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return resetToken.userId;
    });

    if (!result) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    console.log(`[reset-password] SUCCESS userId=${result}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password] EXCEPTION:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }
}