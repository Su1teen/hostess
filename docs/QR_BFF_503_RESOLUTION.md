# QR BFF 503 (`SERVICE_UNAVAILABLE`) — Root Cause & Resolution

## 1. Почему Cloudflare BFF возвращал HTTP 503 при настроенных переменных

Запрос `GET /api/guest/v1/dine-in/tables/{token}` (а также `GET /api/guest/v1/profile`) завершался в `src/lib/server/guest-proxy.ts` с ответом:

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Сервис пока не настроен"
  }
}
```

Причина состояла из двух взаимосвязанных факторов на стыке **Nitro `cloudflare-module` preset** и **Cloudflare Workers Builds / Wrangler**:

1. **Потеря аргумента `env` при вызове SSR-сервиса внутри Nitro (`lazyService`)**:
   - В сгенерированном бандле `.output/server/index.mjs` входной обработчик Worker получал `(request, env, context)`, сохранял `globalThis.__env__ = env` и обогащал `request.runtime.cloudflare = { env, context }`, после чего передавал управление через `nitroApp.fetch(request)` -> `_chunks/ssr-renderer.mjs` -> `fetchViteEnv("ssr", req)` -> `lazyService(() => import("./_ssr/ssr.mjs"))`.
   - Функция `lazyService` вызывала `mod.fetch(req)` **только с одним аргументом (`req`)**, из-за чего в `src/server.ts` (`fetch(request, env, ctx)`) второй аргумент `env` в рантайме всегда оказывался `undefined`.
   - При этом `src/lib/server/guest-proxy.ts` и `src/server.ts` не использовали официальный модуль `cloudflare:workers` (`import { env } from "cloudflare:workers"`) и не обращались к `globalThis.__env__`, полагаясь исключительно на нестандартное свойство `request.runtime?.cloudflare?.env` и `process.env`.

2. **Разделение Build-time и Runtime bindings в Cloudflare Workers Builds и перезапись секретов Wrangler**:
   - В `vite.config.ts` переменные `BOOKING_API_ORIGIN` и `EXCHANGE_API_ORIGIN` записывались напрямую в `.output/server/wrangler.json` (`vars`), тогда как `HOSTESS_BFF_KEY` не передавался из окружения сборки в Worker runtime.
   - Когда `npx wrangler deploy` запускается в контейнере Cloudflare Workers Builds со сгенерированным `.output/server/wrangler.json`, переменные из `process.env` контейнера сборки **не загружаются** в Worker runtime автоматически (для секретов Wrangler требует `--secrets-file`).
   - Кроме того, до включения `keep_vars: true` и `unsafe.metadata.keep_bindings` деплой со сгенерированным `wrangler.json` сбрасывал сохранённые в Dashboard runtime-секреты (`secret_text` / `secrets_store_secret`), а пустые строки (`""`) не отфильтровывались при резолвинге fallback-источников.

---

## 2. Какой механизм runtime bindings используется теперь

Внедрён изолированный серверный адаптер окружения `src/lib/server/runtime-env.ts` (`resolveHostessRuntimeEnv`), который разрешает `BOOKING_API_ORIGIN`, `EXCHANGE_API_ORIGIN`, `HOSTESS_BFF_KEY` и `HOSTESS_BUILD_SHA` в порядке приоритета:

1. **`fetch argument`** — аргумент `env`, переданный в `fetch(request, env, ctx)` (этап постобработки `scripts/prepare-cloudflare-deploy.mjs` также пробрасывает `(req, env, ctx)` через `lazyService` в `.output/server/index.mjs`);
2. **`Cloudflare module env`** — официальный рантайм-модуль Cloudflare Workers `import { env } from "cloudflare:workers"` (плюс привязка `globalThis.__cf_workers_env__` во входной точке `.output/server/index.mjs`);
3. **`Nitro context`** — `request.runtime?.cloudflare?.env` и `globalThis.__env__`;
4. **`process.env`** — серверный fallback для локальной разработки и превью.

Адаптер:

- поддерживает как строковые bindings (`plain_text` / `secret_text`), так и объекты Cloudflare Secrets Store (`{ get(): Promise<string> }`);
- очищает значения от обрамляющих пробелов/кавычек и игнорирует пустые строки, не блокируя переход к следующему источнику;
- различает отсутствие `BOOKING_API_ORIGIN` (`missing-upstream-origin`), отсутствие `HOSTESS_BFF_KEY` (`missing-service-key`), недостаточную длину ключа `< 32` (`short-service-key`), некорректный URL (`malformed-origin`), небезопасный протокол (`insecure-origin`) и сетевые сбои upstream (`x-hostess-upstream-error`);
- пишет в серверные логи структурированную диагностику (`[hostess-bff]`) с булевыми флагами `bookingOriginAvailable`, `exchangeOriginAvailable`, `serviceKeyAvailable`, `serviceKeySatisfiesMinLength`, источником `bindingSource`, `deployedBuildSha` и `upstreamAttempted` **без вывода секретов, их фрагментов или хешей**.

---

## 3. Как конфигурация деплоя предотвращает потерю variables/secrets

1. В `vite.config.ts` и `scripts/prepare-cloudflare-deploy.mjs` для `.output/server/wrangler.json` гарантированно устанавливаются:
   - `"keep_vars": true`
   - `"unsafe": { "metadata": { "keep_bindings": ["plain_text", "json", "secret_text", "secret_key", "secrets_store_secret"] } }`
2. Скрипт `scripts/prepare-cloudflare-deploy.mjs`, выполняемый при `npm run build`:
   - проверяет, что `HOSTESS_BFF_KEY` ни при каких условиях не попал в клиентские ассеты `.output/public`;
   - если `HOSTESS_BFF_KEY` задан в окружении сборки Cloudflare Workers Builds (`>= 32` символов), формирует временный файл `.wrangler/deploy/secrets.json` (вне `.output/`, в `.gitignore`) и через локальный шим `node_modules/.bin/wrangler` передаёт `--keep-vars` и `--secrets-file` в `wrangler deploy` / `wrangler versions upload`, удаляя временный файл сразу после завершения команды.

---

## 4. Проверенный Cloudflare build SHA и результаты E2E-проверок в production

- **Репозиторий / ветка**: `Su1teen/hostess` (`main`, PR `#7` объединён в `main`)
- **Проверенные Cloudflare build SHA**:
  - `22ea6c65cc34d858db398f1c6fbffd6fab648526` (активный Worker после восстановления runtime-секрета)
  - `30cd7ea99da250f5095f97bf25c4ab47198df2bf` (мерж-коммит PR `#7` в `main`)

