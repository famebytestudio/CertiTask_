import { afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { POST as resetPassword } from "../app/api/auth/reset-password/route";
import { POST as forgotPassword } from "../app/api/auth/forgot-password/route";
import { confirmEmailOtp, sendEmailVerification } from "../lib/email-verification";
import { parseResetToken } from "../lib/reset-token";
import { verifyPassword } from "../lib/auth";

const globals = globalThis as unknown as { prisma?: PrismaClient };
const previousClient = globals.prisma;
const previousEnv = { ...process.env };
afterEach(() => {
  globals.prisma = previousClient;
  mock.restoreAll();
  for (const key of Object.keys(process.env)) if (!(key in previousEnv)) delete process.env[key];
  Object.assign(process.env, previousEnv);
});

function database(value: object) {
  globals.prisma = value as PrismaClient;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

let requestId = 0;
function request(body: object) {
  return new Request("https://certitask.test/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `test-${++requestId}` },
    body: JSON.stringify(body),
  });
}

function smtp(fail: boolean) {
  Object.assign(process.env, { SMTP_HOST: "smtp.test", SMTP_PORT: "587", SMTP_USER: "test", SMTP_PASS: "test", APP_URL: "https://certitask.test" });
  mock.method(nodemailer, "createTransport", () => ({
    sendMail: async () => {
      if (fail) throw new Error("SMTP unavailable");
      return {};
    },
  }));
}

test("Reset accepts an email link or token, but never a six-digit verification code", () => {
  const token = "a".repeat(64);
  assert.equal(parseResetToken(` ${token} `), token);
  assert.equal(parseResetToken(`https://certitask.test/auth/reset-password?token=${token}`), token);
  assert.equal(parseResetToken("123456"), null);
  assert.equal(parseResetToken("https://certitask.test/auth/reset-password"), null);
});

test("Reset infrastructure failures are retryable, not reported as expired links", async () => {
  database({ $transaction: async () => { throw new Error("Database connection timeout"); } });
  mock.method(console, "error", () => {});
  const response = await resetPassword(request({ token: "a".repeat(64), password: "New-password-123" }));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /temporarily unavailable/);
});

test("Expired or unknown reset tokens never update passwords", async () => {
  const update = mock.fn();
  const tx = { passwordResetToken: { findFirst: async () => null }, user: { update } };
  database({ $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx) });
  const response = await resetPassword(request({ token: "b".repeat(64), password: "New-password-123" }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /expired/);
  assert.equal(update.mock.callCount(), 0);
});

test("A reset changes the password, revokes sessions and invalidates sibling links only after a successful claim", async () => {
  let consumed = false;
  let passwordHash = "";
  const revoke = mock.fn(async () => ({ count: 2 }));
  const removeSiblings = mock.fn(async () => ({ count: 1 }));
  const tx = {
    passwordResetToken: {
      findFirst: async () => consumed ? null : { id: "reset", userId: "user" },
      updateMany: async () => { consumed = true; return { count: 1 }; },
      deleteMany: removeSiblings,
    },
    user: { update: async ({ data }: { data: { password: string } }) => { passwordHash = data.password; } },
    session: { updateMany: revoke },
  };
  database({ $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx) });
  const body = { token: "c".repeat(64), password: "New-password-123" };
  assert.equal((await resetPassword(request(body))).status, 200);
  assert.equal(await verifyPassword(body.password, passwordHash), true);
  assert.equal(revoke.mock.callCount(), 1);
  assert.equal(removeSiblings.mock.callCount(), 1);
  assert.equal((await resetPassword(request(body))).status, 400);
});

test("Failed reset email delivery removes only the new token, leaving existing links usable", async () => {
  smtp(true);
  const deleted: string[] = [];
  database({
    user: { findUnique: async () => ({ id: "user", email: "user@example.test" }) },
    passwordResetToken: {
      create: async () => ({ id: "new-token" }),
      delete: async ({ where }: { where: { id: string } }) => { deleted.push(where.id); },
      deleteMany: () => { assert.fail("Issuing a link must not delete older links"); },
    },
  });
  assert.equal((await forgotPassword(request({ email: "user@example.test" }))).status, 503);
  assert.deepEqual(deleted, ["new-token"]);
});

test("OTP rejects wrong and expired codes and consumes valid codes once", async () => {
  let used = false;
  let expired = false;
  const tokenHash = createHash("sha256").update("user:001234").digest("hex");
  const updateUser = mock.fn(async () => ({}));
  const tx = {
    emailVerificationToken: {
      findFirst: async ({ where }: { where: { tokenHash: string; userId: string; usedAt: null; expiresAt: { gt: Date } } }) => {
        assert.equal(where.usedAt, null);
        assert.ok(where.expiresAt.gt instanceof Date);
        return !used && !expired && where.userId === "user" && where.tokenHash === tokenHash ? { id: "otp" } : null;
      },
      updateMany: async () => { used = true; return { count: 1 }; },
      deleteMany: async () => ({ count: 0 }),
    },
    user: { update: updateUser },
  };
  database({ $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx) });
  assert.equal(await confirmEmailOtp("user", "999999"), false);
  assert.equal(await confirmEmailOtp("someone-else", "001234"), false);
  expired = true;
  assert.equal(await confirmEmailOtp("user", "001234"), false);
  expired = false;
  assert.equal(await confirmEmailOtp("user", "001234"), true);
  assert.equal(await confirmEmailOtp("user", "001234"), false);
  assert.equal(updateUser.mock.callCount(), 1);
});

test("Failed OTP delivery cleans up the new code without invalidating previous codes", async () => {
  smtp(true);
  mock.method(console, "error", () => {});
  const expiry = new Date();
  const deleted: unknown[] = [];
  database({ emailVerificationToken: {
    create: async () => ({ id: "new-otp", expiresAt: expiry }),
    deleteMany: async (args: unknown) => { deleted.push(args); return { count: 1 }; },
  } });
  await assert.rejects(sendEmailVerification({ id: "user", name: "User", email: "user@example.test" }), /SMTP/);
  assert.deepEqual(deleted, [{ where: { id: "new-otp", expiresAt: expiry, usedAt: null } }]);
});
