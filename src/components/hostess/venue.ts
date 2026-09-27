import { CarFront, HeartPulse, Mic2, Scissors, Utensils, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import {
  carWashById,
  cityEvents,
  mapPoints,
  money,
  occupancyForId,
  restaurants,
  venues,
  type MapPoint,
  type Restaurant,
} from "@/data/hostess";

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

const occupancyValue = { available: 38, moderate: 68, busy: 92 } as const;

/** Numeric live occupancy for any point on the map. */
export function occupancyOf(id: string): number {
  const r = restaurants.find((x) => x.id === id);
  if (r) return r.occupancy;
  const v = venues.find((x) => x.id === id);
  if (v) return v.occupancy;
  return occupancyValue[occupancyForId(id)];
}

const allSlots = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

/** Deterministic next available tables — stable between renders. */
export function slotsFor(id: string, occupancy: number, count = 3): string[] {
  if (occupancy >= 98) return [];
  const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const start = hash % 3;
  const step = occupancy >= 80 ? 2 : 1;
  const out: string[] = [];
  for (let i = start; out.length < count && i < allSlots.length; i += step) out.push(allSlots[i]);
  return out;
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
};

/** Unified, enriched list of everything on the map for the sheet / cards. */
export function nearbyItem(p: MapPoint): NearbyItem {
  const r = restaurants.find((x) => x.id === p.id);
  const v = venues.find((x) => x.id === p.id);
  const e = cityEvents.find((x) => x.id === p.id);
  const w = carWashById(p.id);
  const hash = [...p.id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const fallbackKm = Math.round(((hash % 40) / 10 + 0.6) * 10) / 10;
  if (r)
    return {
      id: p.id,
      name: r.name,
      category: "food",
      subtitle: `${r.cuisine} · ${r.district}`,
      cover: r.cover,
      rating: r.rating,
      occupancy: r.occupancy,
      distanceKm: r.distanceKm,
      price: `~${money(r.avgCheck)}`,
    };
  if (e)
    return {
      id: p.id,
      name: e.title,
      category: "concerts",
      subtitle: `${e.place} · ${e.date}, ${e.time}`,
      cover: e.cover,
      rating: p.rating,
      occupancy: occupancyOf(p.id),
      distanceKm: fallbackKm,
      price: e.price === 0 ? "Бесплатно" : `от ${money(e.price)}`,
    };
  if (w)
    return {
      id: p.id,
      name: w.name,
      category: "auto",
      subtitle: w.address,
      cover: w.cover,
      rating: w.rating,
      occupancy: occupancyOf(p.id),
      distanceKm: w.distanceKm,
      price: `от ${money(w.priceFrom)}`,
    };
  if (v)
    return {
      id: p.id,
      name: v.name,
      category: p.category,
      subtitle: v.kind,
      cover: v.cover,
      rating: v.rating,
      occupancy: v.occupancy,
      distanceKm: v.distanceKm,
      price: `от ${money(v.priceFrom)}`,
    };
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    subtitle: `${categoryMeta[p.category]?.label ?? "Место"} · Астана`,
    cover: p.cover,
    rating: p.rating,
    occupancy: occupancyOf(p.id),
    distanceKm: fallbackKm,
  };
}

export const nearbyFor = (categories: readonly string[]) =>
  mapPoints
    .filter((p) => categories.includes(p.category))
    .map(nearbyItem)
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
