import { afterEach, describe, expect, test } from "bun:test";
import { proxyHostessApi } from "../src/lib/server/guest-proxy";
const original = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = original;
});
const runtime = { BOOKING_API_ORIGIN: "https://command.test", HOSTESS_BFF_KEY: "b".repeat(64) };
const request = (resource: string, method = "POST", contentType = "application/json") =>
  new Request(`https://hostes.online/api/guest/v1/${resource}`, {
    method,
    headers: { origin: "https://hostes.online", "content-type": contentType },
    ...(method === "GET" ? {} : { body: "{}" }),
  });
describe("guest BFF method and cookie boundary", () => {
  test.each([
    ["claims", "GET"],
    ["profile", "POST"],
    ["availability", "PATCH"],
    ["bootstrap", "PATCH"],
    ["reservations/11111111-1111-4111-8111-111111111111", "GET"],
  ])("rejects unsupported %s %s before upstream", async (path, method) => {
    globalThis.fetch = (async () => {
      throw Error("must not forward");
    }) as typeof fetch;
    expect((await proxyHostessApi(request(path, method), runtime))?.status).toBe(405);
  });
  test.each(["application/jsonx", "text/plain", "application/json-patch+json"])(
    "rejects misleading content type %s",
    async (type) => {
      expect((await proxyHostessApi(request("claims", "POST", type), runtime))?.status).toBe(415);
    },
  );
  test("valid JSON media type with parameters forwards", async () => {
    globalThis.fetch = (async () =>
      new Response("{}", { headers: { "content-type": "application/json" } })) as typeof fetch;
    expect(
      (await proxyHostessApi(request("claims", "POST", "Application/JSON; charset=utf-8"), runtime))
        ?.status,
    ).toBe(200);
  });
  test("broken body stream returns a no-store JSON failure", async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.error(new Error("connection closed"));
      },
    });
    const req = new Request("https://hostes.online/api/guest/v1/claims", {
      method: "POST",
      headers: { origin: "https://hostes.online", "content-type": "application/json" },
      body,
      duplex: "half",
    } as RequestInit);
    const result = await proxyHostessApi(req, runtime);
    expect(result?.status).toBe(400);
    expect(result?.headers.get("cache-control")).toBe("no-store");
  });
  test.each(["SameSite=None", "", "SameSite=invalid"])(
    "drops unsafe/missing cookie same-site policy %s",
    async (policy) => {
      globalThis.fetch = (async () =>
        new Response("{}", {
          headers: {
            "content-type": "application/json",
            "set-cookie": `__Host-hostess-guest=${"a".repeat(43)}; Path=/; HttpOnly; Secure${policy ? "; " + policy : ""}`,
          },
        })) as typeof fetch;
      const result = await proxyHostessApi(request("profile", "GET"), runtime);
      expect(result?.headers.get("set-cookie")).toBeNull();
    },
  );
});
