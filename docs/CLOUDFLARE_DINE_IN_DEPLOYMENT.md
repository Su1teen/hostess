# Cloudflare dine-in deployment

## Server bindings

```dotenv
BOOKING_API_ORIGIN=https://hostess-command-center-production.up.railway.app
EXCHANGE_API_ORIGIN=https://hostess-xoxo-production.up.railway.app
HOSTESS_BFF_KEY=<same existing secret as Command Center; minimum 32 characters>
```

Keep the existing shared credential. Never prefix it with VITE_, commit its value or expose it to the browser. No DATABASE_URL belongs in Hostess. PostgreSQL, 17 stable QR records, guests, price snapshots, orders and loyalty lots/ledger live in Command Center's existing Railway database.

The existing vite.config.ts keeps Cloudflare keep_vars=true and the two known Railway origins. HOSTESS_BFF_KEY is not declared as a build variable. The BFF reads server runtime/request Cloudflare bindings; local preview can use process.env. Remote origins require HTTPS, no embedded credentials, path, query or fragment. HTTP is permitted only when both incoming request and upstream use localhost/127.0.0.1.

## Deployment order

1. Complete Command Center additive migrations and enable its dine-in pilot flags according to its deployment documentation.
2. Bootstrap its 17 resources and persistent QR records once. Redeployments must retain the tokens.
3. Compare the published server DINE_IN_API_CONTRACT with the explicit client interface in QR_ORDERING.md, including envelopes, numeric KZT units and anonymous binding.
4. Pass tests/typecheck/lint and Nitro Cloudflare build; deploy Hostess with both origins and the shared key.
5. Confirm hostess.online serves this Worker. Download/print the actual 17 QR panels from Command Center; Hostess does not create a second token set.
6. Run real smoke tests before venue operation.

## Real smoke tests

- Directly open all 17 server-issued URLs on mobile; verify resource IDs/codes 01–17. Refresh 03 then open 04 on one device; its cart/receipt must not inherit 03.
- Disable/rotate a designated test QR and check old links are rejected.
- Compare menu and disabled products with the published XOXO snapshot. A stale/ended round or network loss must block checkout.
- Submit an anonymous test order. Verify the same backend order ID, table, quantities, historical prices and amount due in Command Center's waiter view and PostgreSQL. Reload the receipt in its browser; another anonymous browser must not gain access.
- Bootstrap a provisional test guest, place an order and verify its wallet/earn ledger/14-day lot. Confirm WhatsApp ownership using the existing claim mechanism, never phone-only access.
- Verify 3 × 1590 = 4770 KZT, redeem 1000, payable 3770, server cashback 113. Check zero balance and fully bonus-funded order (zero new cashback).
- Interrupt a response after server acceptance, retry the same key and verify one order and one ledger mutation. Expired quotes must require a new review.
- Log out and log in as another guest; old personal history/wallet must disappear. Check existing /xoxo, reservations and /guest.
- Confirm no service credential in browser source/network. Verify API/QR no-store and no-referrer and wording “К оплате официанту”, never bank-confirmed payment.

Use designated test guests and coordinate cleanup with staff; do not run destructive production DB tests.

## Failure handling

The BFF allowlists routes/methods, requires same-origin JSON writes, caps bodies at 32 KiB, rejects upstream redirects/HTML and has a 10-second upstream timeout. Missing key/origin returns 503. Optional x-hostess-upstream-error reports timeout/TLS/DNS/network categories without raw credentials.

QR 404/410: ask staff to check validity. Profile/wallet 401: anonymous UI. Invalid response: compare schema and monetary units; do not fill fake defaults. REQUOTE/QUOTE_EXPIRED/balance change: invalidate proposal and require review. Timeout/503 on order creation: preserve quote/key and safely check the same attempt.

## Evidence boundary

Automated CI uses isolated API fixtures. No successful live Railway order, persisted 17-QR smoke run or Cloudflare deployment is asserted by this source change. The previous local browser failed to start and direct network probes were restricted. Record deployed SHA and real smoke evidence separately after backend rollout.
