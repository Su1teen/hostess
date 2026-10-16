# QR ordering — live acceptance, 17 октября 2026

**Итог: FAIL для полной production-интеграции.** Сайт и Exchange работают, но Cloudflare guest BFF отвечает 503 из-за конфигурации. Локальные проверки checkout/identity/loyalty пройдены на fixtures и отдельной PostgreSQL; они не являются доказательством production-заказа.

## Проверенные версии и deployment evidence

| Компонент | Версия / доказательство |
| --- | --- |
| Hostess main до аудита | `90cf28a0fcdde5a79cd17d9fe6287f2205aa475e` |
| Hostess исправления | `59ede90c2965fe206bf1069ffb1ae9a5d5fff2c6`; отчет добавлен отдельным последующим коммитом |
| Cloudflare deployed SHA при первичном аудите | `90cf28a0fcdde5a79cd17d9fe6287f2205aa475e`, фактический `x-hostess-build` на обоих hostname |
| Cloudflare Worker | `hostess`; Workers Builds check success, build `d067d945-43e8-4564-8605-fb63211b6068` |
| Command Center исходный main / deployed SHA | `8fdac23fcfeb45b78f724f01ddb4e84a343fa2ee` |
| Command Center исправления | `279325d2c4b4424c077376b1bd82232270fea89b` |
| Railway Command Center deployment до исправлений | `b368023e-8859-4af2-9851-f4af1562663b`, SUCCESS |
| XOXO main / deployed SHA | `e9bbe282fad44eeb441cd4d39051e41f861dc04d`, изменений не потребовалось |
| Railway XOXO deployment | `ed9fbd19-d697-4d6a-b85b-7e6d934bc5e6`, SUCCESS |

Cloudflare check: https://dash.cloudflare.com/9e76cfb57990aaf11331f05b9d7386a1/workers/services/view/hostess/production/builds/d067d945-43e8-4564-8605-fb63211b6068

Read-only HTTP/browser evidence: [qr-live-2026-10-17.json](evidence/qr-live-2026-10-17.json), начало наблюдения `2026-10-16T23:01:51.891Z` (17 октября по Asia/Qyzylorda). Новые исправления нельзя считать развернутыми по этому старому SHA; последующее подтверждение записывается отдельно ниже.

## Hostname и доступность

Основной домен **https://hostes.online**. Альтернативный адрес того же Worker: **https://hostess.sultansovetov2003.workers.dev**. В исходном задании была опечатка с двойной s: тот hostname возвращает NXDOMAIN, в том числе через независимый Google DNS. Владелец подтвердил правильный домен во время аудита.

| Проверка на обоих hostname | Результат |
| --- | --- |
| `/`, `/xoxo`, `/guest` | PASS: HTTP 200, SSR HTML |
| `/auth/claim` | PASS: HTTP 200, отдельная инертная HTML-страница, no-store/no-referrer, строгий CSP |
| `/api/exchange/current-round` | PASS: HTTP 200, живой Railway snapshot и опубликованный round, no-store |
| `/api/guest/v1/profile` | FAIL: 503 SERVICE_UNAVAILABLE, «Сервис пока не настроен» |
| `/api/guest/v1/dine-in/menu?venue=xoxo` | FAIL: тот же 503 |
| `/api/guest/v1/loyalty/wallet?venue=xoxo` | FAIL: тот же 503 |
| Совпадение Worker / main до исправлений | PASS: одинаковый полный `x-hostess-build` на обоих адресах и GitHub main |
| Cloudflare runtime logs, список secrets, version ID через control plane | BLOCKED: нет авторизованной Cloudflare-сессии/коннектора |

Это подтверждает маршрутизацию действующего custom domain в текущую версию приложения, но не представляет DNS/control-plane inventory зоны. Ответ 503 формируется до обращения к Railway при отсутствии booking origin либо HOSTESS_BFF_KEY длиной хотя бы 32 символа. Booking origin задан в build-конфигурации; наиболее вероятен отсутствующий/короткий Cloudflare secret. Его значение или совпадение с Railway без авторизованного доступа не подтверждены.

В Railway OAuth проверены **имена** переменных: HOSTESS_BFF_KEY, HOSTESS_PUBLIC_ORIGIN, DINE_IN_ENABLED, DINE_IN_PILOT_ASSUMED_PAID и другие присутствуют. Значения скрыты OAuth; наличие имени не доказывает правильное значение. Значение HOSTESS_PUBLIC_ORIGIN явно установлено через Railway в `https://hostes.online` с skipDeploys; применяется при следующем deployment Command Center. Другие secrets/flags не менялись.

## 17 production QR

**BLOCKED, 0/17 проверено в production.** Нет staff session или авторизованного экспорта. Непроверенные коды: **01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17**. Для них не подтверждены реальные URL, resourceId, имя, зона, enabled и direct/reload на production. Новые production-токены не создавались, bootstrap/rotation/disable не выполнялись.

