import { CarFront, HeartPulse, Mic2, Scissors, Utensils, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import {
  carWashById,
  cityEvents,
  distanceKm,
  mapPoints,
  money,
  occupancyForId,
  restaurants,
  venues,
  washAvailability,
  type MapPoint,
  type Restaurant,
  type WashAvailability,
} from "@/data/hostess";
import { occupancyLevel } from "./system";

/** Category metadata — icons only; colour lives in the shared neutral system. */
export const categoryMeta: Record<string, { label: string; Icon: ComponentType<LucideProps> }> = {
  food: { label: "Рестораны", Icon: Utensils },
  concerts: { label: "Афиша", Icon: Mic2 },
  beauty: { label: "Красота", Icon: Scissors },
  medicine: { label: "Здоровье", Icon: HeartPulse },
  auto: { label: "Авто", Icon: CarFront },
};

/** Curated editorial order for the signature stack. XOXO keeps its own place. */
const curated = ["sadu", "kinza", "xoxo", "auyl", "marrakesh", "line", "nedelka"];

export const curatedRestaurants = (): Restaurant[] =>
  [...restaurants].sort((a, b) => {
    const ia = curated.indexOf(a.id);
    const ib = curated.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

/* ──────────────────────────────────────────────────────────────────────
   Realtime selectors — the ONLY place occupancy / capacity is derived.
   Stacked cards, map markers, the selected map card, lists and venue
   detail all read from here, so they can never contradict each other.
   ────────────────────────────────────────────────────────────────────── */

const occupancyValue = { available: 38, moderate: 68, busy: 92 } as const;
/** FNV-1a — well-distributed, deterministic between renders. */
const hashOf = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/**
 * `verified` = reported by the venue (Hostess partner, POS/table system,
 * bay sensors). `estimated` = modelled from time of day & popularity —
 * the UI must never present it as exact live truth.
 */
export type OccupancySource = "verified" | "estimated";

export type LiveSignal = {
  occupancy: number;
  source: OccupancySource;
  /** Minutes since the last update (verified sources only). */
  updatedMin: number | null;
  /** Physical-resource capacity (car-wash bays). */
  capacity?: WashAvailability;
};

export function liveSignal(id: string, now = Date.now()): LiveSignal {
  const wash = carWashById(id);
  if (wash) {
    const capacity = washAvailability(wash, now);
    return { occupancy: capacity.occupancy, source: "verified", updatedMin: 0, capacity };
  }
  const r = restaurants.find((x) => x.id === id);
  if (r) return { occupancy: r.occupancy, source: "verified", updatedMin: r.live?.isLive ? 0 : (hashOf(id) % 4) + 1 };
  const v = venues.find((x) => x.id === id);
  if (v) return { occupancy: v.occupancy, source: "verified", updatedMin: (hashOf(id) % 6) + 1 };
  return { occupancy: occupancyValue[occupancyForId(id)], source: "estimated", updatedMin: null };
}

/** Numeric occupancy for any point. */
export const occupancyOf = (id: string) => liveSignal(id).occupancy;

/** One human status line for any signal (bays speak in bays, venues in load). */
export function statusText(signal: LiveSignal): string {
  const c = signal.capacity;
  if (c) return c.free > 0 ? `${c.free} из ${c.total} свободно` : `Все заняты · ≈${c.nextFreeMin} мин`;
  const { label } = occupancyLevel(signal.occupancy);
  return signal.source === "estimated" ? `${label} · оценка` : label;
}

/** Freshness caption: "Обновлено 2 мин назад" / "Оценка по времени суток". */
export function freshness(signal: LiveSignal): string {
  if (signal.source === "estimated") return "Оценка по времени суток";
  if (!signal.updatedMin) return "Обновлено только что";
  return `Обновлено ${signal.updatedMin} мин назад`;
}

/* ── Table availability (one grid for map chips and the venue sheet) ── */

export const TABLE_TIMES = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

export type TableSlot = { time: string; taken: boolean };

/** Deterministic table availability for a day (0 = today, driven by live load). */
export function tableSlots(id: string, occupancy: number, dayIdx = 0): TableSlot[] {
  const load = dayIdx === 0 ? occupancy : 30 + (hashOf(`${id}-${dayIdx}`) % 70);
  if (load >= 98) return TABLE_TIMES.map((time) => ({ time, taken: true }));
  return TABLE_TIMES.map((time) => ({
    time,
    taken: hashOf(`${id}${time}${dayIdx}`) % 100 < Math.max(0, load - 25),
  }));
}

/** Next free table times for today — same grid the venue sheet renders. */
export function slotsFor(id: string, occupancy: number, count = 3): string[] {
  return tableSlots(id, occupancy)
    .filter((s) => !s.taken)
    .slice(0, count)
    .map((s) => s.time);
}

export type NearbyItem = {
  id: string;
  name: string;
  category: MapPoint["category"];
  subtitle: string;
  cover: string;
  rating: number;
  occupancy: number;
  distanceKm: number;
  price?: string;
  signal: LiveSignal;
  status: string;
};

/** Unified, enriched list of everything on the map for the sheet / cards. */
export function nearbyItem(p: MapPoint, now = Date.now()): NearbyItem {
  const r = restaurants.find((x) => x.id === p.id);
  const v = venues.find((x) => x.id === p.id);
  const e = cityEvents.find((x) => x.id === p.id);
  const w = carWashById(p.id);
  const signal = liveSignal(p.id, now);
  const live = { signal, status: statusText(signal), occupancy: signal.occupancy };
  const fallbackKm = Math.max(0.1, distanceKm(p.coords));
  if (r)
    return {
      id: p.id,
      name: r.name,
      category: "food",
      subtitle: `${r.cuisine} · ${r.district}`,
      cover: r.cover,
      rating: r.rating,
      distanceKm: r.distanceKm,
      price: `~${money(r.avgCheck)}`,
      ...live,
    };
  if (e)
    return {
      id: p.id,
      name: e.title,
      category: "concerts",
      subtitle: `${e.place} · ${e.date}, ${e.time}`,
      cover: e.cover,
      rating: p.rating,
      distanceKm: fallbackKm,
      price: e.price === 0 ? "Бесплатно" : `от ${money(e.price)}`,
      ...live,
    };
  if (w)
    return {
      id: p.id,
      name: w.name,
      category: "auto",
      subtitle: w.address,
      cover: w.cover,
      rating: w.rating,
      distanceKm: w.distanceKm,
      price: `от ${money(w.priceFrom)}`,
      ...live,
    };
  if (v)
    return {
      id: p.id,
      name: v.name,
      category: p.category,
      subtitle: v.kind,
      cover: v.cover,
      rating: v.rating,
      distanceKm: v.distanceKm,
      price: `от ${money(v.priceFrom)}`,
      ...live,
    };
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    subtitle: p.kind ?? `${categoryMeta[p.category]?.label ?? "Место"} · Астана`,
    cover: p.cover,
    rating: p.rating,
    distanceKm: fallbackKm,
    ...live,
  };
}

export const nearbyFor = (categories: readonly string[], now = Date.now()) =>
  mapPoints
    .filter((p) => categories.includes(p.category))
    .map((p) => nearbyItem(p, now))
    .sort((a, b) => a.distanceKm - b.distanceKm);

/** Hourly load curve (12:00 → 02:00) shaped around the venue's peak window. */
export function hourlyLoad(peakHours: string, occupancy: number): number[] {
  const [from, to] = peakHours.split("–").map((s) => parseInt(s.trim().slice(0, 2), 10));
  const hours = Array.from({ length: 15 }, (_, i) => (12 + i) % 24);
  return hours.map((h) => {
    const hh = h < 6 ? h + 24 : h;
    const f = from < 6 ? from + 24 : from;
    const t = to < 6 ? to + 24 : to;
    const mid = (f + t) / 2;
    const width = Math.max(2, (t - f) / 2 + 1.5);
    const curve = Math.exp(-((hh - mid) ** 2) / (2 * width * width));
    return Math.round(Math.max(8, Math.min(100, curve * Math.max(occupancy, 60) + 10)));
  });
}
