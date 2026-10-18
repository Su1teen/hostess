import { z } from "zod";
import { guestApi, GuestApiError } from "./guest-api";
import { safeImageSource } from "./product-images";

const id = z.string().min(1).max(200);
const amount = z.number().finite().nonnegative();
const date = z.string().datetime({ offset: true });
const imageSource = z
  .string()
  .max(2000)
  .refine((value) => Boolean(safeImageSource(value)));
export const tableSchema = z.object({
  venue: z.object({ id, slug: z.string(), name: z.string(), currency: z.literal("KZT") }),
  table: z.object({
    resourceId: id,
    code: z.string(),
    name: z.string(),
    zoneName: z.string().nullable().optional(),
  }),
});
export const menuSchema = z.object({
  generatedAt: date,
  status: z.enum(["ok", "no_published_round"]),
  currentRound: z.object({ id, endsAt: date }).nullable(),
  products: z.array(
    z.object({
      id,
      name: z.string(),
      price: amount,
      originalPrice: amount.optional(),
      previousPrice: amount.nullable().optional(),
      minPrice: amount.optional(),
      volumeMl: z.number().positive().nullable().optional(),
      changePercent: z.number().finite().optional(),
      isAvailable: z.boolean(),
      category: z.string().nullable().optional(),
      imageUrl: imageSource.nullable().optional(),
    }),
  ),
});
export const regularMenuSchema = z.object({
  venueCode: z.string(),
  currency: z.literal("KZT"),
  updatedAt: date.nullable(),
  items: z.array(
    z.object({
      id,
      name: z.string(),
      description: z.string(),
      category: z.string(),
      imageUrl: imageSource.nullable(),
      portion: z.string(),
      allergens: z.array(z.string()),
      price: amount,
      priceMinor: z.string(),
      isAvailable: z.boolean(),
      version: z.number().int().positive(),
    }),
  ),
});
export const lineSchema = z.object({
  productId: id,
  productName: z.string(),
  quantity: z.number().int().min(1).max(20),
  unitPrice: amount,
  total: amount,
  itemType: z.enum(["EXCHANGE", "REGULAR_MENU"]).optional(),
  menuVersion: z.number().int().nullable().optional(),
});
export const totalsSchema = z.object({
  subtotal: amount,
  discount: amount,
  payable: amount,
  cashback: amount,
});
export const quoteSchema = totalsSchema.extend({
  id,
  expiresAt: date,
  roundId: id.nullable(),
  lines: z.array(lineSchema).min(1),
  // An opaque anonymous binding, when required by Command Center. Never a guest ID.
  checkoutToken: z.string().optional(),
});
export const orderSchema = totalsSchema.extend({
  id,
  orderNumber: z.union([z.string(), z.number()]),
  createdAt: date,
  venueCode: z.string(),
  tableCode: z.string(),
  status: z.string(),
  paymentStatus: z.literal("assumed_paid"),
  lines: z.array(lineSchema).min(1),
  cashbackExpiresAt: date.nullable().optional(),
  receiptToken: z.string().optional(),
});
export const walletSchema = z.object({
  balance: amount,
  expiringAmount: amount,
  nextExpiresAt: date.nullable(),
  lots: z.array(z.object({ id, remaining: amount, expiresAt: date })),
});
export const transactionSchema = z.object({
  id,
  type: z.enum(["earn", "redeem", "expire", "reversal", "adjustment"]),
  amount: z.number().finite(),
  createdAt: date,
  expiresAt: date.nullable().optional(),
  orderId: z.string().nullable().optional(),
});
export const profileSchema = z.object({
  guest: z.object({
    id,
    name: z.string(),
    provisional: z.boolean(),
    phone: z.string().nullable().optional(),
  }),
});
export type DiningTable = z.infer<typeof tableSchema>;
export type DiningMenu = z.infer<typeof menuSchema>;
export type RegularMenu = z.infer<typeof regularMenuSchema>;
export type DiningQuote = z.infer<typeof quoteSchema>;
export type DiningOrder = z.infer<typeof orderSchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type DiningProfile = z.infer<typeof profileSchema>;
export type LoyaltyTransaction = z.infer<typeof transactionSchema>;
export type Cart = Record<string, number>;