Railway runtime log дает отдельное доказательство применения migration 0006: `2026-10-16T17:34:54.760134909Z [migrate] applied 0006_dine_in.sql`. Это не подменяет чтение 17 фактических записей через staff API.

В изолированной PostgreSQL PASS: 17 уникальных ресурсов и токенов, стабильный повтор bootstrap, все table API, QR SVG/PNG/ZIP/print, инвалидирование после тестовой rotation/disable. В frontend fixtures PASS: прямое открытие всех 17, refresh и корзина 03→04→03 без переноса контекста.

## Контракт и деньги

Сопоставлены фактические `src/server/dine-in/{api,domain,presentation,service,loyalty}.ts` Command Center и Hostess Zod schemas, а не только текст документа.

- Guest prefix `/api/guest/v1`, header `x-hostess-service-key`, trusted `x-hostess-client-id`; ошибки `{error:{code,message}}`.
- Quote: `{qrToken,items:[{productId,quantity}],redeemAmount}` в KZT либо `redeemMinor` в тиынах, не оба. Не передаются guestId, цены или totals.
- Checkout: `{quoteId,idempotencyKey}`. Backend не выдает checkoutToken; optional legacy consumer field не добавляется, когда его нет в ответе.
- Таблица, menu, quote, `{order}`, wallet, `{orders,nextCursor}`, `{transactions,nextCursor}` совместимы. Реальный backend suite может загружать текущие frontend-схемы через `HOSTESS_CONSUMER_ROOT`.
- Canonical `*Minor` — тиыны; persisted bigint — строки. Presentation aliases — числа KZT. Дополнительного деления/умножения в frontend нет.
- Quote TTL `min(now + 120 секунд, round.endsAt)`, последние пять секунд раунда требуют REQUOTE; menu freshness 60 секунд.
- Order ID UUID; orderNumber — только отображение. Анонимный owner cookie `__Host-hostess-dining`, guest session `__Host-hostess-guest`, оба 43-character base64url, Secure/HttpOnly/Path=/.
- Receipt capability — отдельный 43-character token. Теперь frontend отправляет его в `x-hostess-receipt-token`; BFF сохраняет header и убирает legacy query перед Railway.
- Ledger: earn/redeem/expire/reversal/adjustment; amount signed KZT; opaque cursor timestamp|UUID. Wallet содержит серверный баланс, долг в canonical представлении, сроки и отдельные lots.

**PASS на настоящем backend с изолированной PostgreSQL:** 3×1590=4770 KZT, redeem 1000, payable 3770, cashback 113; полное списание дает нулевой cashback. Это не live Railway purchase.

## Identity, claim и privacy

PASS локально: anonymous receipt ownership, чужой owner не читает заказ; typed phone не открывает существующий wallet; provisional/verified/staff-created guests; verified WhatsApp merge сохраняет lots, ledger и order references; magic link expiry/replay и revoked session; несколько Set-Cookie и deletion проходят BFF вместе. AuthContext остался выбором интерфейса, серверная identity определяется `/profile`.

PASS read-only на действующем домене в Chromium/Pixel 7 и WebKit/iPhone 13: `/xoxo` отображается без горизонтального overflow; `/auth/claim#token=<synthetic invalid sentinel>` удаляет fragment; sentinel не попадает в request URLs; pageErrors отсутствуют. Реальный token не потреблялся. Успешная production claim/session/reservations того же guest_id — **BLOCKED** из-за BFF 503 и отсутствия выделенного аккаунта.

На основном домене в claim HTML обнаружена вставка Cloudflare Analytics; строгий CSP блокирует сторонний скрипт. Добавлен `no-transform` на claim/QR HTML, чтобы запретить автоматическое внедрение. Основание: https://developers.cloudflare.com/web-analytics/get-started/ . Реальный edge-эффект проверяется после deployment. CSP не ослаблялся.

Исправлено сохранение персональных квитанций/pending quotes после logout или смены identity. Очистка распространяется на все table keys; carts с product IDs сохраняются. Успешный WhatsApp claim также очищает capabilities предыдущей identity. Старые асинхронные ответы не восстанавливают квитанцию после смены аккаунта; GuestPortal защищен от запоздалого profile response.

## Checkout, loyalty и browser validation

