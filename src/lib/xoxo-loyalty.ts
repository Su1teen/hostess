export type XoxoOrder = {
  id: string;
  date: string;
  kind: "Предзаказ" | "Покупка";
  items: { name: string; quantity: number; price: number }[];
  total: number;
  cashback: number;
};

export type XoxoVisit = {
  id: string;
  date: string;
  guests: number;
  time: string;
};

type XoxoAccount = { orders: XoxoOrder[]; visits: XoxoVisit[] };
const STORAGE_KEY = "hostess:xoxo:sultan:v1";
const seed: XoxoAccount = {
  orders: [
    { id: "demo-1", date: "2026-09-14T20:30:00", kind: "Покупка", items: [{ name: "Mojito", quantity: 2, price: 2800 }, { name: "Солёный арахис", quantity: 1, price: 1500 }], total: 7100, cashback: 355 },
    { id: "demo-2", date: "2026-08-30T19:00:00", kind: "Предзаказ", items: [{ name: "Long Island", quantity: 1, price: 3500 }], total: 3500, cashback: 175 },
  ],
  visits: [
    { id: "visit-1", date: "2026-09-14T20:30:00", guests: 3, time: "20:30" },
    { id: "visit-2", date: "2026-08-30T19:00:00", guests: 2, time: "19:00" },
  ],
};

export function readXoxoAccount(): XoxoAccount {
  if (typeof window === "undefined") return seed;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return seed;
    const data: unknown = JSON.parse(saved);
    if (data && typeof data === "object" && "orders" in data && "visits" in data && Array.isArray(data.orders) && Array.isArray(data.visits)) return data as XoxoAccount;
  } catch { /* Storage may be unavailable in private mode. */ }
  return seed;
}

function save(account: XoxoAccount): XoxoAccount {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account)); } catch { /* Keep the current session usable. */ }
  return account;
}

export function addXoxoOrder(kind: XoxoOrder["kind"], items: XoxoOrder["items"]): XoxoAccount {
  const account = readXoxoAccount();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!items.length || total <= 0) return account;
  const order: XoxoOrder = { id: crypto.randomUUID(), date: new Date().toISOString(), kind, items, total, cashback: Math.round(total * 0.05) };
  return save({ ...account, orders: [order, ...account.orders] });
}

export function addXoxoVisit(guests: number, time: string): XoxoAccount {
  const account = readXoxoAccount();
  return save({ ...account, visits: [{ id: crypto.randomUUID(), date: new Date().toISOString(), guests, time }, ...account.visits] });
}

export function xoxoCashback(account: XoxoAccount): number {
  return account.orders.reduce((sum, order) => sum + order.cashback, 0);
}
