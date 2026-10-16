type Runtime = {
  EXCHANGE_API_ORIGIN?: string;
  BOOKING_API_ORIGIN?: string;
  HOSTESS_BFF_KEY?: string;
};
const guestPrefix = "/api/guest/v1/";
const allowed = new Set([
  "availability",
  "bootstrap",
  "claims",
  "profile",
  "logout",
  "holds",
  "quotes",
  "reservations",
  "ownership",
]);
const dineInRoutes: [RegExp, string][] = [
  [/^dine-in\/tables\/[A-Za-z0-9_-]{20,128}$/, "GET"],
  [/^dine-in\/menu$/, "GET"],
  [/^dine-in\/quotes$/, "POST"],
  [/^dine-in\/orders$/, "GET POST"],
  [/^dine-in\/orders\/[a-f0-9-]{36}$/, "GET"],
  [/^loyalty\/(wallet|transactions)$/, "GET"],
];
const guestCookieNames = "(?:__Host-hostess-guest|__Host-hostess-dining|__Host-hostess-anonymous)";
const reply = (status: number, message: string) =>
  new Response(JSON.stringify({ error: { code: "SERVICE_UNAVAILABLE", message } }), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
export async function proxyHostessApi(
  request: Request,
  runtime: unknown,
): Promise<Response | null> {
  const url = new URL(request.url);
  const exchange = url.pathname === "/api/exchange/current-round";
  const booking = url.pathname.startsWith(guestPrefix);
  if (!exchange && !booking) return null;
  if (url.search.length > 2000) return reply(414, "Запрос слишком большой");
  const resource = url.pathname.slice(guestPrefix.length);
  const dining = dineInRoutes.find(([path]) => path.test(resource));
  if (
    booking &&
    !allowed.has(resource) &&
    !/^reservations\/[a-f0-9-]{36}$/.test(resource) &&
    !dining
  )
    return reply(404, "Операция недоступна");
  if (
    !["GET", "POST", "PATCH"].includes(request.method) ||
    (exchange && request.method !== "GET") ||
    (dining && !dining[1].split(" ").includes(request.method))
  )
    return reply(405, "Метод недоступен");
  const env = (runtime ?? {}) as Runtime;
  const requestEnv = (request as Request & { runtime?: { cloudflare?: { env?: Runtime } } }).runtime
    ?.cloudflare?.env;
  // Cloudflare bindings first; local Nitro preview uses server-only process.env.
  const configured = (key: keyof Runtime) =>
    env[key] ??
    requestEnv?.[key] ??
    (typeof process !== "undefined" ? process.env[key] : undefined);
  const upstream = configured(exchange ? "EXCHANGE_API_ORIGIN" : "BOOKING_API_ORIGIN");
  const serviceKey = configured("HOSTESS_BFF_KEY");
  if (!upstream || (booking && (!serviceKey || serviceKey.length < 32)))
    return reply(503, "Сервис пока не настроен");
  let target: URL;
  try {
    // A Railway public hostname is an HTTPS origin, never a relative URL.
    const origin = upstream.trim();
    target = new URL(
      /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.up\.railway\.app$/i.test(origin)
        ? `https://${origin}`
        : origin,
    );
  } catch {
    return reply(503, "Некорректная настройка сервиса");
  }
  const local =
    target.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(target.hostname) &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (target.protocol !== "https:" && !local)
    return reply(503, "Требуется защищённый адрес сервиса");
  if (target.username || target.password || target.pathname !== "/" || target.search || target.hash)
    return reply(503, "Некорректная настройка сервиса");
  if (request.method !== "GET") {
    // No cross-site requests, even before login. Service key never reaches browser.
    if (request.headers.get("origin") !== url.origin)
      return reply(403, "Недопустимый источник запроса");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return reply(415, "Нужен JSON");
  }
  const headers = new Headers({ accept: "application/json" });
  if (booking) {
    headers.set("x-hostess-service-key", serviceKey!);
    // Forward only the guest cookie, never staff/session cookies from other applications.
    const guest = (request.headers.get("cookie") ?? "")
      .split(";")
      .map((v) => v.trim())
      .filter((v) => new RegExp(`^${guestCookieNames}=[A-Za-z0-9_-]{43}$`).test(v));
    if (guest.length) headers.set("cookie", guest.join("; "));
    const ip = request.headers.get("cf-connecting-ip");
    // Trusted CF header is available on Workers; local preview shares a local bucket.
    headers.set("x-hostess-client-id", ip ?? "local");
    // Receipt capabilities belong in a header, never in access-log URLs.
    if (/^dine-in\/orders\/[a-f0-9-]{36}$/.test(resource)) {
      const receipt =
        request.headers.get("x-hostess-receipt-token") ?? url.searchParams.get("receiptToken");
      url.searchParams.delete("receiptToken");
      if (receipt) {
        if (!/^[A-Za-z0-9_-]{43}$/.test(receipt)) return reply(400, "Некорректный доступ к заказу");
        headers.set("x-hostess-receipt-token", receipt);
      }
    }
  }
  let body: Uint8Array | undefined;
  if (request.method !== "GET") {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (!reader) return reply(400, "Пустой запрос");
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 32768) {
        await reader.cancel();
        return reply(413, "Запрос слишком большой");
      }
      chunks.push(part.value);
    }
    body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
    headers.set("content-type", "application/json");
  }
  try {
    const path = exchange ? "/api/v1/public/snapshot" : url.pathname;
    const response = await fetch(`${target.origin}${path}${exchange ? "" : url.search}`, {
      method: request.method,
      headers,
      body: body as BodyInit | undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status >= 300 && response.status < 400)
      return reply(502, "Перенаправление сервиса запрещено");
    if (!response.headers.get("content-type")?.includes("application/json"))
      return reply(502, "Сервис вернул некорректный ответ");
    const outgoing = new Headers({
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    });
    const cookies =
      response.headers.getSetCookie?.() ??
      response.headers.get("set-cookie")?.split(/,(?=\s*__Host-)/) ??
      [];
    for (const cookie of cookies) {
      if (
        booking &&
        new RegExp(`^${guestCookieNames}=(?:[A-Za-z0-9_-]{43})?;`).test(cookie.trim()) &&
        !/;\s*domain=/i.test(cookie) &&
        /;\s*path=\/(?:;|$)/i.test(cookie) &&
        /;\s*secure(?:;|$)/i.test(cookie) &&
        /;\s*httponly(?:;|$)/i.test(cookie)
      )
        outgoing.append("set-cookie", cookie);
    }
    return new Response(response.body, { status: response.status, headers: outgoing });
  } catch (error) {
    const response = reply(503, "Соединение прервано. Проверьте бронь в кабинете перед повтором");
    const message = error instanceof Error ? error.message : "";
    const category = /timeout|abort/i.test(message)
      ? "timeout"
      : /ssl|tls|certificate/i.test(message)
        ? "tls"
        : /dns|resolve/i.test(message)
          ? "dns"
          : /redirect/i.test(message)
            ? "redirect"
            : /illegal invocation|not a function/i.test(message)
              ? "runtime"
              : "network";
    response.headers.set("x-hostess-upstream-error", category);
    return response;
  }
}
