import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium, webkit } from "playwright";

const port = 5190;
const origin = `http://127.0.0.1:${port}`;
const engine = process.env.BROWSER_ENGINE ?? "chromium";
const output = process.env.SCREENSHOT_DIR;
if (output) fs.mkdirSync(output, { recursive: true });
const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port)],
  { stdio: "pipe", windowsHide: true },
);
let log = "";
server.stdout.on("data", (chunk) => {
  log += chunk;
});
server.stderr.on("data", (chunk) => {
  log += chunk;
});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const response = await fetch(`${origin}/`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* startup */
    }
    if (server.exitCode !== null) throw Error(log);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert(ready, `Vite did not start: ${log}`);
  browser = await { chromium, webkit }[engine].launch({ headless: true });
  const failures = [];
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    await context.addInitScript(() => localStorage.setItem("hostess-role", "guest"));
    const page = await context.newPage();
    page.on("pageerror", (error) => failures.push(error.message));
    await page.route("**/api/guest/v1/occupancy?*", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          updatedAt: new Date().toISOString(),
          signals: [
            {
              venueId: "xoxo",
              valuePercent: 35,
              level: "low",
              source: "staff_confirmed",
              updatedAt: new Date().toISOString(),
              staleAfter: 90,
              capacity: 17,
              occupiedUnits: 6,
            },
          ],
        }),
      }),
    );
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.locator(".discovery-marker__button").first().waitFor({ timeout: 30_000 });
    assert(await page.locator(".mapboxgl-ctrl-logo").isVisible(), "Mapbox attribution logo hidden");
    assert(
      await page.locator('.discovery-marker__button[aria-label^="XOXO"]').count(),
      "Connected XOXO must be visible on the initial map",
    );
    if (output)
      await page.screenshot({
        path: path.join(output, `map-${engine}-${viewport.width}-initial.png`),
      });
    const markerCounts = [];
    for (const zoom of [10, 13, 15, 17, 18]) {
      await page.evaluate(
        (value) =>
          window.dispatchEvent(
            new CustomEvent("hostess-map-test-view", {
              detail: { center: [71.4262, 51.1291], zoom: value },
            }),
          ),
        zoom,
      );
      await page.waitForTimeout(500);
      const count = await page.locator(".discovery-marker__button").count();
      markerCounts.push(count);
      assert(count > 0, `No markers at zoom ${zoom}`);
      if (output)
        await page.screenshot({
          path: path.join(output, `map-${engine}-${viewport.width}-zoom-${zoom}.png`),
        });
    }
    // The viewport covers less ground at close zoom, so counts need not be globally monotonic.
    assert(
      markerCounts[1] > markerCounts[0],
      "A district cluster must expand into individual venues",
    );
    await page.evaluate(() =>
      window.dispatchEvent(
        new CustomEvent("hostess-map-test-view", {
          detail: { center: [71.381633, 51.134284], zoom: 13.6 },
        }),
      ),
    );
    await page.waitForTimeout(500);
    const xoxo = page.locator('.discovery-marker__button[aria-label^="XOXO"]').first();
    if (await xoxo.count()) {
      await xoxo.click();
      await page.getByRole("button", { name: "Открыть заведение" }).waitFor();
      await page.locator('.rounded-hero img[src="/image/xobar1.png"]').waitFor();
      await page.waitForFunction(() => {
        const image = document.querySelector('.rounded-hero img[src="/image/xobar1.png"]');
        return image?.complete && image.naturalWidth > 0 && image.classList.contains("opacity-100");
      });
      if (output)
        await page.screenshot({
          path: path.join(output, `map-${engine}-${viewport.width}-selected-xoxo.png`),
        });
      await page.getByRole("button", { name: "Открыть заведение" }).click();
      await page.getByText("Биржа напитков").first().waitFor();
      if (output)
        await page.screenshot({
          path: path.join(output, `map-${engine}-${viewport.width}-xoxo-venue.png`),
        });
    }
    console.log(
      JSON.stringify({ engine, viewport, markerCounts, xoxoVisible: Boolean(await xoxo.count()) }),
    );
    await context.close();
  }
  assert.deepEqual(failures, []);
} finally {
  await browser?.close();
  server.kill();
}
