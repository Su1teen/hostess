# QR ordering in Hostess

One TanStack Start route, `/v/$venue/t/$table/$token`, serves XOXO tables 01–17, including direct requests and refresh. Command Center validates the token and returns the venue/resource. The URL's venue and table must match that response before ordering is enabled.

## Ownership and transport

Browser → same-origin /api/guest/v1 → Hostess BFF → Command Center → existing PostgreSQL.
XOXO owns exchange products and published rounds. Command Center owns QR tokens, resources, price quotes, orders, guests and loyalty. Hostess has no database connection and generates no QR tokens. Existing /xoxo, reservations and guest claims remain independent.

## Client API contract

At implementation time Command Center main 51e61cf7b14cec92274c5acc911821a664dd087e had no dine-in implementation or docs/DINE_IN_API_CONTRACT.md. The following is an explicit client interface, not evidence that the external server has implemented it. Compare it with the server's final contract before venue use; adapt the typed boundary if its envelopes differ while preserving its ownership and pricing invariants.

All money amounts are numeric **major KZT units**, never tiyn integers or numeric strings. Every new response is validated by Zod in src/lib/dine-in-api.ts.

| Path under /api/guest/v1 | Method | Interface |
| --- | --- | --- |
| /dine-in/tables/:token | GET | {venue:{id,slug,name,currency:"KZT"},table:{resourceId,code,name,zoneName?}} |
| /dine-in/menu?venue=xoxo | GET | {generatedAt,status:"ok" or "no_published_round",currentRound:{id,endsAt} or null,products:[{id,name,price,isAvailable,originalPrice?,changePercent?,category?,imageUrl?}]} |
| /dine-in/quotes | POST | {qrToken,items:[{productId,quantity}],redeemAmount} → quote |
| /dine-in/orders | POST | {quoteId,idempotencyKey,checkoutToken?} → {order} |
| /dine-in/orders/:id?receiptToken=... | GET | {order}; requires guest ownership or limited anonymous capability |
| /dine-in/orders?before=... | GET | {orders:[order],nextCursor?}; authenticated history collection |
| /loyalty/wallet?venue=xoxo | GET | {balance,expiringAmount,nextExpiresAt,lots:[{id,remaining,expiresAt}]} |
| /loyalty/transactions?venue=xoxo&before=... | GET | {transactions:[{id,type,amount,createdAt,expiresAt?,orderId?}],nextCursor?} |

Quote fields: id, roundId, expiresAt, lines, subtotal, discount, payable, cashback, optional checkoutToken.
Order fields: id, orderNumber, createdAt, venueCode, tableCode, status, paymentStatus="assumed_paid", lines, subtotal, discount, payable, cashback, optional cashbackExpiresAt and receiptToken.
Line fields: productId, productName, quantity, unitPrice, total. Dates are ISO timestamps with timezone. Ledger types: earn/redeem/expire/reversal/adjustment. Errors preserve HTTP status and {error:{code,message}}.

GET /dine-in/orders is an additional collection read required by the account. Anonymous binding may use an opaque checkoutToken or an allowlisted cookie. The BFF forwards only __Host-hostess-guest, __Host-hostess-dining and __Host-hostess-anonymous, with 43-character base64url values. Response cookies require Path=/, Secure, HttpOnly and no Domain attribute; deletion is supported. If the final backend uses another name, explicitly add that name and tests, never arbitrary cookies.

## Checkout

1. Validate QR, load live menu and actual server session.
2. Add items by exchange product ID, maximum 20 per item.
3. Request a quote. Display server line prices and totals, never client-authoritative amounts.
4. Require a second click to accept. Expiry, stale snapshot, changed round or REQUOTE requires a new proposal and explicit confirmation.
5. Save the pending quote and UUID before submitting. An unknown outcome keeps the cart locked to the same quote/key. “Проверить заказ” repeats the identical request, including after refresh. It never silently generates another key.
6. Only a validated order response shows “Заказ принят”. The amount is “К оплате официанту”. No bank payment is asserted.
7. Refresh wallet from the server. Command Center calculates 3%, rounds down to whole KZT and creates a separate lot expiring 14 days later. The client never increments a balance.

Menu polling runs every 20 seconds while visible and on focus. Local timers disable checkout after 60-second snapshot freshness, quote expiry or round end without waiting for another HTTP response. During exchange failure the last menu is read-only.

## Identity and privacy

AuthContext's guest/business role is only interface selection. /profile determines anonymous/provisional/verified identity. Anonymous orders cannot spend or earn loyalty. /bootstrap creates a provisional session; entering another guest's phone cannot open that wallet. Existing ownership and WhatsApp claim endpoints establish contact ownership.

Per-venue/table/token sessionStorage holds cart drafts, pending retries and limited anonymous receipt capabilities, never authoritative loyalty/payment state. The flow remounts when QR context changes. Restored receipts must match the current table/venue. The claim page can return to a strictly validated same-origin QR path. Logout clears personal data and stale asynchronous responses cannot repopulate another account. QR HTML and APIs use no-store/no-referrer and QR pages are excluded from indexing.

## Validation

npm test (Bun 1.3.13), npm run typecheck, npm run lint, npm run build.
GitHub Actions additionally exercises mobile UI with isolated fixtures. Unit, transport, SSR and browser fixtures are not proof of PostgreSQL persistence or production deployment. Real acceptance requires the deployed backend contract, shared key and a real order visible to staff. See CLOUDFLARE_DINE_IN_DEPLOYMENT.md.
