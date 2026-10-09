import { spawnSync } from "node:child_process";
import { checkEnvironment } from "./check-env.mjs";

const production = process.env.VERCEL_ENV === "production";
if (!checkEnvironment(production)) process.exit(1);

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("node_modules/prisma/build/index.js", ["generate"]);
// Preview deployments must never migrate a production database.
if (production && process.env.DATABASE_URL) {
  try {
    const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { stdio: "inherit", env: process.env });
    if (result.status !== 0) {
      console.warn("Prisma migrate deploy exited with code", result.status, "- continuing build.");
    }
  } catch (err) {
    console.warn("Prisma migrate deploy skipped:", err?.message || err);
  }
}
run("node_modules/next/dist/bin/next", ["build"]);
