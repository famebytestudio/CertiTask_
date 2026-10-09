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
  // Keep delivered codes usable until expiry if a resend fails or overlaps.
  // Retry random collisions rather than reviving or overwriting an old code.
  const issue = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const otp = generateOtp();
      try {
        const token = await prisma.emailVerificationToken.create({
          data: { userId: user.id, tokenHash: hashOtp(user.id, otp), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
        });
        return { otp, token };
      } catch (error) {
        if (attempt === 2 || !error || typeof error !== "object" || !("code" in error) || error.code !== "P2002") throw error;
      }
    }
    throw new Error("Unable to issue a verification code");
  };
  const { otp, token } = await issue();

  try {
    await sendVerifyEmailOtp(user.email, user.name, otp);

  } catch (err) {
    console.error("[send-otp] OTP email delivery failed:", err);
    // Roll back the token we just created so user can request a fresh one
    await prisma.emailVerificationToken
      .deleteMany({ where: { id: token.id, expiresAt: token.expiresAt, usedAt: null } })
      .catch(() => {});
    throw err;
  }
}

/**
 * Validate a submitted OTP for a given user.
 * Returns true on success (and marks the token used + user verified).
 * Returns false if the OTP is wrong, expired, or already used.
 */
export async function confirmEmailOtp(userId: string, rawOtp: string): Promise<boolean> {
  const cleanOtp = rawOtp.replace(/\D/g, "");
  const tokenHash = hashOtp(userId, cleanOtp);
  const now = new Date();


  return prisma.$transaction(async (tx) => {
    const t = await tx.emailVerificationToken.findFirst({
      where: { userId, tokenHash, usedAt: null, expiresAt: { gt: now } },
      select: { id: true, expiresAt: true },
    });

    if (!t) {
      return false;
    }


    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: t.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) {

      return false;
    }

    await tx.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
    // Clean up all remaining unused tokens for this user
    await tx.emailVerificationToken.deleteMany({ where: { userId, usedAt: null } });
    return true;
  }, { maxWait: 10_000, timeout: 30_000 });
}
