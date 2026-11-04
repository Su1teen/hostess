import { proxyHostessApi } from "./guest-proxy";
import type { GuestWifi } from "../dine-in-api";

export const WIFI_PROFILE_PATH = "/wifi/xoxo.mobileconfig";

const xml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!,
  );

/** Stable UUID per network: reinstalling replaces the same profile instead of adding another. */
async function uuidFor(seed: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed)),
  );
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`.toUpperCase();
}

/**
 * Apple configuration profile with one Wi-Fi payload (com.apple.wifi.managed). iPhone, iPad and Mac
 * install it from Safari and then join and remember the network on their own — the only way a web
 * page can connect a device to Wi-Fi. Android and Windows browsers have no equivalent.
 */
export async function wifiMobileconfig(wifi: GuestWifi) {
  const encryption = wifi.security === "nopass" ? "None" : wifi.security === "WEP" ? "WEP" : "Any";
  const network = await uuidFor(`xoxo-wifi:${wifi.ssid}`);
  const profile = await uuidFor(`xoxo-wifi-profile:${wifi.ssid}`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>AutoJoin</key><true/>
      <key>EncryptionType</key><string>${encryption}</string>
      <key>HIDDEN_NETWORK</key>${wifi.hidden ? "<true/>" : "<false/>"}
${wifi.security === "nopass" ? "" : `      <key>Password</key><string>${xml(wifi.password)}</string>\n`}      <key>PayloadDisplayName</key><string>Wi-Fi ${xml(wifi.ssid)}</string>
      <key>PayloadIdentifier</key><string>online.hostes.xoxo.wifi.network</string>
      <key>PayloadType</key><string>com.apple.wifi.managed</string>
      <key>PayloadUUID</key><string>${network}</string>
      <key>PayloadVersion</key><integer>1</integer>
      <key>SSID_STR</key><string>${xml(wifi.ssid)}</string>
    </dict>
  </array>
  <key>PayloadDescription</key><string>Подключение к гостевому Wi-Fi XOXO.</string>
  <key>PayloadDisplayName</key><string>Wi-Fi XOXO</string>
  <key>PayloadIdentifier</key><string>online.hostes.xoxo.wifi</string>
  <key>PayloadOrganization</key><string>XOXO · Hostess</string>
  <key>PayloadRemovalDisallowed</key><false/>
  <key>PayloadType</key><string>Configuration</string>
  <key>PayloadUUID</key><string>${profile}</string>
  <key>PayloadVersion</key><integer>1</integer>
</dict>
</plist>
`;
}

/** GET /wifi/xoxo.mobileconfig — current network from Command Center through the same BFF. */
export async function wifiProfileResponse(request: Request, runtime: unknown) {
  const url = new URL(request.url);
  if (url.pathname !== WIFI_PROFILE_PATH) return null;
  if (request.method !== "GET" && request.method !== "HEAD")
    return new Response("Метод недоступен", { status: 405 });
  const headers = new Headers();
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) headers.set("cf-connecting-ip", ip);
  const upstream = await proxyHostessApi(
    new Request(new URL("/api/guest/v1/dine-in/wifi?venue=xoxo", url), { headers }),
    runtime,
  );
  const data = upstream?.ok
    ? ((await upstream.json().catch(() => null)) as { wifi?: GuestWifi | null } | null)
    : null;
  if (!data?.wifi)
    return new Response("Wi-Fi сейчас недоступен", {
      status: upstream?.ok ? 404 : 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  return new Response(request.method === "HEAD" ? null : await wifiMobileconfig(data.wifi), {
    headers: {
      "content-type": "application/x-apple-aspen-config; charset=utf-8",
      "content-disposition": 'attachment; filename="xoxo-wifi.mobileconfig"',
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
}
