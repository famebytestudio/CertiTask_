import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
import { appUrl } from "../lib/app-url";
import { safepay } from "../lib/payments/safepay";
import { signToken, verifyToken } from "../lib/auth-token";
import { detectMimeType } from "../lib/storage";
import { COOKIE_NAME } from "../lib/auth-constants";

const savedEnv = { ...process.env };
afterEach(() => { for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key]; Object.assign(process.env, savedEnv); });

test("Browser mutations reject a foreign origin while signed webhook requests reach the handler", async () => {
  process.env.APP_URL = "https://certitask.test";
  const blocked = await proxy(new NextRequest("https://certitask.test/api/projects", { method: "POST", headers: { origin: "https://foreign.test" } }));
  assert.equal(blocked.status, 403);
  const webhook = await proxy(new NextRequest("https://certitask.test/api/safepay/webhook", { method: "POST" }));
  assert.equal(webhook.headers.get("x-middleware-next"), "1");
  const accepted = await proxy(new NextRequest("https://certitask.test/api/projects", { method: "POST", headers: { origin: "https://certitask.test" } }));
  assert.equal(accepted.headers.get("x-middleware-next"), "1");
});

test("Webhook signatures reject missing, altered, and incorrect payloads", () => {
  process.env.SAFEPAY_WEBHOOK_SECRET = "regression-test-secret";
  delete process.env.SAFEPAY_PUBLIC_KEY;
  delete process.env.SAFEPAY_SECRET_KEY;
  const body = JSON.stringify({ tracker: "tracker-test" });
  const signature = createHmac("sha512", process.env.SAFEPAY_WEBHOOK_SECRET).update(body).digest("hex");
  assert.equal(safepay.verifyWebhook(body, signature), true);
  assert.equal(safepay.verifyWebhook(body + " ", signature), false);
  assert.equal(safepay.verifyWebhook(body, "bad-signature"), false);
  assert.equal(safepay.verifyWebhook(body, null), false);
});

test("JWT rejects tampering and enforces dashboard role isolation", async () => {
  process.env.JWT_SECRET = "regression-only-secret-with-more-than-32-characters";
  const payload = { userId: "talent-test", email: "talent@example.test", name: "Talent", role: "TALENT" as const };
  const token = await signToken(payload);
  assert.deepEqual(await verifyToken(token), payload);
  const parts = token.split(".");
  parts[1] = Buffer.from(JSON.stringify({ ...payload, role: "ADMIN" })).toString("base64url");
  assert.equal(await verifyToken(parts.join(".")), null);
  const response = await proxy(new NextRequest("https://certitask.test/client/dashboard", { headers: { cookie: `${COOKIE_NAME}=${token}` } }));
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location")!).pathname, "/talent/dashboard");
});

test("App links resolve preview and production domains and require HTTPS in production", () => {
  delete process.env.APP_URL;
  Object.assign(process.env, { NODE_ENV: "production" });
  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_URL = "preview.certitask.test";
  assert.equal(appUrl(), "https://preview.certitask.test");
  process.env.VERCEL_ENV = "production";
  process.env.VERCEL_PROJECT_PRODUCTION_URL = "certitask.test";
  assert.equal(appUrl(), "https://certitask.test");
  process.env.APP_URL = "http://certitask.test";
  assert.throws(() => appUrl(), /HTTPS/);
});

test("File validation rejects a disguised executable and recognizes supported file headers", () => {
  assert.equal(detectMimeType(Buffer.from("MZ-this-is-not-an-image")), null);
  assert.equal(detectMimeType(Buffer.from("%PDF-1.7\ncontent")), "application/pdf");
  assert.equal(detectMimeType(Buffer.from([0xff, 0xd8, 0xff, ...Array(9).fill(0)])), "image/jpeg");
  assert.equal(detectMimeType(Buffer.from("RIFF0000WEBPcontent")), "image/webp");
});