### Результаты проверок реального production (`https://hostes.online`)

| Проверка                            | Запрос / Сценарий                                                                                                                       | Ожидание                                                                                    | Фактический результат                                                                                                                                                                                                                                                             |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Guest API**                    | `GET https://hostes.online/api/guest/v1/profile`                                                                                        | `401` (`SESSION_REQUIRED`), не `503`                                                        | **HTTP 401** `{"error":{"code":"SESSION_REQUIRED","message":"Войдите по ссылке WhatsApp или начните новую бронь"}}`                                                                                                                                                               |
| **B. XOXO Menu**                    | `GET https://hostes.online/api/guest/v1/dine-in/menu?venue=xoxo`                                                                        | `200`, опубликованное меню                                                                  | **HTTP 200**, `status: "ok"`, 27 опубликованных позиций меню XOXO                                                                                                                                                                                                                 |
| **C. QR Table**                     | `GET https://hostes.online/api/guest/v1/dine-in/tables/{redacted-token}`                                                                | `200`, совпадение с Command Center manifest                                                 | **HTTP 200**: `venueCode: "xoxo"`, `resourceId: "75929542-180a-4d69-a537-b0c2a36b482a"`, `code: "01"`, `name: "Стол 01"`, `zoneName: "Первый зал"`, `enabled: true` (17 активных QR-столов `8/3/3/3`)                                                                             |
| **D. Guest UI (Chromium & WebKit)** | Открытие `https://hostes.online/v/xoxo/t/01/{redacted-token}` + reload + quote                                                          | Отображение XOXO, стола, зоны, меню, цен, корзины, расчёт quote (`201`) без создания заказа | **PASS (Chromium & WebKit)**: заголовок `XOXO`, `Стол №01`, `Стол 01`, зона `Первый зал`, 27 позиций с ценами в `₸`, `POST /api/guest/v1/dine-in/quotes` -> **HTTP 201**, cookie `__Host-hostess-dining` выставлена, прямой `reload` -> **HTTP 200**                              |
| **E. Regressions**                  | `/api/guest/v1/availability`, `/guest`, `/auth/claim`, `/xoxo`, `/api/exchange/current-round`, `/api/guest/v1/logout`, security headers | Отсутствие регрессий бронирования, биржи, claim и заголовков безопасности                   | **PASS**: `availability` -> `200`, `/guest` -> `200`, `/auth/claim` -> `200` (`no-store, no-transform`, `frame-ancestors 'none'`), `/xoxo` -> `200`, `/api/exchange/current-round` -> `200`, QR headers (`no-store, no-transform`, `no-referrer`, `noindex, nofollow, noarchive`) |
