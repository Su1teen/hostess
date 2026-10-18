import { afterEach, describe, expect, test } from "bun:test";
import {
  changeQuantity,
  cartKey,
  cartItems,
  cartCanQuote,
  regularMenuSchema,
  diningApi,
  kzt,
  matchesTable,
  menuFresh,
  needsRequote,
  orderSchema,
  quoteFresh,
  quoteSchema,
  walletSchema,
  type DiningMenu,
} from "../src/lib/dine-in-api";
import { GuestApiError } from "../src/lib/guest-api";
import { proxyHostessApi } from "../src/lib/server/guest-proxy";

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});
const runtime = {
  BOOKING_API_ORIGIN: "https://command.test",
  EXCHANGE_API_ORIGIN: "https://exchange.test",
  HOSTESS_BFF_KEY: "x".repeat(64),
};
const now = Date.now();
const menu: DiningMenu = {
  generatedAt: new Date(now).toISOString(),
  status: "ok",
  currentRound: { id: "round-1", endsAt: new Date(now + 60000).toISOString() },
  products: [{ id: "product-1", name: "Напиток", price: 1590, isAvailable: true }],
};
const quote = {
  id: "q-1",
  roundId: "round-1",
  expiresAt: new Date(now + 30000).toISOString(),
  subtotal: 4770,
  discount: 1000,
  payable: 3770,
  cashback: 113,
  lines: [
    { productId: "product-1", productName: "Напиток", quantity: 3, unitPrice: 1590, total: 4770 },
  ],
};
const json = (data: unknown) =>
  new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });

describe("QR and price boundaries", () => {
  test("mixed baskets keep source IDs distinct and regular-only checkout survives exchange outage", () => {
    const regular = regularMenuSchema.parse({
      venueCode: "xoxo",
      currency: "KZT",
      updatedAt: new Date(now).toISOString(),
      items: [
        {
          id: "product-1",
          name: "Kitchen",
          description: "",
          category: "Food",
          imageUrl: null,
          portion: "200 г",
          allergens: [],
          price: 2400,
          priceMinor: "240000",
          isAvailable: true,
          version: 2,
        },
      ],
    });
    const regularKey = cartKey("product-1", "REGULAR_MENU");
    expect(regularKey).toBe("menu:product-1");
    expect(cartItems({ "product-1": 2, [regularKey]: 1 })).toEqual([
      { productId: "product-1", quantity: 2 },
      { productId: "product-1", quantity: 1, itemType: "REGULAR_MENU" },
    ]);
    expect(cartCanQuote({ [regularKey]: 1 }, null, regular, now)).toBe(true);
    expect(cartCanQuote({ "product-1": 1, [regularKey]: 1 }, null, regular, now)).toBe(false);
    expect(cartCanQuote({ "product-1": 1, [regularKey]: 1 }, menu, regular, now)).toBe(true);
    expect(cartCanQuote({ [regularKey]: 1 }, menu, null, now)).toBe(false);
    const regularQuote = {
      ...quote,
      roundId: null,
      lines: quote.lines.map((line) => ({
        ...line,
        itemType: "REGULAR_MENU" as const,
        menuVersion: 2,
      })),
    };
    expect(quoteFresh(regularQuote, null, now)).toBe(true);
    expect(quoteFresh(regularQuote, null, now + 30000)).toBe(false);
    expect(quoteFresh({ ...regularQuote, lines: quote.lines }, null, now)).toBe(false);
    expect(quoteSchema.parse(regularQuote).roundId).toBeNull();
  });
  test("17 server resource IDs map only to the matching QR table", async () => {
    for (let i = 1; i <= 17; i++) {
      const code = String(i).padStart(2, "0"),
        token = `qr-token-${code}-` + "a".repeat(32);
      globalThis.fetch = (async (url: RequestInfo | URL) => {
        expect(String(url)).toBe(`/api/guest/v1/dine-in/tables/${token}`);
        return json({
          venue: { id: "venue-1", slug: "xoxo", name: "XOXO", currency: "KZT" },
          table: { resourceId: `resource-${code}`, code, name: `Стол ${code}` },
        });
      }) as typeof fetch;
      const context = await diningApi.table(token);
      expect(context.table.resourceId).toBe(`resource-${code}`);
      expect(matchesTable(context, "xoxo", code)).toBe(true);
      expect(matchesTable(context, "other", code)).toBe(false);
      expect(matchesTable(context, "xoxo", String(i === 17 ? 1 : i + 1).padStart(2, "0"))).toBe(
        false,
      );
    }
  });
  test.each([404, 410, 403])(
    "invalid/disabled/rotated QR status %i stays an error",
    async (status) => {
      globalThis.fetch = (async () =>
        new Response(JSON.stringify({ error: { code: "QR_INVALID", message: "QR недоступен" } }), {
          status,
        })) as typeof fetch;
      await expect(diningApi.table("disabled-token")).rejects.toBeInstanceOf(GuestApiError);
    },
  );
  test("freshness expires without another network request and rejects future timestamps", () => {
    expect(menuFresh(menu, now)).toBe(true);
    expect(menuFresh(menu, now + 60001)).toBe(false);
    expect(menuFresh({ ...menu, generatedAt: new Date(now - 61000).toISOString() }, now)).toBe(
      false,
    );
    expect(menuFresh({ ...menu, generatedAt: new Date(now + 120000).toISOString() }, now)).toBe(
      false,
    );
    expect(menuFresh({ ...menu, status: "no_published_round" }, now)).toBe(false);
    expect(menuFresh({ ...menu, currentRound: null }, now)).toBe(false);
  });
  test("quote cannot be accepted after expiry, stale exchange or round change", () => {
    expect(quoteFresh(quote, menu, now)).toBe(true);
    expect(quoteFresh(quote, menu, now + 30000)).toBe(false);
    expect(
      quoteFresh(quote, { ...menu, currentRound: { ...menu.currentRound!, id: "round-2" } }, now),
    ).toBe(false);
    expect(quoteFresh(quote, { ...menu, status: "no_published_round" }, now)).toBe(false);
    expect(needsRequote(new GuestApiError(409, "REQUOTE", "updated"))).toBe(true);
    expect(needsRequote(new GuestApiError(503, "TIMEOUT", "unknown"))).toBe(false);
  });
  test("quantities are capped, removed at zero, and a new table has an independent cart", () => {
    let cart = changeQuantity({}, "p", 1);
    cart = changeQuantity(cart, "p2", 2);
    expect(cart).toEqual({ p: 1, p2: 2 });
    expect(changeQuantity(cart, "p", 100).p).toBe(20);
    expect(changeQuantity(cart, "p", -1)).toEqual({ p2: 2 });
    expect(changeQuantity({}, "p", 1)).toEqual({ p: 1 });
    expect(cart).toEqual({ p: 1, p2: 2 });
  });
});

