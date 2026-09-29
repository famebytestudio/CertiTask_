import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendVerifyEmailOtp } from "@/lib/email";
import { appUrl } from "@/lib/app-url";

export { appUrl };

/** OTP expires in 15 minutes */
const OTP_TTL_MS = 15 * 60 * 1000;

/** Generate a cryptographically random 6-digit OTP string (zero-padded). */
function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Hash is keyed on both userId and otp so two users with the same 6 digits
 * produce different hashes, and the UNIQUE constraint on tokenHash is safe.
 */
function hashOtp(userId: string, otp: string): string {
  return createHash("sha256").update(`${userId}:${otp}`).digest("hex");
}

/** Send a fresh 6-digit OTP to the user's email address. */
export async function sendEmailVerification(user: { id: string; email: string; name: string }): Promise<void> {
  const otp = generateOtp();
  const tokenHash = hashOtp(user.id, otp);

  // Create the new OTP token first
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  try {
    await sendVerifyEmailOtp(user.email, user.name, otp);
    // Only clean up old unused tokens after successful delivery
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, usedAt: null, tokenHash: { not: tokenHash } },
    });
  } catch (err) {
    console.error("[email-verification] OTP email failed:", err);
    // Roll back the token we just created so user can request a fresh one
    await prisma.emailVerificationToken
      .deleteMany({ where: { userId: user.id, tokenHash, usedAt: null } })
      .catch(() => {});
  }
}

/**
 * Validate a submitted OTP for a given user.
 * Returns true on success (and marks the token used + user verified).
 * Returns false if the OTP is wrong, expired, or already used.
 */
export async function confirmEmailOtp(userId: string, otp: string): Promise<boolean> {
  const tokenHash = hashOtp(userId, otp.trim());
  const now = new Date();

  console.log(`[verify-otp] userId=${userId} hash_prefix=${tokenHash.slice(0, 8)}... now=${now.toISOString()}`);

  return prisma.$transaction(async (tx) => {
    const t = await tx.emailVerificationToken.findFirst({
      where: { userId, tokenHash, usedAt: null, expiresAt: { gt: now } },
      select: { id: true, expiresAt: true },
    });

    if (!t) {
      // Diagnostic: check if the token exists but is expired/used
      const any = await tx.emailVerificationToken.findFirst({
        where: { tokenHash },
        select: { usedAt: true, expiresAt: true },
      });
      if (any) {
        console.log(`[verify-otp] Token found but invalid: usedAt=${any.usedAt?.toISOString() ?? "null"} expiresAt=${any.expiresAt.toISOString()} expired=${any.expiresAt <= now}`);
      } else {
        console.log(`[verify-otp] Token NOT found in DB (wrong OTP or userId)`);
      }
      return false;
    }

    console.log(`[verify-otp] Token matched, expiresAt=${t.expiresAt.toISOString()}`);

    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: t.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) {
      console.log(`[verify-otp] Race condition: token already claimed`);
      return false;
    }

    await tx.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
    return true;
  }, { maxWait: 10_000, timeout: 30_000 });
}
