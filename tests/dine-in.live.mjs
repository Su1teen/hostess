// Read-only production evidence. Never POST, create an account/order, or mutate a wallet.
import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import { chromium, webkit, devices } from "playwright";
const origins = ["https://hostes.online", "https://hostess.sultansovetov2003.workers.dev"];
const evidence = { observedAt: new Date().toISOString(), checks: [], qr: [] };
for (const origin of origins) {
  for (const path of [
    "/",
    "/xoxo",
    "/guest",
    "/auth/claim",
    "/api/exchange/current-round",
    "/api/guest/v1/profile",
    "/api/guest/v1/dine-in/menu?venue=xoxo",
    "/api/guest/v1/loyalty/wallet?venue=xoxo",
  ]) {
    try {
      const response = await fetch(origin + path, {
        redirect: "manual",
        signal: AbortSignal.timeout(20000),
      });
      const body = await response.text();
      evidence.checks.push({
        origin,
        path,
        status: response.status,
        build: response.headers.get("x-hostess-build"),
        cache: response.headers.get("cache-control"),
        referrer: response.headers.get("referrer-policy"),
        ...(path.startsWith("/api/") && response.status >= 400
          ? { error: JSON.parse(body).error }
          : {}),
      });
    } catch (error) {
      evidence.checks.push({ origin, path, error: error.message });
    }
  }
}
for (const [engine, browserType, device] of [
  ["chromium", chromium, "Pixel 7"],
  ["webkit", webkit, "iPhone 13"],
]) {
  const browser = await browserType.launch({ headless: true });
  try {
    const context = await browser.newContext({ ...devices[device] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origins[0] + "/xoxo");
    await page.getByRole("heading", { name: /XOXO/ }).first().waitFor();
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    const requests = [];
    page.on("request", (r) => requests.push(r.url()));
    const sentinel = "audit-invalid-claim-" + "x".repeat(24);
    await page.goto(origins[0] + "/auth/claim#token=" + sentinel);
    await page.waitForFunction(() => location.hash === "");
    assert(!requests.some((url) => url.includes(sentinel)), "fragment token left browser in a URL");
    evidence.checks.push({
      engine,
      device,
      xoxoRendered: true,
      overflow,
      claimFragmentRemoved: true,
      claimTokenInRequestURL: false,
      pageErrors: errors,
    });
    if (process.env.HOSTESS_QR_MANIFEST) {
      const rows = JSON.parse(await readFile(process.env.HOSTESS_QR_MANIFEST, "utf8"));
      assert.equal(rows.length, 17);
      for (const row of rows) {
        const url = new URL(row.url);
        assert.equal(url.origin, origins[0]);
        await page.goto(url.href);
        await page.getByText("Стол №" + row.code, { exact: true }).waitFor();
        await page.reload();
        await page.getByText("Стол №" + row.code, { exact: true }).waitFor();
        evidence.qr.push({
          engine,
          code: row.code,
          resourceId: row.resourceId,
          directAndRefresh: "PASS",
        });
      }
    }
  } finally {
    await browser.close();
  }
}
if (!process.env.HOSTESS_QR_MANIFEST)
  evidence.qr.push({
    status: "BLOCKED",
    reason: "No authorized production QR manifest/staff session; no tokens generated.",
  });
await writeFile(
  process.env.HOSTESS_LIVE_EVIDENCE ?? "live-evidence.json",
  JSON.stringify(evidence, null, 2) + "\n",
);
console.log(JSON.stringify(evidence, null, 2));