describe("typed transport and server authority", () => {
  test("receipt capability never appears in the request URL", async () => {
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("/api/guest/v1/dine-in/orders/order-1");
      expect(new Headers(init?.headers).get("x-hostess-receipt-token")).toBe("a".repeat(43));
      return json({
        order: {
          ...quote,
          id: "order-1",
          orderNumber: "1",
          createdAt: new Date().toISOString(),
          venueCode: "xoxo",
          tableCode: "03",
          status: "new",
          paymentStatus: "assumed_paid",
        },
      });
    }) as typeof fetch;
    await diningApi.receipt("order-1", "a".repeat(43));
  });
  test("quote sends IDs, quantities and requested redemption, never guestId or client totals", async () => {
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        qrToken: "table-token",
        items: [{ productId: "product-1", quantity: 3 }],
        redeemAmount: 1000,
      });
      expect(init?.credentials).toBe("same-origin");
      expect(init?.cache).toBe("no-store");
      return json(quote);
    }) as typeof fetch;
    const result = await diningApi.quote("table-token", { "product-1": 3 }, 1000);
    expect(result.payable).toBe(3770);
    expect(result.cashback).toBe(113);
  });
  test("retry preserves quote, anonymous capability and idempotency key", async () => {
    const bodies: unknown[] = [];
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      throw new TypeError("network interrupted after commit");
    }) as typeof fetch;
    const pending = { ...quote, checkoutToken: "opaque-capability" };
    for (let i = 0; i < 2; i++)
      await expect(diningApi.order(pending, "same-key")).rejects.toThrow();
    expect(bodies[0]).toEqual({
      quoteId: "q-1",
      idempotencyKey: "same-key",
      checkoutToken: "opaque-capability",
    });
    expect(bodies[1]).toEqual(bodies[0]);
  });
  test("backend totals are not recalculated and incompatible payloads fail closed", () => {
    expect(quoteSchema.parse(quote).cashback).toBe(113);
    expect(quoteSchema.safeParse({ ...quote, payable: "377000" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...quote, subtotal: -1 }).success).toBe(false);
    expect(orderSchema.safeParse({ ...quote, paymentStatus: "paid" }).success).toBe(false);
    expect(kzt(3770)).toContain("₸");
  });
  test("wallet keeps separate lot expiries and zero/full redemption results", () => {
    const first = new Date(now + 86400000).toISOString(),
      second = new Date(now + 14 * 86400000).toISOString();
    const wallet = walletSchema.parse({
      balance: 1113,
      expiringAmount: 1000,
      nextExpiresAt: first,
      lots: [
        { id: "old", remaining: 1000, expiresAt: first },
        { id: "new", remaining: 113, expiresAt: second },
      ],
    });
    expect(wallet.lots[0].expiresAt).not.toBe(wallet.lots[1].expiresAt);
    expect(
      walletSchema.parse({ balance: 0, expiringAmount: 0, nextExpiresAt: null, lots: [] }).balance,
    ).toBe(0);
    expect(quoteSchema.parse({ ...quote, discount: 4770, payable: 0, cashback: 0 }).cashback).toBe(
      0,
    );
  });
  test("HTML/service failures and invalid schemas are never treated as checkout success", async () => {
    globalThis.fetch = (async () =>
      new Response("<html>unavailable</html>", { status: 503 })) as typeof fetch;
    await expect(diningApi.wallet()).rejects.toBeInstanceOf(GuestApiError);
    globalThis.fetch = (async () => json({ success: true })) as typeof fetch;
    await expect(diningApi.order(quote, "same-key")).rejects.toThrow("неполный ответ");
  });
});

