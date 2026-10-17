import {
  MIN_SERVICE_KEY_LENGTH,
  resolveHostessRuntimeEnv,
  type BindingSource,
  type ResolvedHostessRuntime,
} from "./runtime-env";

export interface BffDiagnosticLog {
  event: "hostess.bff.proxy";
  method: string;
  pathname: string;
  bookingOriginAvailable: boolean;
  exchangeOriginAvailable: boolean;
  serviceKeyAvailable: boolean;
  serviceKeySatisfiesMinLength: boolean;
  bindingSource: BindingSource;
  bindingSources: ResolvedHostessRuntime["sources"];
  deployedBuildSha: string;
  upstreamAttempted: boolean;
  outcome:
    | "upstream_response"
    | "missing_upstream_origin"
    | "missing_service_key"
    | "short_service_key"
    | "malformed_origin"
    | "insecure_origin"
    | "upstream_redirect_blocked"
    | "upstream_non_json"
    | "upstream_fetch_error";
  status: number;
  upstreamErrorCategory?: string;
}

let lastBffDiagnostic: BffDiagnosticLog | null = null;

export function getLastBffDiagnosticForTests(): BffDiagnosticLog | null {
  return lastBffDiagnostic;
}

function recordBffDiagnostic(
  request: Request,
  url: URL,
  resolved: ResolvedHostessRuntime,
  upstreamAttempted: boolean,
  outcome: BffDiagnosticLog["outcome"],
  status: number,
  upstreamErrorCategory?: string,
): BffDiagnosticLog {
  const entry: BffDiagnosticLog = {
    event: "hostess.bff.proxy",
    method: request.method,
    pathname: url.pathname,
    bookingOriginAvailable: resolved.diagnostics.bookingOriginAvailable,
    exchangeOriginAvailable: resolved.diagnostics.exchangeOriginAvailable,
    serviceKeyAvailable: resolved.diagnostics.serviceKeyAvailable,
    serviceKeySatisfiesMinLength: resolved.diagnostics.serviceKeySatisfiesMinLength,
    bindingSource: resolved.diagnostics.bindingSource,
    bindingSources: resolved.sources,
    deployedBuildSha: resolved.diagnostics.deployedBuildSha,
    upstreamAttempted,
    outcome,
    status,
    ...(upstreamErrorCategory ? { upstreamErrorCategory } : {}),
  };
  lastBffDiagnostic = entry;
  const serialized = JSON.stringify(entry);
  if (outcome === "upstream_response" && status < 500) {
    console.info("[hostess-bff]", serialized);
  } else {
    console.warn("[hostess-bff]", serialized);
  }
  return entry;
}

