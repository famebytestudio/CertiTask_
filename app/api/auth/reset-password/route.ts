import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { isString } from "@/lib/validation";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await isRateLimited(`password-reset-complete:${clientKey}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reset attempts. Try again later." }, { status: 429 });
  }

  try {
    const body: unknown = await req.json();
    const token = body && typeof body === "object" && "token" in body ? body.token : undefined;
    const password = body && typeof body === "object" && "password" in body ? body.password : undefined;
    if (!isString(token, 128) || !isString(password, 128) || password.length < 8) {
      return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const resetToken = await tx.passwordResetToken.findFirst({
        where: {
          tokenHash: hashToken(token),
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true, userId: true },
      });
      if (!resetToken) return false;

      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return false;

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: await hashPassword(password) },
      });
      await tx.session.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return true;
    });

    if (!result) return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }
}