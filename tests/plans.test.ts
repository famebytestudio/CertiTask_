import { test } from "node:test";
import assert from "node:assert/strict";
import { planCatalog, planForAudience } from "../lib/plans";
import { environmentErrors } from "../scripts/check-env.mjs";
import { parseDeadline } from "../lib/projects";

test("Talent catalog advertises the enforced 6, 9, and 15 request limits without client perks", () => {
  const plans = planCatalog("TALENT");
  assert.deepEqual(plans.map(p => p.postLimit), [6, 9, 15]);
  for (const plan of plans) {
    assert.equal(plan.perks[0], `${plan.postLimit} project requests per 30 days`);
    assert.equal(plan.features.featured, false);
    assert.equal(plan.features.applicantFilters, false);
    assert.equal(plan.priceCents, planForAudience(plan.tier, "CLIENT").priceCents);
  }
  assert.equal(planForAudience("PRO", "CLIENT").postLimit, null);
});

test("Production readiness catches localhost, missing distributed limits, sandbox billing, and invalid prices", () => {
  const errors = environmentErrors({ DATABASE_URL: "postgresql://user:pass@db.test/db?sslmode=verify-full", JWT_SECRET: "x".repeat(32), APP_URL: "http://localhost:3000", SAFEPAY_ENV: "sandbox", PLAN_PRICE_STARTER_CENTS: "12.5" }, true);
  assert.ok(errors.some(error => error.includes("HTTPS")));
  assert.ok(errors.some(error => error.includes("UPSTASH_REDIS_REST_TOKEN")));
  assert.ok(errors.some(error => error.includes("SAFEPAY_ENV")));
  assert.ok(errors.some(error => error.includes("PLAN_PRICE_STARTER_CENTS")));
});

test("Date-only project deadlines use the full UTC day", () => {
  assert.equal(parseDeadline("2026-12-15")?.toISOString(), "2026-12-15T23:59:59.999Z");
  assert.equal(parseDeadline("not-a-date"), null);
});
