import * as nextEnv from "@next/env";
import { pathToFileURL } from "node:url";

const loadEnvConfig = nextEnv.loadEnvConfig ?? nextEnv.default?.loadEnvConfig;

/** Return configuration errors without ever printing credential values. */
export function environmentErrors(env, production = false) {
  const errors = [];
  const requireValue = (key) => {
    if (!env[key]?.trim() || /replace-with|USER:PASSWORD|your-.*-token/i.test(env[key])) errors.push(`${key} must be configured`);
  };
  requireValue("DATABASE_URL");
  requireValue("JWT_SECRET");
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) errors.push("JWT_SECRET must contain at least 32 characters");
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    if (!env[key]) continue;
    try {
      const url = new URL(env[key]);
      if (!["postgres:", "postgresql:"].includes(url.protocol)) errors.push(`${key} must be a PostgreSQL URL`);
      if (production && !["require", "verify-full"].includes(url.searchParams.get("sslmode"))) errors.push(`${key} must use sslmode=require or sslmode=verify-full`);
    } catch { errors.push(`${key} must be a valid PostgreSQL URL`); }
  }
  if (env.APP_URL) {
    try {
      const url = new URL(env.APP_URL);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) errors.push("APP_URL must be an origin without credentials, a path, or a query string");
      if (production && url.protocol !== "https:") errors.push("APP_URL must use HTTPS in production");
    } catch { errors.push("APP_URL must be a valid absolute URL"); }
  } else if (production) requireValue("APP_URL");

  if (production) {
    for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD_HASH", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "CRON_SECRET", "SAFEPAY_PUBLIC_KEY", "SAFEPAY_SECRET_KEY", "SAFEPAY_WEBHOOK_SECRET"]) requireValue(key);
    if (env.SUPER_ADMIN_PASSWORD_HASH && !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(env.SUPER_ADMIN_PASSWORD_HASH)) errors.push("SUPER_ADMIN_PASSWORD_HASH must be a valid bcrypt hash (paste the unescaped hash in Vercel)");
    if (env.SAFEPAY_ENV !== "production") errors.push("SAFEPAY_ENV must be production for a production launch");
    if (env.SAFEPAY_BASE_URL && env.SAFEPAY_BASE_URL.replace(/\/$/, "") !== "https://api.getsafepay.com") errors.push("SAFEPAY_BASE_URL must use the production Safepay endpoint");
    if (env.CRON_SECRET && env.CRON_SECRET.length < 32) errors.push("CRON_SECRET must contain at least 32 characters");
  }
  if (env.SMTP_PORT && (!/^\d+$/.test(env.SMTP_PORT) || Number(env.SMTP_PORT) < 1 || Number(env.SMTP_PORT) > 65535)) errors.push("SMTP_PORT must be a valid TCP port");
  for (const key of ["PLAN_PRICE_STARTER_CENTS", "PLAN_PRICE_GROWTH_CENTS", "PLAN_PRICE_PRO_CENTS"]) {
    if (env[key] && (!/^\d+$/.test(env[key]) || !Number.isSafeInteger(Number(env[key])) || Number(env[key]) <= 0)) errors.push(`${key} must be a positive whole number of cents`);
  }
  if (env.FREE_POSTS && (!/^\d+$/.test(env.FREE_POSTS) || !Number.isSafeInteger(Number(env.FREE_POSTS)))) errors.push("FREE_POSTS must be a nonnegative whole number");
  if (Boolean(env.UPSTASH_REDIS_REST_URL) !== Boolean(env.UPSTASH_REDIS_REST_TOKEN)) errors.push("Configure both Upstash variables together");
  return errors;
}

export function checkEnvironment(production = false) {
  loadEnvConfig(process.cwd());
  const errors = environmentErrors(process.env, production);
  if (errors.length) {
    console.error(`Environment check failed:\n${errors.map(error => `- ${error}`).join("\n")}`);
    return false;
  }
  console.log(`Environment check passed (${production ? "production" : "development/preview"}).`);
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = checkEnvironment(process.argv.includes("--production")) ? 0 : 1;
}