| Проверка | Результат |
| --- | --- |
| Hostess unit + SSR | PASS, 39 tests |
| Hostess typecheck | PASS |
| Hostess lint | PASS, 0 errors; 26 warnings (Fast Refresh/ref cleanup, включая существующие) |
| Hostess Nitro/Cloudflare build | PASS; generated Worker name теперь `hostess`, keep_vars и server-only key сохранены |
| Android Chromium fixtures | PASS, 17 QR, корзины, disabled item/QR, anonymous checkout, timeout retry с тем же key, bootstrap, expired quote, REQUOTE, redemption, logout, network recovery/foreground |
| Desktop Chromium fixtures | PASS, тот же набор и базовая keyboard navigation |
| iOS WebKit fixtures | PASS, тот же набор; это эмуляция, не физический iPhone |
| Длинные названия | PASS, fixture и horizontal overflow checks |
| Command Center unit | PASS, 29 tests после merge актуального main |
| Command Center booking PostgreSQL | PASS, 31 tests, включая WhatsApp/claim/ownership |
| Command Center dining PostgreSQL + текущий consumer | PASS, 35 tests после merge на Node/Vitest, включая настоящий Hostess BFF и XOXO receiver schema |
| Migration runner clean/replay | PASS, 0001–0007 после merge, 17 unchanged tokens в отдельной тестовой схеме |
| Command Center typecheck/lint/build | PASS, lint 0 errors / 9 warnings |
| XOXO unit/contract | PASS, 183 tests; 15 receiver contract tests входят в это число |
| XOXO PostgreSQL receiver | PASS, 16 tests на отдельной `qr_integration_test` |
| XOXO PostgreSQL exchange pipeline | PASS, 8 tests на отдельной базе |
| XOXO typecheck/lint/build | PASS |
| Реальные production orderId/amount/ledger в Command Center | BLOCKED, production writes не выполнялись |
| Физические устройства, полный accessibility audit, bandwidth throttling | Не подтверждены этим проходом; не объявляются PASS |

Windows Bun 1.3.13 зависал на parallel repeat-submit тесте и pool shutdown; тот же неизмененный backend suite прошел полностью на Node/Vitest. Временный адаптер менял только import `bun:test` на Vitest; `HOSTESS_CONSUMER_ROOT` указывал на текущий Hostess. Ошибка не маскируется заявлением «bun suite passed». GitHub Linux/PostgreSQL16 workflow остается отдельной проверкой.

Перед push обнаружены новые upstream commits: Hostess `6144a23` (документация домена), Command Center `7481319`/`c2aeab1` (startup/CRM/physical mapping и отчет). Они сохранены обычным merge. Повторно выполнены backend unit/typecheck/lint/build, 35 PostgreSQL dining tests и migration replay 0001–0007; sibling test использовал настоящий новый Hostess BFF с receipt header и XOXO orderEventSchema. Удалены дубли import, возникшие при автоматическом merge. Параллельный [backend отчет](https://github.com/Su1teen/hostess-command-center/blob/main/docs/FINAL_INTEGRATION_AUDIT.md) содержит отдельные production SQL/QR наблюдения; этот проход не получал 17 секретных URL, поэтому собственная live-проверка всех URL остается BLOCKED.

Реальная изолированная PostgreSQL проверила FIFO partial redemption, отдельные 14-дневные expirations, исключение просроченного баланса, double-spend, idempotency, rollback, cancellation compensation/debt, canonical merge и outbox retry/ACK. UI сохраняет «Заказ принят» / «К оплате официанту» при `assumed_paid`; банковская/Kaspi-оплата не утверждается. Fake localStorage loyalty в production flow не найдено.

## Исправления домена в трех проектах

Hostess: deployment docs, явное имя существующего Worker. Command Center: `.env.example`, QR fallback, deployment/QR docs, test URLs; magic links уже используют HOSTESS_PUBLIC_ORIGIN, поэтому исправлена соответствующая Railway variable. Stored QR tokens не изменены: URL строится из origin и прежнего token. XOXO: полный поиск tracked source/config/docs не нашел ошибочных public-domain ссылок; изменения не внесены.

## Оставшиеся production-действия

1. В Cloudflare Worker **hostess** настроить **существующий** HOSTESS_BFF_KEY, совпадающий с Command Center (минимум 32 символа). Не создавать другой secret в frontend, не менять действующий Railway credential, не публиковать его в чате/репозитории. Подтвердить profile=401 без cookie и доступный dine-in menu вместо локального BFF 503.
2. После deployment Command Center проверить HOSTESS_PUBLIC_ORIGIN=`https://hostes.online` в работающем процессе. Экспортировать существующие 17 QR через авторизованный staff API `/api/staff/v1/tables/qr` или `/tables/qr/export.zip`; не ротировать и не bootstrap ради аудита. Перепечатать панели, если старые содержали опечатку hostname.
3. С авторизованным manifest запустить read-only `HOSTESS_QR_MANIFEST=<private json> node tests/dine-in.live.mjs` и сверить resourceId/name/zone. Не коммитить capabilities в отчет.
4. Выделить тестового guest/стол или staging для полного deployed checkout → waiter order → ledger и реальной WhatsApp claim, включая account switch/session expiry. До этого production order/loyalty acceptance остается BLOCKED.
5. Проверить no-transform на edge, отсутствие analytics на claim/QR, актуальный build SHA и Cloudflare runtime logs после исправлений. При необходимости отключить автоматическую Analytics insertion правилами для чувствительных путей в dashboard.

Ни настоящих заказов, ни начислений/списаний клиентам, ни production token rotation, ни destructive DB testing в этом аудите не выполнялось.

## Проверка после push

Данные добавляются только после фактического push и наблюдения ответа сервера; успешная сборка сама по себе не означает live acceptance.
