# Guest ordering 4 — acceptance

Baseline: Hostess `6571e4052d308503c0620b55213ec699b4a8131b`; paired Command Center `cf7bb34187054dde66b36b7a4c26046135654d51`. Changes preserve TanStack Start, Cloudflare BFF and the canonical Command Center/PostgreSQL order/loyalty/outbox.

The XOXO ordering sheet offers explicit real table selection with zone/search, then anonymous ordering without QR, short code or registration. The existing short-code entry is an optional secondary path. Only the chosen public physical resource ID is remembered for the browser session. No permanent QR credential or private visit is returned by the table listing. A changed/closed visit requires a new quote, while a retry of a committed checkout returns the same receipt.

Booking selection accepts unknown capacity and retains known capacity/conflict rules. Future reservation preorders remain estimates; immediate dining checkout is separate. Registered ordering, authenticated wallet ownership, 3% cashback, 14-day expiry and existing receipt history remain on their existing server paths. Ordinary dish photos come only from their own imported source image; absent/broken photos use a neutral placeholder. Exchange images and prices are unchanged.

Validation:

- `npm test`: unit/schema/SSR suite, 85 tests.
- `npm run typecheck`, `npm run lint`, `npm run build`: required checks. Existing lint warnings are non-failing.
- `node tests/dine-in.browser.mjs`: Android Chromium fixture; repeat with `BROWSER_DEVICE=desktop`, then `BROWSER_ENGINE=webkit` for desktop/iOS WebKit. Covers all 17 QR contexts, loyalty/auth/error states, optional code and explicit web table selection. These are deliberately labelled fixture tests.
- Paired Command Center `npm run test:cross` with `HOSTESS_SOURCE_ROOT` and `XOXO_SOURCE_ROOT`: real Hostess UI/BFF HTTP → actual Command Center → isolated PostgreSQL → actual XOXO HTTP receiver. No page routing/fetch mocks in that browser flow. It verifies anonymous web checkout, persisted authoritative order, receipt status update after staff acceptance, complete 119-item ordinary menu price parity and idempotent demand/compensation.
- Staff actual browser covers 320/375/390/430/768/1024/1440 px plus mobile WebKit. Device emulation is not a claim of testing physical phones.

Production release must follow backend deployment/migrations before frontend deployment. Exact deployed SHAs, import result, immutable QR/zone fingerprint, photos and read-only smoke belong in the release evidence. Destructive guest/payment/loyalty flows are tested only in isolated databases.
