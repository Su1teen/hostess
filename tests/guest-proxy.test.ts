import { afterEach, describe, expect, test } from "bun:test";
import { getLastBffDiagnosticForTests, proxyHostessApi } from "../src/lib/server/guest-proxy";
import { setCloudflareModuleEnvForTests } from "../src/lib/server/runtime-env";
import { claimPage } from "../src/lib/server/guest-claim";
import serverEntry from "../src/server";
const runtime = {
  BOOKING_API_ORIGIN: "https://command.test",
  EXCHANGE_API_ORIGIN: "https://exchange.test",
  HOSTESS_BFF_KEY: "b".repeat(64),
};
afterEach(() => {
  setCloudflareModuleEnvForTests(undefined);
  delete (globalThis as { __env__?: unknown }).__env__;
  delete (globalThis as { __cf_workers_env__?: unknown }).__cf_workers_env__;
  delete process.env.BOOKING_API_ORIGIN;
  delete process.env.EXCHANGE_API_ORIGIN;
  delete process.env.HOSTESS_BFF_KEY;
  delete process.env.HOSTESS_BUILD_SHA;
});
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
    expect(response?.headers.get("cache-control")).toBe("no-store, no-transform");
    expect(response?.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response?.headers.get("referrer-policy")).toBe("no-referrer");
  });
  test("resolves bindings when serverEntry.fetch(request, undefined) is invoked by Nitro lazyService using Cloudflare module env", async () => {
    const original = globalThis.fetch;
    let captured: Request | null = null;
    const sha = "a".repeat(40);
    const secretKey = "k".repeat(48);
    setCloudflareModuleEnvForTests({
      BOOKING_API_ORIGIN: "https://command.test",
      EXCHANGE_API_ORIGIN: "https://exchange.test",
      HOSTESS_BFF_KEY: secretKey,
      HOSTESS_BUILD_SHA: sha,
    });
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      captured = new Request(input, init);
      return new Response(
        JSON.stringify({
          venue: "xoxo",
          resourceId: "table-01",
          code: "01",
          name: "Стол 01",
          zone: "Main Hall",
          enabled: true,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;
    try {
      const token = "t".repeat(43);
      const response = await serverEntry.fetch(
        new Request(`https://hostes.online/api/guest/v1/dine-in/tables/${token}`),
        undefined,
        undefined,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("x-hostess-build")).toBe(sha);
      expect(captured?.url).toBe(`https://command.test/api/guest/v1/dine-in/tables/${token}`);
      expect(captured?.headers.get("x-hostess-service-key")).toBe(secretKey);
      const diag = getLastBffDiagnosticForTests();
      expect(diag).toEqual({
        event: "hostess.bff.proxy",
        method: "GET",
        pathname: `/api/guest/v1/dine-in/tables/${token}`,
        bookingOriginAvailable: true,
        exchangeOriginAvailable: true,
        serviceKeyAvailable: true,
        serviceKeySatisfiesMinLength: true,
        bindingSource: "Cloudflare module env",
        bindingSources: {
          bookingOrigin: "Cloudflare module env",
          exchangeOrigin: "Cloudflare module env",
          serviceKey: "Cloudflare module env",
          buildSha: "Cloudflare module env",
        },
        deployedBuildSha: sha,
        upstreamAttempted: true,
        outcome: "upstream_response",
        status: 200,
      });
      expect(JSON.stringify(diag)).not.toContain(secretKey);
    } finally {
      globalThis.fetch = original;
    }
  });
  test("resolves bindings from Nitro globalThis.__env__ and process.env fallbacks and supports Secrets Store bindings", async () => {
    const original = globalThis.fetch;
    let calls = 0;
    const secretKey = "s".repeat(48);
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls++;
      const req = new Request(input, init);
      expect(req.url).toBe("https://command.test/api/guest/v1/dine-in/menu?venue=xoxo");
      expect(req.headers.get("x-hostess-service-key")).toBe(secretKey);
      return new Response(JSON.stringify({ venue: "xoxo", categories: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    try {
      setCloudflareModuleEnvForTests(null);
      (globalThis as { __env__?: unknown }).__env__ = {
        BOOKING_API_ORIGIN: "https://command.test",
        HOSTESS_BFF_KEY: {
          async get() {
            return `  "${secretKey}"  `;
          },
        },
      };
      const resNitro = await proxyHostessApi(
        new Request("https://hostes.online/api/guest/v1/dine-in/menu?venue=xoxo"),
        { BOOKING_API_ORIGIN: "   ", HOSTESS_BFF_KEY: "" },
      );
      expect(resNitro?.status).toBe(200);
      expect(getLastBffDiagnosticForTests()?.bindingSource).toBe("Nitro context");

      delete (globalThis as { __env__?: unknown }).__env__;
      process.env.BOOKING_API_ORIGIN = "https://command.test";
      process.env.HOSTESS_BFF_KEY = secretKey;
      const resProcess = await proxyHostessApi(
        new Request("https://hostes.online/api/guest/v1/dine-in/menu?venue=xoxo"),
        undefined,
      );
      expect(resProcess?.status).toBe(200);
      expect(getLastBffDiagnosticForTests()?.bindingSource).toBe("process.env");
      expect(calls).toBe(2);
    } finally {
      globalThis.fetch = original;
    }
  });
  test("distinguishes missing BOOKING_API_ORIGIN, missing HOSTESS_BFF_KEY, short HOSTESS_BFF_KEY, and invalid BOOKING_API_ORIGIN without leaking secrets", async () => {
    setCloudflareModuleEnvForTests(null);
    const tableReq = () =>
      new Request(`https://hostes.online/api/guest/v1/dine-in/tables/${"t".repeat(43)}`);

    const missingOriginRes = await proxyHostessApi(tableReq(), {
      HOSTESS_BFF_KEY: "k".repeat(40),
    });
    expect(missingOriginRes?.status).toBe(503);
    expect(missingOriginRes?.headers.get("x-hostess-config-error")).toBe("missing-upstream-origin");
    expect(getLastBffDiagnosticForTests()).toMatchObject({
      bookingOriginAvailable: false,
      serviceKeyAvailable: true,
      serviceKeySatisfiesMinLength: true,
      bindingSource: "fetch argument",
      upstreamAttempted: false,
      outcome: "missing_upstream_origin",
      status: 503,
    });

    const missingKeyRes = await proxyHostessApi(tableReq(), {
      BOOKING_API_ORIGIN: "https://command.test",
    });
    expect(missingKeyRes?.status).toBe(503);
    expect(missingKeyRes?.headers.get("x-hostess-config-error")).toBe("missing-service-key");
    expect(getLastBffDiagnosticForTests()).toMatchObject({
      bookingOriginAvailable: true,
      serviceKeyAvailable: false,
      serviceKeySatisfiesMinLength: false,
      bindingSource: "fetch argument",
      upstreamAttempted: false,
      outcome: "missing_service_key",
      status: 503,
    });

    const shortSecret = "short-secret-value-12345";
    const shortKeyRes = await proxyHostessApi(tableReq(), {
      BOOKING_API_ORIGIN: "https://command.test",
      HOSTESS_BFF_KEY: shortSecret,
    });
    expect(shortKeyRes?.status).toBe(503);
    expect(shortKeyRes?.headers.get("x-hostess-config-error")).toBe("short-service-key");
    const shortDiag = getLastBffDiagnosticForTests();
    expect(shortDiag).toMatchObject({
      bookingOriginAvailable: true,
      serviceKeyAvailable: true,
      serviceKeySatisfiesMinLength: false,
      bindingSource: "fetch argument",
      upstreamAttempted: false,
      outcome: "short_service_key",
      status: 503,
    });
    expect(JSON.stringify(shortDiag)).not.toContain(shortSecret);

    const invalidOriginRes = await proxyHostessApi(tableReq(), {
      BOOKING_API_ORIGIN: "https://command.test/extra-path",
      HOSTESS_BFF_KEY: "k".repeat(40),
    });
    expect(invalidOriginRes?.status).toBe(503);
    expect(invalidOriginRes?.headers.get("x-hostess-config-error")).toBe("malformed-origin");
    expect(getLastBffDiagnosticForTests()?.outcome).toBe("malformed_origin");

    const insecureOriginRes = await proxyHostessApi(tableReq(), {
      BOOKING_API_ORIGIN: "http://command.test",
      HOSTESS_BFF_KEY: "k".repeat(40),
    });
    expect(insecureOriginRes?.status).toBe(503);
    expect(insecureOriginRes?.headers.get("x-hostess-config-error")).toBe("insecure-origin");
    expect(getLastBffDiagnosticForTests()?.outcome).toBe("insecure_origin");
  });
});
