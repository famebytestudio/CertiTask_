import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendVerifyEmailEmail } from "@/lib/email";
import { appUrl } from "@/lib/app-url";

export { appUrl };

const TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Create a fresh single-use token (invalidating older ones) and email the link. */
export async function sendEmailVerification(user: { id: string; email: string; name: string }): Promise<void> {
  const raw = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + TTL_MS) },
    }),
  ]);
  try {
    const url = `${appUrl()}/auth/verify-email?token=${raw}`;
    await sendVerifyEmailEmail(user.email, user.name, url);
  } catch (err) {
    console.error("verification email failed:", err);
  }
}

/** Consume a token. Returns the user id on success, null if invalid/expired/used. */
export async function confirmEmailToken(raw: string): Promise<string | null> {
  const tokenHash = hashToken(raw);
  return prisma.$transaction(async (tx) => {
    const t = await tx.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });
    if (!t) return null;
    const claimed = await tx.emailVerificationToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
    if (claimed.count !== 1) return null;
    await tx.user.update({ where: { id: t.userId }, data: { emailVerifiedAt: new Date() } });
    return t.userId;
  }, { maxWait: 10_000, timeout: 30_000 });
}
