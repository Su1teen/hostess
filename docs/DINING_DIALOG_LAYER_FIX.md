# Embedded dining dialogs — 2026-10-19

The website table picker opens DiningPage in the venue's animated full-screen sheet (z-index 160). Its cart, account and product dialogs were portalled into body at z-index 50. After the parent animation settled, the parent could paint above the dialog while Radix correctly disabled background pointer events. Guests saw the same screen and could not continue.

Raise the shared dialog overlay/content above application sheets (200/201). Keep the existing animation, ownership, quote, checkout and receipt contracts. No database migration or financial change is required.

Browser regression explicitly waits 750ms after opening each embedded dialog, then checks `document.elementFromPoint` to ensure the dialog actually receives input. Both anonymous and signed-in flows cover account refresh/close, basket, checkout, receipt and “Order again” from the main XOXO website, not only direct QR routes. The fixture now returns the selected table in its receipt rather than a hard-coded table 03.

The paired real HTTP/browser test submits one anonymous order and one order with an actual server guest session. It validates selected table resource, identity, amounts and appearance in staff orders and operations, then observes staff acceptance in the receipt. The staff browser separately opens a mixed web_app order, checks its website source and performs normal processing. All writes and compensation tests use isolated local PostgreSQL; production smoke opens cart/account without submitting a real order.
