// Deliberately bypass SSR/error reporting/analytics on the sensitive claim page.
export function claimPage(request: Request): Response | null {
  if (new URL(request.url).pathname !== "/auth/claim") return null;
  if (request.method !== "GET") return new Response(null, { status: 405 });
  return new Response(
    `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer"><title>Hostess · ваша бронь</title><link rel="stylesheet" href="/guest-claim.css"></head><body><main><p>HOSTESS × XOXO</p><h1>Ваша бронь.<br>В одном месте.</h1><p>Откройте защищённый кабинет, чтобы увидеть бронь, предзаказ и историю.</p><button id="claim" type="button">Открыть мой кабинет</button><p id="status" role="status" aria-live="polite">Ссылка действует 12 минут и используется один раз.</p></main><script src="/guest-claim.js" defer></script></body></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
        "x-robots-tag": "noindex, nofollow, noarchive",
        "content-security-policy":
          "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      },
    },
  );
}
