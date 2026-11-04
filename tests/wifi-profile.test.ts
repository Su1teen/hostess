import { afterEach, describe, expect, test } from "bun:test";
import { wifiMobileconfig, wifiProfileResponse } from "../src/lib/server/wifi-profile";
import { proxyHostessApi } from "../src/lib/server/guest-proxy";
import { wifiSchema } from "../src/lib/dine-in-api";

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});
const runtime = {
  BOOKING_API_ORIGIN: "https://command.test",
  EXCHANGE_API_ORIGIN: "https://exchange.test",
  HOSTESS_BFF_KEY: "x".repeat(64),
};
const xoxo = {
  ssid: "A. B.  Demo guest",
  password: "Guest-pass-77",
  security: "WPA" as const,
  hidden: false,
  qr: "WIFI:T:WPA;S:A. B.  Demo guest;P:Guest-pass-77;;",
};

describe("guest Wi-Fi", () => {
  test("Apple profile keeps the exact network name and joins automatically", async () => {
    const plist = await wifiMobileconfig(xoxo);
    expect(plist).toContain("<key>SSID_STR</key><string>A. B.  Demo guest</string>");
    expect(plist).toContain("<key>Password</key><string>Guest-pass-77</string>");
    expect(plist).toContain("<key>EncryptionType</key><string>Any</string>");
    expect(plist).toContain("<key>AutoJoin</key><true/>");
    expect(plist).toContain("<string>com.apple.wifi.managed</string>");
    // Same network → same profile UUID, so reinstalling replaces it instead of piling up copies.
    expect(await wifiMobileconfig(xoxo)).toBe(plist);
  });
  test("XML is escaped and open networks carry no password", async () => {
    const plist = await wifiMobileconfig({
      ...xoxo,
      ssid: `<A&B "x">`,
      security: "nopass",
      password: "",
    });
    expect(plist).toContain("<string>&lt;A&amp;B &quot;x&quot;&gt;</string>");
    expect(plist).not.toContain("<key>Password</key>");
    expect(plist).toContain("<key>EncryptionType</key><string>None</string>");
  });
  test("the BFF allows only GET for the Wi-Fi route", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ wifi: xoxo }), {
        headers: { "content-type": "application/json" },
      })) as typeof fetch;
    const ok = await proxyHostessApi(
      new Request("https://hostes.online/api/guest/v1/dine-in/wifi?venue=xoxo"),
      runtime,
    );
    expect(ok?.status).toBe(200);
    expect(wifiSchema.parse(await ok!.json()).wifi?.ssid).toBe("A. B.  Demo guest");
    const post = await proxyHostessApi(
      new Request("https://hostes.online/api/guest/v1/dine-in/wifi", { method: "POST" }),
      runtime,
    );
    expect(post?.status).toBe(405);
  });
  test("profile route serves the current network with the Apple content type", async () => {
    let upstream = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      upstream = String(input);
      return new Response(JSON.stringify({ wifi: xoxo }), {
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    const response = await wifiProfileResponse(
      new Request("https://hostes.online/wifi/xoxo.mobileconfig"),
      runtime,
    );
    expect(upstream).toBe("https://command.test/api/guest/v1/dine-in/wifi?venue=xoxo");
    expect(response?.headers.get("content-type")).toStartWith("application/x-apple-aspen-config");
    expect(response?.headers.get("cache-control")).toBe("no-store");
    expect(await response!.text()).toContain("A. B.  Demo guest");
    expect(
      await wifiProfileResponse(new Request("https://hostes.online/xoxo"), runtime),
    ).toBeNull();
  });
  test("a disabled network gives a clear 404 instead of an empty profile", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ wifi: null }), {
        headers: { "content-type": "application/json" },
      })) as typeof fetch;
    const response = await wifiProfileResponse(
      new Request("https://hostes.online/wifi/xoxo.mobileconfig"),
      runtime,
    );
    expect(response?.status).toBe(404);
  });
});