const guestPrefix = "/api/guest/v1/";
const guestRoutes: [RegExp, string][] = [
  [/^availability$/, "GET"],
  [/^profile$/, "GET"],
  [/^(bootstrap|claims|logout|holds|quotes|reservations|ownership)$/, "POST"],
  [/^reservations\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/, "PATCH"],
];
const dineInRoutes: [RegExp, string][] = [
  [/^dine-in\/tables\/[A-Za-z0-9_-]{20,128}$/, "GET"],
  [/^dine-in\/menu$/, "GET"],
  [/^dine-in\/quotes$/, "POST"],
  [/^dine-in\/orders$/, "GET POST"],
  [/^dine-in\/orders\/[a-f0-9-]{36}$/, "GET"],
  [/^loyalty\/(wallet|transactions)$/, "GET"],
];
const guestCookieNames = "(?:__Host-hostess-guest|__Host-hostess-dining|__Host-hostess-anonymous)";
const reply = (
  status: number,
  message: string,
  meta?: {
    buildSha?: string;
    configError?: string;
    upstreamError?: string;
    bindingSource?: BindingSource;
  },
) => {
  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
  });
  if (meta?.buildSha) headers.set("x-hostess-build", meta.buildSha);
  if (meta?.configError) headers.set("x-hostess-config-error", meta.configError);
  if (meta?.upstreamError) headers.set("x-hostess-upstream-error", meta.upstreamError);
  if (meta?.bindingSource) headers.set("x-hostess-binding-source", meta.bindingSource);
  return new Response(JSON.stringify({ error: { code: "SERVICE_UNAVAILABLE", message } }), {
    status,
    headers,
  });
};
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
  const route = [...guestRoutes, ...dineInRoutes].find(([path]) => path.test(resource));
  if (booking && !route) return reply(404, "Операция недоступна");
  if (
    (exchange && request.method !== "GET") ||
    (route && !route[1].split(" ").includes(request.method))
  )
    return reply(405, "Метод недоступен");
  const resolved = await resolveHostessRuntimeEnv(request, runtime);
  const upstream = exchange ? resolved.exchangeOrigin : resolved.bookingOrigin;
  const serviceKey = resolved.serviceKey;
  const bindingSource = resolved.diagnostics.bindingSource;
  const buildSha = resolved.buildSha;
  if (!upstream) {
    recordBffDiagnostic(request, url, resolved, false, "missing_upstream_origin", 503);
    return reply(503, "Сервис пока не настроен", {
      buildSha,
      configError: "missing-upstream-origin",
      bindingSource,
    });
  }
  if (booking && !serviceKey) {
    recordBffDiagnostic(request, url, resolved, false, "missing_service_key", 503);
    return reply(503, "Сервис пока не настроен", {
      buildSha,
      configError: "missing-service-key",
      bindingSource,
    });
  }
  if (booking && serviceKey && serviceKey.length < MIN_SERVICE_KEY_LENGTH) {
    recordBffDiagnostic(request, url, resolved, false, "short_service_key", 503);
    return reply(503, "Сервис пока не настроен", {
      buildSha,
      configError: "short-service-key",
      bindingSource,
    });
  }
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
    recordBffDiagnostic(request, url, resolved, false, "malformed_origin", 503);
    return reply(503, "Некорректная настройка сервиса", {
      buildSha,
      configError: "malformed-origin",
      bindingSource,
    });
  }
  const local =
    target.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(target.hostname) &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (target.protocol !== "https:" && !local) {
    recordBffDiagnostic(request, url, resolved, false, "insecure_origin", 503);
    return reply(503, "Требуется защищённый адрес сервиса", {
      buildSha,
      configError: "insecure-origin",
      bindingSource,
    });
  }
  if (
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash
  ) {
    recordBffDiagnostic(request, url, resolved, false, "malformed_origin", 503);
    return reply(503, "Некорректная настройка сервиса", {
      buildSha,
      configError: "malformed-origin",
      bindingSource,
    });
  }
  if (request.method !== "GET") {
    // No cross-site requests, even before login. Service key never reaches browser.
    if (request.headers.get("origin") !== url.origin)
      return reply(403, "Недопустимый источник запроса");
    if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type") ?? ""))
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
    try {
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
    } catch {
      return reply(400, "Не удалось прочитать запрос");
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
    if (response.status >= 300 && response.status < 400) {
      recordBffDiagnostic(
        request,
        url,
        resolved,
        true,
        "upstream_redirect_blocked",
        502,
        "redirect",
      );
      return reply(502, "Перенаправление сервиса запрещено", {
        buildSha,
        upstreamError: "redirect",
        bindingSource,
      });
    }
    if (!response.headers.get("content-type")?.includes("application/json")) {
      recordBffDiagnostic(
        request,
        url,
        resolved,
        true,
        "upstream_non_json",
        502,
        "invalid-content-type",
      );
      return reply(502, "Сервис вернул некорректный ответ", {
        buildSha,
        upstreamError: "invalid-content-type",
        bindingSource,
      });
    }
    const outgoing = new Headers({
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    });
    if (buildSha) outgoing.set("x-hostess-build", buildSha);
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
        /;\s*httponly(?:;|$)/i.test(cookie) &&
        (/;\s*samesite=(?:lax|strict)(?:;|$)/i.test(cookie) ||
          (/^__Host-hostess-(?:guest|dining|anonymous)=;/.test(cookie) &&
            /;\s*max-age=0(?:;|$)/i.test(cookie)))
      )
        outgoing.append("set-cookie", cookie);
    }
    recordBffDiagnostic(request, url, resolved, true, "upstream_response", response.status);
    return new Response(response.body, { status: response.status, headers: outgoing });
  } catch (error) {
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
    recordBffDiagnostic(request, url, resolved, true, "upstream_fetch_error", 503, category);
    return reply(503, "Соединение прервано. Проверьте бронь в кабинете перед повтором", {
      buildSha,
      upstreamError: category,
      bindingSource,
    });
  }
}
