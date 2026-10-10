// Browser verification. Pass the path to an installed Playwright module.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI loads a caller-supplied Playwright module. */
// Usage: node scripts/check-intro.cjs <playwright-module-path> [base-url]
const assert = require("node:assert/strict");
const { chromium } = require(process.argv[2]);
const base = process.argv[3] || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const intro = page.locator("[data-intro-splash]");
  const begin = async () => {
    await page.goto(base + "/auth/login", { waitUntil: "domcontentloaded" });
    await intro.locator('[data-network]').waitFor({ state: "attached" });
    await page.waitForFunction(() => document.querySelector("[data-intro-splash]")?.dataset.phase === "playing");
  };
  const opacity = selector => page.locator(selector).evaluate(element => Number(getComputedStyle(element).opacity));
  const seek = async fraction => {
    await intro.evaluate((root, fraction) => root.getAnimations({ subtree: true }).forEach(animation => {
      animation.pause();
      animation.currentTime = 7600 * fraction;
    }), fraction);
  };
  try {
    await begin();
    assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
    await seek(.22);
    assert.ok(await opacity("[data-network]") > .9);
    assert.ok(await opacity("[data-brand]") < .1);
    assert.equal(await page.locator("[data-project]").count(), 3);
    await page.screenshot({ path: process.env.TEMP + "/certitask-intro-network.png" });
    const firstAvatar = page.locator("[data-network] img").first();
    await firstAvatar.hover();
    await page.mouse.move(340, 345);
    await seek(.5);
    assert.ok(await opacity("[data-checklist]") > .9);
    await seek(.72);
    assert.ok(await opacity("[data-certificate]") > .9);
    await page.screenshot({ path: process.env.TEMP + "/certitask-intro-certificate.png" });
    await seek(.9);
    assert.ok(await opacity("[data-brand]") > .9);
    await page.keyboard.press("Escape");
    await intro.waitFor({ state: "detached", timeout: 1000 });
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    // Previously saved dismissal flags must no longer suppress the intro.
    await page.evaluate(() => sessionStorage.setItem("certitask:intro:v3", "1"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector("[data-intro-splash]")?.dataset.phase === "playing");
    assert.equal(await intro.count(), 1);
    await page.keyboard.press("Escape");
    console.log("PASS: all scenes, three cards, Escape, scroll restoration, replay on refresh");

    await begin();
    await page.getByRole("button", { name: /Skip intro/ }).click();
    await intro.waitFor({ state: "detached", timeout: 1000 });
    console.log("PASS: click skip");

    await begin();
    const started = Date.now();
    await intro.waitFor({ state: "detached", timeout: 9500 });
    assert.ok(Date.now() - started > 6500, "Intro should not blink away");
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    console.log("PASS: natural completion after full sequence");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector("[data-intro-splash]")?.dataset.phase === "reduced");
    await seek(.22);
    assert.ok(await opacity("[data-network]") > .9);
    await seek(.5);
    assert.ok(await opacity("[data-checklist]") > .9);
    await seek(.72);
    assert.ok(await opacity("[data-certificate]") > .9);
    await page.keyboard.press("Escape");
    console.log("PASS: reduced motion retains all scenes using crossfades");

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 390, height: 844 });
    await begin();
    await seek(.72);
    const box = await page.locator("[data-certificate]").boundingBox();
    await page.screenshot({ path: process.env.TEMP + "/certitask-intro-mobile.png" });
    assert.ok(box.x >= 0 && box.x + box.width <= 390, JSON.stringify(box));
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, [], "No browser console errors or hydration warnings");
    console.log("PASS: mobile bounds and clean browser console");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
