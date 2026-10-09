import { describe, expect, test } from "bun:test";
import { proxyHostessApi } from "../src/lib/server/guest-proxy";
import { claimPage } from "../src/lib/server/guest-claim";
const runtime = {
  BOOKING_API_ORIGIN: "https://command.test",
  EXCHANGE_API_ORIGIN: "https://exchange.test",
  HOSTESS_BFF_KEY: "b".repeat(64),
};
describe("Cloudflare same-origin BFF", () => {
  test("rejects upstream redirects without forwarding credentials", async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls++;
      expect(init?.redirect).toBe("manual");
      return new Response(null, { status: 302, headers: { location: "https://evil.test" } });
    }) as typeof fetch;
    try {
      const response = await proxyHostessApi(
        new Request("https://hostess.test/api/guest/v1/profile"),
        runtime,
      );
      expect(response?.status).toBe(502);
      expect(calls).toBe(1);
    } finally {
      globalThis.fetch = original;
    }
  });
  test("uses request bindings even when adapter passes an empty runtime", async () => {
    const request = new Request("https://hostess.test/api/exchange/current-round");
    Object.assign(request, { runtime: { cloudflare: { env: runtime } } });
    const original = globalThis.fetch;
    let upstream = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      upstream = String(input);
      return new Response("{}", { headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    try {
      expect((await proxyHostessApi(request, {}))?.status).toBe(200);
      expect(upstream).toBe("https://exchange.test/api/v1/public/snapshot");
    } finally {
      globalThis.fetch = original;
    }
  });
  test("accepts bare Railway hostname over HTTPS and rejects malformed origins", async () => {
    const original = globalThis.fetch;
    let upstream = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      upstream = String(input);
      return new Response("{}", { headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    try {
      const request = new Request("https://hostess.test/api/exchange/current-round");
      expect(
        (
          await proxyHostessApi(request, {
            ...runtime,
            EXCHANGE_API_ORIGIN: "hostess-xoxo-production.up.railway.app",
          })
        )?.status,
      ).toBe(200);
      expect(upstream).toBe(
        "https://hostess-xoxo-production.up.railway.app/api/v1/public/snapshot",
      );
      for (const invalid of [
        "invalid",
        "https://",
        "//evil.test",
        "exchange.up.railway.app/path",
      ]) {
        expect(
          (await proxyHostessApi(request, { ...runtime, EXCHANGE_API_ORIGIN: invalid }))?.status,
        ).toBe(503);
      }
    } finally {
      globalThis.fetch = original;
    }
  });
  test("fails visibly without production configuration", async () => {
    const result = await proxyHostessApi(
      new Request("https://hostess.test/api/exchange/current-round"),
      {},
    );
    expect(result?.status).toBe(503);
  });
  test("rejects production localhost and embedded credentials", async () => {
    expect(
      (
        await proxyHostessApi(new Request("https://hostess.test/api/exchange/current-round"), {
          ...runtime,
          EXCHANGE_API_ORIGIN: "http://localhost:3000",
        })
      )?.status,
    ).toBe(503);
    expect(
      (
        await proxyHostessApi(new Request("https://hostess.test/api/exchange/current-round"), {
          ...runtime,
          EXCHANGE_API_ORIGIN: "https://user:password@exchange.test",
        })
      )?.status,
    ).toBe(503);
  });
  test("rejects cross-origin writes and sensitive integration operations", async () => {
    expect(
      (
        await proxyHostessApi(
          new Request("https://hostess.test/api/guest/v1/claims", {
            method: "POST",
            headers: { origin: "https://evil.test", "content-type": "application/json" },
            body: "{}",
          }),
          runtime,
        )
      )?.status,
    ).toBe(403);
    expect(
      (await proxyHostessApi(new Request("https://hostess.test/api/guest/v1/links"), runtime))
        ?.status,
    ).toBe(404);
    expect(
      (await proxyHostessApi(new Request("https://hostess.test/api/guest/v1/identity"), runtime))
        ?.status,
    ).toBe(404);
  });
  test("forwards only guest cookie and keeps server auth secret", async () => {
    const original = globalThis.fetch;
    let captured: Request | null = null;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      captured = new Request(input, init);
      return new Response('{"ok":true}', {
        headers: {
          "content-type": "application/json",
          "set-cookie":
            "__Host-hostess-guest=" + "a".repeat(43) + "; Path=/; HttpOnly; Secure; SameSite=Lax",
        },
      });
    }) as typeof fetch;
    try {
      const result = await proxyHostessApi(
        new Request("https://hostess.test/api/guest/v1/profile", {
          headers: {
            cookie: "__Host-hostess-staff=secret; __Host-hostess-guest=" + "a".repeat(43),
            authorization: "bad",
            "x-hostess-service-key": "bad",
          },
        }),
        runtime,
      );
      expect(result?.status).toBe(200);
      expect(captured!.headers.get("cookie")).toBe("__Host-hostess-guest=" + "a".repeat(43));
      expect(captured!.headers.get("authorization")).toBeNull();
      expect(captured!.headers.get("x-hostess-service-key")).toBe(runtime.HOSTESS_BFF_KEY);
      expect(result?.headers.get("cache-control")).toBe("no-store");
      expect(await result?.text()).not.toContain(runtime.HOSTESS_BFF_KEY);
    } finally {
      globalThis.fetch = original;
    }
  });
  test("reads read-only exchange snapshot and rejects HTML upstream", async () => {
    const original = globalThis.fetch;
    let path = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      path = String(input);
      return new Response("html", { headers: { "content-type": "text/html" } });
    }) as typeof fetch;
    try {
      expect(
        (
          await proxyHostessApi(
            new Request("https://hostess.test/api/exchange/current-round"),
            runtime,
          )
        )?.status,
      ).toBe(502);
      expect(path).toBe("https://exchange.test/api/v1/public/snapshot");
    } finally {
      globalThis.fetch = original;
    }
  });
  test("limits oversized bodies before upstream", async () => {
    expect(
      (
        await proxyHostessApi(
          new Request("https://hostess.test/api/guest/v1/claims", {
            method: "POST",
            headers: { origin: "https://hostess.test", "content-type": "application/json" },
            body: "x".repeat(32769),
          }),
          runtime,
        )
      )?.status,
    ).toBe(413);
  });
  test("crawler GET renders inert claim page, no SSR/consume and no caching", () => {
    const response = claimPage(new Request("https://hostess.test/auth/claim"));
    expect(response?.status).toBe(200);
    expect(response?.headers.get("cache-control")).toBe("no-store");
    expect(response?.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response?.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