async function read<S extends z.ZodTypeAny>(
  schema: S,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
  headers?: HeadersInit,
): Promise<z.infer<S>> {
  const result = schema.safeParse(
    await guestApi<unknown>(path, body, body === undefined ? "GET" : "POST", signal, headers),
  );
  if (!result.success)
    throw new GuestApiError(
      502,
      "INVALID_RESPONSE",
      "Сервис вернул неполный ответ. Попробуйте позже.",
    );
  return result.data;
}
export const diningApi = {
  table: (token: string, signal?: AbortSignal) =>
    read(tableSchema, `/dine-in/tables/${encodeURIComponent(token)}`, undefined, signal),
  menu: (venue: string, signal?: AbortSignal) =>
    read(menuSchema, `/dine-in/menu?venue=${encodeURIComponent(venue)}`, undefined, signal),
  regularMenu: (venue: string, signal?: AbortSignal) =>
    read(
      regularMenuSchema,
      `/dine-in/regular-menu?venue=${encodeURIComponent(venue)}`,
      undefined,
      signal,
    ),
  profile: () => read(profileSchema, "/profile"),
  wallet: () => read(walletSchema, "/loyalty/wallet?venue=xoxo"),
  transactions: (cursor?: string) =>
    read(
      z.object({
        transactions: z.array(transactionSchema),
        nextCursor: z.string().nullable().optional(),
      }),
      `/loyalty/transactions?venue=xoxo${cursor ? `&before=${encodeURIComponent(cursor)}` : ""}`,
    ),
  orders: (cursor?: string) =>
    read(
      z.object({ orders: z.array(orderSchema), nextCursor: z.string().nullable().optional() }),
      `/dine-in/orders${cursor ? `?before=${encodeURIComponent(cursor)}` : ""}`,
    ),
  quote: (qrToken: string, cart: Cart, redeemAmount: number) =>
    read(quoteSchema, "/dine-in/quotes", {
      qrToken,
      items: cartItems(cart),
      redeemAmount,
    }),
  order: (quote: DiningQuote, idempotencyKey: string) =>
    read(z.object({ order: orderSchema }), "/dine-in/orders", {
      quoteId: quote.id,
      idempotencyKey,
      ...(quote.checkoutToken ? { checkoutToken: quote.checkoutToken } : {}),
    }),
  receipt: (orderId: string, receiptToken?: string) =>
    read(
      z.object({ order: orderSchema }),
      `/dine-in/orders/${encodeURIComponent(orderId)}`,
      undefined,
      undefined,
      receiptToken ? { "x-hostess-receipt-token": receiptToken } : undefined,
    ),
};
export function matchesTable(context: DiningTable, venue: string, table: string) {
  return (
    context.venue.slug === venue && context.table.code === table && /^0[1-9]$|^1[0-7]$/.test(table)
  );
}
export function menuFresh(menu: DiningMenu | null, now = Date.now()) {
  return Boolean(
    menu &&
    menu.status === "ok" &&
    menu.currentRound &&
    Math.abs(now - Date.parse(menu.generatedAt)) < 60_000 &&
    Date.parse(menu.currentRound.endsAt) > now,
  );
}
export function quoteFresh(quote: DiningQuote | null, menu: DiningMenu | null, now = Date.now()) {
  return Boolean(
    quote &&
    Date.parse(quote.expiresAt) > now &&
    (quote.lines.every((line) => line.itemType === "REGULAR_MENU")
      ? quote.roundId === null
      : menuFresh(menu, now) && quote.roundId === menu?.currentRound?.id),
  );
}
// Exchange IDs retain their legacy representation; regular IDs are namespaced only locally.
export function cartKey(id: string, itemType?: "EXCHANGE" | "REGULAR_MENU") {
  return itemType === "REGULAR_MENU" ? `menu:${id}` : id;
}
export function cartItems(cart: Cart) {
  return Object.entries(cart).map(([key, quantity]) =>
    key.startsWith("menu:")
      ? { productId: key.slice(5), quantity, itemType: "REGULAR_MENU" as const }
      : { productId: key, quantity },
  );
}
export function cartCanQuote(
  cart: Cart,
  menu: DiningMenu | null,
  regular: RegularMenu | null,
  now = Date.now(),
) {
  return (
    Object.keys(cart).length > 0 &&
    Object.keys(cart).every((key) =>
      key.startsWith("menu:")
        ? regular?.items.some((p) => p.id === key.slice(5) && p.isAvailable)
        : menuFresh(menu, now) && menu?.products.some((p) => p.id === key && p.isAvailable),
    )
  );
}
export function changeQuantity(cart: Cart, productId: string, delta: number): Cart {
  const next = { ...cart },
    quantity = Math.min(20, Math.max(0, (cart[productId] ?? 0) + delta));
  if (quantity) next[productId] = quantity;
  else delete next[productId];
  return next;
}
export const kzt = (n: number) => `${n.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₸`;
export const needsRequote = (error: unknown) =>
  error instanceof GuestApiError &&
  [
    "REQUOTE",
    "QUOTE_EXPIRED",
    "PRODUCT_UNAVAILABLE",
    "BALANCE_CHANGED",
    "INSUFFICIENT_BALANCE",
    "GUEST_CHANGED",
    "OWNER_CHANGED",
    "SESSION_CHANGED",
  ].includes(error.code);