describe("dine-in BFF security", () => {
  test("receipt header is scoped and legacy query is stripped before Railway", async () => {
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).not.toContain("receiptToken");
      expect(new Headers(init?.headers).get("x-hostess-receipt-token")).toBe("r".repeat(43));
      return json({ ok: true });
    }) as typeof fetch;
    const path =
      "https://hostess.test/api/guest/v1/dine-in/orders/11111111-1111-4111-8111-111111111111";
    expect(
      (
        await proxyHostessApi(
          new Request(path, { headers: { "x-hostess-receipt-token": "r".repeat(43) } }),
          runtime,
        )
      )?.status,
    ).toBe(200);
    expect(
      (await proxyHostessApi(new Request(path + "?receiptToken=" + "r".repeat(43)), runtime))
        ?.status,
    ).toBe(200);
    expect(
      (
        await proxyHostessApi(
          new Request(path, { headers: { "x-hostess-receipt-token": "bad" } }),
          runtime,
        )
      )?.status,
    ).toBe(400);
  });
  test("multiple guest and anonymous Set-Cookie headers survive together including deletion", async () => {
    globalThis.fetch = (async () => {
      const headers = new Headers({ "content-type": "application/json" });
      headers.append(
        "set-cookie",
        "__Host-hostess-guest=" + "g".repeat(43) + "; Path=/; Secure; HttpOnly; SameSite=Lax",
      );
      headers.append(
        "set-cookie",
        "__Host-hostess-dining=; Path=/; Secure; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      );
      return new Response("{}", { headers });
    }) as typeof fetch;
    const response = await proxyHostessApi(
      new Request("https://hostess.test/api/guest/v1/profile"),
      runtime,
    );
    expect(response?.headers.getSetCookie()).toHaveLength(2);
  });
  test.each([
    ["dine-in/menu?venue=xoxo", "GET"],
    ["dine-in/regular-menu?venue=xoxo", "GET"],
    ["dine-in/tables/" + "a".repeat(43), "GET"],
    ["dine-in/quotes", "POST"],
    ["dine-in/orders", "POST"],
    ["dine-in/orders", "GET"],
    ["dine-in/orders/11111111-1111-4111-8111-111111111111", "GET"],
    ["loyalty/wallet", "GET"],
    ["loyalty/transactions?before=cursor", "GET"],
  ])("allows only configured method for %s %s", async (path, method) => {
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe(`https://command.test/api/guest/v1/${path}`);
      expect(new Headers(init?.headers).get("x-hostess-service-key")).toBe(runtime.HOSTESS_BFF_KEY);
      return json({ ok: true });
    }) as typeof fetch;
    const response = await proxyHostessApi(
      new Request(`https://hostess.test/api/guest/v1/${path}`, {
        method,
        ...(method === "POST"
          ? {
              headers: { origin: "https://hostess.test", "content-type": "application/json" },
              body: "{}",
            }
          : {}),
      }),
      runtime,
    );
    expect(response?.status).toBe(200);
    expect(response?.headers.get("cache-control")).toBe("no-store");
  });
  test("public price history has bounded parameters and does not forward staff or BFF credentials", async () => {
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://exchange.test/api/v1/public/history?limit=12");
      expect(new Headers(init?.headers).has("cookie")).toBe(false);
      expect(new Headers(init?.headers).has("x-hostess-service-key")).toBe(false);
      return json({ rounds: [] });
    }) as typeof fetch;
    const r = await proxyHostessApi(
      new Request("https://hostess.test/api/exchange/history?limit=12&admin=true", {
        headers: { cookie: "__Host-hostess-staff=private" },
      }),
      runtime,
    );
    expect(r?.status).toBe(200);
    expect(
      (
        await proxyHostessApi(
          new Request("https://hostess.test/api/exchange/history?limit=999"),
          runtime,
        )
      )?.status,
    ).toBe(400);
    expect(
      (
        await proxyHostessApi(
          new Request("https://hostess.test/api/exchange/history", { method: "POST" }),
          runtime,
        )
      )?.status,
    ).toBe(405);
  });
  test("no arbitrary API, cookie or method escalation", async () => {
    globalThis.fetch = (async () => {
      throw new Error("Must not call upstream");
    }) as typeof fetch;
    for (const path of [
      "dine-in/admin",
      "loyalty/adjust",
      "dine-in/tables/%2fadmin",
      "dine-in/orders/evil",
    ])
      expect(
        (await proxyHostessApi(new Request(`https://hostess.test/api/guest/v1/${path}`), runtime))
          ?.status,
      ).toBe(404);
    expect(
      (
        await proxyHostessApi(
          new Request("https://hostess.test/api/guest/v1/loyalty/wallet", { method: "POST" }),
          runtime,
        )
      )?.status,
    ).toBe(405);
    expect(
      (
        await proxyHostessApi(
          new Request("https://hostess.test/api/guest/v1/dine-in/orders", {
            method: "POST",
            headers: { origin: "https://evil.test", "content-type": "application/json" },
            body: "{}",
          }),
          runtime,
        )
      )?.status,
    ).toBe(403);
  });
  test("anonymous cookies survive quote/order while staff cookies and unsafe set-cookie do not", async () => {
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      const cookies = new Headers(init?.headers).get("cookie");
      expect(cookies).toContain("__Host-hostess-dining=" + "b".repeat(43));
      expect(cookies).not.toContain("staff");
      const headers = new Headers({ "content-type": "application/json" });
      headers.append(
        "set-cookie",
        "__Host-hostess-dining=" + "c".repeat(43) + "; Path=/; HttpOnly; Secure; SameSite=Lax",
      );
      headers.append("set-cookie", "__Host-hostess-staff=secret; Path=/; Secure; HttpOnly");
      headers.append(
        "set-cookie",
        "__Host-hostess-guest=" + "d".repeat(43) + "; Domain=evil.test; Path=/; Secure; HttpOnly",
      );
      return new Response("{}", { headers });
    }) as typeof fetch;
    const r = await proxyHostessApi(
      new Request("https://hostess.test/api/guest/v1/dine-in/menu", {
        headers: { cookie: `__Host-hostess-staff=secret; __Host-hostess-dining=${"b".repeat(43)}` },
      }),
      runtime,
    );
    expect(r?.headers.get("set-cookie")).toContain("__Host-hostess-dining=");
    expect(r?.headers.get("set-cookie")).not.toContain("staff");
    expect(r?.headers.get("set-cookie")).not.toContain("evil.test");
  });
  test("logout deletion cookie is retained", async () => {
    globalThis.fetch = (async () =>
      new Response("{}", {
        headers: {
          "content-type": "application/json",
          "set-cookie": "__Host-hostess-guest=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0",
        },
      })) as typeof fetch;
    expect(
      (
        await proxyHostessApi(new Request("https://hostess.test/api/guest/v1/profile"), runtime)
      )?.headers.get("set-cookie"),
    ).toContain("Max-Age=0");
  });
});
