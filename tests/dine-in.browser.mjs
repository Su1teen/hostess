// Isolated fixtures: this is not a production or PostgreSQL acceptance test.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium, webkit, devices } from "playwright";
const engine = process.env.BROWSER_ENGINE ?? "chromium";
const device = process.env.BROWSER_DEVICE ?? "mobile";
const port = Number(process.env.BROWSER_PORT ?? 5187),
  origin = "http://127.0.0.1:" + port;
const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port)],
  { stdio: "pipe", windowsHide: true },
);
let logs = "",
  browser;
server.stdout.on("data", (d) => {
  logs += d;
});
server.stderr.on("data", (d) => {
  logs += d;
});
try {
  let up = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(origin + "/guest-claim.css", { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        up = true;
        break;
      }
    } catch {
      /* still starting */
    }
    if (server.exitCode !== null) throw Error(logs);
    await new Promise((r) => setTimeout(r, 500));
  }
  assert(up, "Vite did not start: " + logs);
  browser = await { chromium, webkit }[engine].launch({ headless: true });
  const context = await browser.newContext({
    ...(device === "desktop"
      ? { viewport: { width: 1440, height: 900 } }
      : devices[engine === "webkit" ? "iPhone 13" : "Pixel 7"]),
    ...(process.env.BROWSER_VIEWPORT
      ? {
          viewport: {
            width: Number(process.env.BROWSER_VIEWPORT.split("x")[0]),
            height: Number(process.env.BROWSER_VIEWPORT.split("x")[1]),
          },
        }
      : {}),
    reducedMotion: "reduce",
  });
  const page = await context.newPage(),
    failures = [];
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(30000);
  page.on("pageerror", (e) => failures.push(e.message));
  const tokens = new Map(
    Array.from({ length: 17 }, (_, i) => {
      const c = String(i + 1).padStart(2, "0");
      return ["test-token-" + c + "-" + "a".repeat(32), c];
    }),
  );
  const accessToken = "visit_" + "c".repeat(43);
  tokens.set(accessToken, "01");
  const webResourceId = "00000000-0000-4000-8000-000000000008";
  tokens.set(`web_${webResourceId}`, "08");
  const urlFor = (c) => origin + "/v/xoxo/t/" + c + "/test-token-" + c + "-" + "a".repeat(32);
  const productId = "11111111-1111-4111-8111-111111111111";
  let profile = null,
    round = "round-1",
    quotesN = 0,
    ordersN = 0,
    loseResponse = false,
    menuOffline = false,
    expireNext = false,
    lastInput;
  const regularId = "22222222-2222-4222-8222-222222222222";
  const shots = process.env.SCREENSHOT_DIR;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const shot = async (name) => {
    if (shots)
      await page.screenshot({
        path: path.join(shots, `${engine}-${process.env.BROWSER_VIEWPORT ?? device}-${name}.png`),
        fullPage: true,
      });
  };
  const openMarket = async () => {
    await page.getByRole("button", { name: /XOXO MARKET Биржа напитков/ }).click();
  };
  await page.route("**/api/exchange/history?*", async (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ generatedAt: new Date().toISOString(), currency: "KZT", rounds: [] }),
    }),
  );
  const quotes = new Map(),
    orders = new Map(),
    submissions = [];
  await page.route("**/api/guest/v1/**", async (route) => {
    const req = route.request(),
      u = new URL(req.url()),
      p = u.pathname.replace("/api/guest/v1", "");
    const send = (body, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/dine-in/tables")
      return send({
        venue: { id: "venue-1", slug: "xoxo", name: "XOXO", currency: "KZT" },
        tables: [
          {
            resourceId: webResourceId,
            code: "08",
            name: "Стол 08",
            zoneName: "Первый зал",
            zoneId: "00000000-0000-4000-8000-000000000001",
          },
        ],
      });
    if (p === "/dine-in/access/claim") {
      assert.equal(req.postDataJSON().code, "AABBCCDDEE");
      return send({ accessToken });
    }
    if (p === "/profile")
      return profile
        ? send({ guest: profile, reservations: [] })
        : send({ error: { code: "SESSION_REQUIRED", message: "Войдите" } }, 401);
    if (p === "/bootstrap") {
      const b = req.postDataJSON();
      assert.equal(b.consent, true);
      profile = { id: "guest-1", name: b.name, phone: b.phone, provisional: true };
      return send({ guestId: profile.id }, 201);
    }
    if (p === "/logout") {
      profile = null;
      return send({ ok: true });
    }
    if (p === "/ownership") return send({ claimCode: "c".repeat(43) });
    if (p.startsWith("/dine-in/tables/")) {
      const code = tokens.get(decodeURIComponent(p.split("/").at(-1)));
      return code
        ? send({
            venue: { id: "venue-1", slug: "xoxo", name: "XOXO", currency: "KZT" },
            table: {
              resourceId: "resource-" + code,
              code,
              name: "Авторское имя стола " + code,
              zoneName: "Главный зал",
            },
          })
        : send({ error: { code: "QR_INVALID", message: "QR недействителен" } }, 410);
    }
    if (p === "/dine-in/regular-menu")
      return send({
        venueCode: "xoxo",
        currency: "KZT",
        updatedAt: new Date().toISOString(),
        items: [
          {
            id: regularId,
            name: "Бургер XOXO",
            description: "Тестовая позиция из опубликованного меню",
            category: "Кухня",
            imageUrl: null,
            portion: "320 г",
            allergens: ["Глютен"],
            price: 2400,
            priceMinor: "240000",
            isAvailable: true,
            version: 1,
          },
        ],
      });
    if (p === "/dine-in/menu") {
      if (menuOffline) return send({ error: { code: "EXCHANGE_UNAVAILABLE" } }, 503);
      return send({
        generatedAt: new Date().toISOString(),
        status: "ok",
        currentRound: { id: round, endsAt: new Date(Date.now() + 600000).toISOString() },
        products: [
          {
            id: productId,
            name: "Напиток XOXO",
            price: 1590,
            originalPrice: 1700,
            previousPrice: 1700,
            minPrice: 1000,
            changePercent: -6.5,
            isAvailable: true,
            category: "Напитки",
          },
          { id: "disabled", name: "Нет в наличии", price: 1000, isAvailable: false },
          {
            id: "long-name",
            name: "Очень длинное название авторского напитка с подробным описанием ингредиентов и способа приготовления",
            price: 1900,
            isAvailable: true,
          },
        ],
      });
    }
    if (p === "/loyalty/wallet")
      return profile
        ? send({
            balance: 1000,
            expiringAmount: 1000,
            nextExpiresAt: new Date(Date.now() + 86400000).toISOString(),
            lots: [
              {
                id: "lot-1",
                remaining: 1000,
                expiresAt: new Date(Date.now() + 86400000).toISOString(),
              },
            ],
          })
        : send({ error: { code: "SESSION_REQUIRED" } }, 401);
    if (p === "/loyalty/transactions") return send({ transactions: [], nextCursor: null });
    if (p === "/dine-in/quotes") {
      const b = req.postDataJSON();
      lastInput = b;
      assert(!("guestId" in b));
      assert(!("payable" in b));
      const lines = b.items.map((x) => ({
        ...x,
        productName: x.itemType === "REGULAR_MENU" ? "Бургер XOXO" : "Напиток XOXO",
        unitPrice: x.itemType === "REGULAR_MENU" ? 2400 : 1590,
        total: x.quantity * (x.itemType === "REGULAR_MENU" ? 2400 : 1590),
      }));
      const subtotal = lines.reduce((n, l) => n + l.total, 0),
        discount = profile ? Math.min(1000, b.redeemAmount, subtotal) : 0;
      const q = {
        tableCode: tokens.get(b.qrToken) ?? "03",
        id: "quote-" + ++quotesN,
        roundId: b.items.every((x) => x.itemType === "REGULAR_MENU") ? null : round,
        expiresAt: new Date(Date.now() + (expireNext ? -1000 : 120000)).toISOString(),
        lines,
        subtotal,
        discount,
        payable: subtotal - discount,
        cashback: profile ? Math.floor((subtotal - discount) * 0.03) : 0,
        checkoutToken: "opaque-binding",
      };
      expireNext = false;
      quotes.set(q.id, q);
      return send(q);
    }
    if (p === "/dine-in/orders" && req.method() === "POST") {
      const b = req.postDataJSON();
      submissions.push(b);
      let o = orders.get(b.idempotencyKey);
      if (!o) {
        const q = quotes.get(b.quoteId);
        assert(q);
        if (Date.parse(q.expiresAt) <= Date.now() || (q.roundId && q.roundId !== round))
          return send({ error: { code: "REQUOTE", message: "Обновите цену" } }, 409);
        o = {
          ...q,
          id: "00000000-0000-4000-8000-" + String(++ordersN).padStart(12, "0"),
          orderNumber: String(ordersN),
          venueCode: "xoxo",
          tableCode: q.tableCode,
          status: "new",
          paymentStatus: "assumed_paid",
          createdAt: new Date().toISOString(),
          cashbackExpiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
          receiptToken: "opaque-receipt",
        };
        orders.set(b.idempotencyKey, o);
        if (loseResponse) {
          loseResponse = false;
          return send({ error: { code: "UNAVAILABLE", message: "lost after commit" } }, 503);
        }
      }
      return send({ order: o });
    }
    if (p === "/dine-in/orders")
      return send({ orders: profile ? [...orders.values()] : [], nextCursor: null });
    if (p.startsWith("/dine-in/orders/")) {
      const o = [...orders.values()].find((x) => p.endsWith(x.id));
      return o ? send({ order: o }) : send({ error: { code: "NOT_FOUND" } }, 404);
    }
    throw Error("Unexpected fixture route " + req.method() + " " + p);
  });
  for (let n = 1; n <= 17; n++) {
    const c = String(n).padStart(2, "0");
    console.log(`Checking QR ${c}`);
    await page.goto(urlFor(c));
    await page.waitForLoadState("networkidle");
    await page.getByText("Стол №" + c, { exact: true }).waitFor();
    await page.getByText("Авторское имя стола " + c, { exact: true }).waitFor();
    await page.getByRole("button", { name: /КУХНЯ & БАР Меню XOXO/ }).click();
    await page.getByRole("button", { name: "Добавить Бургер XOXO" }).waitFor();
    await page.getByRole("button", { name: "Меню и биржа", exact: true }).click();
    await openMarket();
    await page.getByRole("button", { name: "Добавить Напиток XOXO", exact: true }).waitFor();
    await page.reload();
    await page.getByText("Стол №" + c, { exact: true }).waitFor();
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "horizontal overflow " + c,
    );
  }
  await page.goto(urlFor("03"));
  await page.getByRole("button", { name: /КУХНЯ & БАР Меню XOXO/ }).waitFor();
  await shot("qr-landing");
  await openMarket();
  await page.getByRole("button", { name: "Добавить Напиток XOXO", exact: true }).waitFor();
  await shot("market");
  await page.getByRole("button", { name: "Добавить Напиток XOXO", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /Корзина · 1/ }).waitFor();
  await page.goto(urlFor("04"));
  assert(await page.getByRole("button", { name: /Корзина · 0/ }).isDisabled());
  await page.goto(urlFor("03"));
  await openMarket();
  assert(
    await page.getByRole("button", { name: "Добавить Нет в наличии", exact: true }).isDisabled(),
  );
  await page.getByRole("button", { name: /Корзина · 1/ }).click();
  await page.getByRole("button", { name: "Проверить сумму", exact: true }).click();
  loseResponse = true;
  await page.getByRole("button", { name: /^Заказать ·/ }).click();
  await page.getByRole("button", { name: "Проверить заказ", exact: true }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Проверить заказ", exact: true }).click();
  await page.getByRole("heading", { name: "Заказ #1" }).waitFor();
  assert.equal(ordersN, 1);
  assert.deepEqual(submissions[0], submissions[1]);
  await shot("receipt");
  await page.getByRole("button", { name: "Заказать ещё", exact: true }).click();
  await openMarket();
  for (let n = 0; n < 3; n++)
    await page.getByRole("button", { name: "Добавить Напиток XOXO", exact: true }).click();
  await page.getByRole("button", { name: /Корзина · 3/ }).click();
  await shot("cart");
  await page.getByRole("button", { name: "Создать гостевой профиль", exact: true }).click();
  await page.getByLabel("Имя", { exact: true }).fill("Тестовый гость");
  await page.getByLabel("Телефон", { exact: true }).fill("+77001234567");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Продолжить с бонусами", exact: true }).click();
  await page.getByLabel("Списать бонусы", { exact: true }).fill("1000");
  expireNext = true;
  await page.getByRole("button", { name: "Проверить сумму", exact: true }).click();
  await page.getByText("Цена обновилась — проверьте новую сумму", { exact: true }).waitFor();
  assert.equal(ordersN, 1);
  await page.getByRole("button", { name: "Проверить сумму", exact: true }).click();
  await page.getByRole("button", { name: /^Заказать ·/ }).waitFor();
  await shot("quote");
  assert.equal(lastInput.items[0].quantity, 3);
  assert.equal(lastInput.redeemAmount, 1000);
  round = "round-2";
  await page.getByRole("button", { name: /^Заказать ·/ }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Цена или бонусный баланс обновились" })
    .waitFor();
  assert.equal(ordersN, 1, "REQUOTE requires a new explicit acceptance");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByRole("button", { name: "Проверить сумму", exact: true }).click();
  await page.getByRole("button", { name: /^Заказать ·/ }).waitFor();
  await page.getByRole("button", { name: /^Заказать ·/ }).click();
  await page.getByRole("heading", { name: "Заказ #2" }).waitFor();
  const o = [...orders.values()].at(-1);
  assert.equal(o.payable, 3770);
  assert.equal(o.cashback, 113);
  await page.getByRole("button", { name: "Мои заказы и бонусы", exact: true }).click();
  await page.getByText("Тестовый гость", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Выйти из гостевого аккаунта", exact: true }).click();
  await page.getByText("Сохранить бонусы", { exact: true }).waitFor();
  assert.equal(await page.getByText("Тестовый гость", { exact: true }).count(), 0);
  assert(
    await page.evaluate(() =>
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("hostess:dining:") && k !== "hostess:dining:return")
        .every((k) => {
          const saved = JSON.parse(sessionStorage.getItem(k));
          return !saved.receipt && !saved.pending;
        }),
    ),
    "logout removes receipt capabilities and pending attempts for every table",
  );
  await page.reload();
  assert(await page.getByRole("button", { name: /Корзина · 0/ }).isDisabled());
  await openMarket();
  menuOffline = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByRole("status").filter({ hasText: "Биржа временно недоступна" }).waitFor();
  assert(
    await page.getByRole("button", { name: "Добавить Напиток XOXO", exact: true }).isDisabled(),
  );
  menuOffline = false;
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.getAttribute("aria-label") === "Добавить Напиток XOXO" && !b.disabled,
    ),
  );
  // One basket survives both catalog directions and keeps each authoritative source.
  await page.getByRole("button", { name: "Добавить Напиток XOXO", exact: true }).click();
  await page.getByRole("button", { name: "Меню и биржа", exact: true }).click();
  await page.getByRole("button", { name: /КУХНЯ & БАР Меню XOXO/ }).click();
  await page.getByRole("button", { name: "Добавить Бургер XOXO" }).waitFor();
  await shot("regular-menu");
  await page.getByRole("button", { name: "Подробнее: Бургер XOXO" }).click();
  await page.getByText("Аллергены: Глютен").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Добавить Бургер XOXO" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: /Корзина · 2/ }).click();
  await page.getByRole("button", { name: "Проверить сумму", exact: true }).click();
  await page.getByRole("button", { name: /^Заказать ·/ }).waitFor();
  assert.deepEqual(lastInput.items, [
    { productId, quantity: 1 },
    { productId: regularId, quantity: 1, itemType: "REGULAR_MENU" },
  ]);
  await page.getByRole("button", { name: /^Заказать ·/ }).click();
  await page.getByRole("heading", { name: "Заказ #3" }).waitFor();
  assert.equal([...orders.values()].at(-1).payable, 3990);
  await page.getByRole("button", { name: "Заказать ещё", exact: true }).click();
  menuOffline = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByRole("button", { name: "Добавить Бургер XOXO" }).click();
  await page.getByRole("button", { name: /Корзина · 1/ }).click();
  await page.getByRole("button", { name: "Проверить сумму", exact: true }).click();
  await page.getByRole("button", { name: /^Заказать ·/ }).click();
  await page.getByRole("heading", { name: "Заказ #4" }).waitFor();
  assert.equal([...orders.values()].at(-1).roundId, null);
  assert.equal([...orders.values()].at(-1).payable, 2400);
  await page.getByRole("button", { name: "Заказать ещё", exact: true }).click();
  menuOffline = false;
  if (device === "desktop") {
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement?.tagName === "BUTTON"));
  }
  await page.goto(origin + "/xoxo");
  await page.getByRole("button", { name: "Я уже в XOXO", exact: true }).click();
  await page.getByText("У меня есть код сотрудника", { exact: true }).click();
  await page.getByLabel("Код от сотрудника").fill("AABBCCDDEE");
  await page.getByRole("button", { name: "Подтвердить стол и открыть заказ", exact: true }).click();
  await page.getByText("Стол №01", { exact: true }).waitFor();
  await shot("no-qr-confirmed");
  await page.goto(origin + "/xoxo");
  await page.getByRole("button", { name: "Я уже в XOXO", exact: true }).click();
  await page.getByRole("button", { name: "Стол 08 Первый зал", exact: true }).click();
  await page.getByRole("button", { name: "Продолжить как гость", exact: true }).click();
  await page.getByText("Стол №08", { exact: true }).waitFor();
  await shot("web-table-selection");
  // Real taps after animations settle: DOM visibility alone misses a dialog
  // painted underneath the enclosing full-screen venue sheet.
  const reachable = async (dialog) => {
    await page.waitForTimeout(750);
    assert(
      await dialog.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }),
      "Embedded dialog is covered by its parent sheet",
    );
  };
  for (const signedIn of [false, true]) {
    profile = signedIn
      ? { id: "guest-1", name: "Тестовый гость", phone: "+77015558899", provisional: true }
      : null;
    await page.waitForLoadState("networkidle");
    await page.goto(origin + "/xoxo");
    await page.getByRole("button", { name: "Я уже в XOXO", exact: true }).click();
    await page.getByRole("button", { name: "Стол 08 Первый зал", exact: true }).click();
    await page.getByRole("button", { name: "Продолжить как гость", exact: true }).click();
    await page.getByRole("button", { name: /КУХНЯ & БАР Меню XOXO/ }).click();
    await page.getByRole("button", { name: "Добавить Бургер XOXO", exact: true }).click();
    await page.getByRole("button", { name: "На главную XOXO", exact: true }).click();
    await page.locator("main").getByRole("button", { name: "Мой кабинет", exact: true }).click();
    const account = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("heading", { name: "Гостевой аккаунт", exact: true }) });
    await reachable(account);
    await account.getByRole("button", { name: "Обновить", exact: true }).click();
    await account.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: /Корзина ·/ }).click();
    const embeddedCart = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("heading", { name: "Стол №08 · XOXO", exact: true }) });
    await reachable(embeddedCart);
    await embeddedCart.getByRole("button", { name: "Проверить сумму", exact: true }).click();
    await embeddedCart.getByRole("button", { name: /^Заказать ·/ }).click();
    await embeddedCart.getByRole("button", { name: "Заказать ещё", exact: true }).waitFor();
    await reachable(embeddedCart);
    await shot(signedIn ? "embedded-authorized-receipt" : "embedded-anonymous-receipt");
    await embeddedCart.getByRole("button", { name: "Заказать ещё", exact: true }).click();
    await page.getByRole("button", { name: /КУХНЯ & БАР Меню XOXO/ }).click();
    await page.getByRole("button", { name: "Добавить Бургер XOXO", exact: true }).click();
    await page.getByRole("button", { name: /Корзина ·/ }).click();
    await reachable(embeddedCart);
    await embeddedCart.getByRole("button", { name: "Close", exact: true }).click();
    await page.waitForLoadState("networkidle");
  }
  await page.goto(origin + "/v/xoxo/t/03/" + "z".repeat(43));
  await page.getByRole("alert").filter({ hasText: "QR недействителен" }).waitFor();
  assert.equal(await page.getByRole("button", { name: /^Заказать ·/ }).count(), 0);
  assert.deepEqual(failures, []);
  console.log(
    `${engine}/${device} QR UI PASS: 17 fixture tables, direct load/reload, table names, cart isolation, disabled QR/item, anonymous checkout, interrupted response retry, bootstrap, expired quote, redemption, receipt, logout clears saved capabilities, both catalogs on 17 QRs, product detail, mixed cart, regular-only with market offline.`,
  );
} finally {
  if (browser) await browser.close();
  server.kill();
}
