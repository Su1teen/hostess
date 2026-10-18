import { CarFront, HeartPulse, Mic2, Scissors, Utensils, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import {
  carWashById,
  cityEvents,
  distanceKm,
  mapPoints,
  money,
  restaurants,
  venues,
  type MapPoint,
  type Restaurant,
  type WashAvailability,
} from "@/data/hostess";
import { occupancyLevel } from "./system";
import {
  catalogOccupancy,
  isFreshOccupancy,
  type OccupancySignal,
  type OccupancySignals,
} from "@/lib/occupancy";

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

/** Static catalogue values are not operational observations. -1 means unknown. */
export type OccupancySource = "verified" | "catalog" | "unknown" | "stale";
export type LiveSignal = {
  occupancy: number;
  source: OccupancySource;
  updatedMin: number | null;
  capacity?: WashAvailability;
  observation?: OccupancySignal;
};
export function liveSignal(
  _id: string,
  now = Date.now(),
  observation?: OccupancySignal,
): LiveSignal {
  if (isFreshOccupancy(observation, now))
    return {
      occupancy: observation!.valuePercent!,
      source: "verified",
      updatedMin: Math.max(0, Math.floor((now - Date.parse(observation!.updatedAt!)) / 60_000)),
      observation,
    };
  const catalogue = catalogOccupancy(_id);
  if (catalogue)
    return {
      occupancy: catalogue.valuePercent!,
      source: "catalog",
      updatedMin: null,
      observation: catalogue,
    };
  return {
    occupancy: -1,
    source:
      observation?.updatedAt && observation.source === "staff_confirmed" ? "stale" : "unknown",
    updatedMin: null,
    observation,
  };
}
export const occupancyOf = (id: string) => liveSignal(id).occupancy;
export function statusText(signal: LiveSignal): string {
  if (signal.source === "stale") return "Данные требуют обновления";
  if (signal.source === "catalog") return occupancyLevel(signal.occupancy).label;
  if (signal.source !== "verified") return "Загрузка пока неизвестна";
  return `${occupancyLevel(signal.occupancy).label} · по столам`;
}
export function freshness(signal: LiveSignal): string {
  if (signal.source === "stale") return "Последнее обновление устарело";
  if (signal.source === "catalog") return "Атмосфера зала · выбирайте место по настроению";
  if (signal.source !== "verified") return "Заведение пока не передаёт подтверждённые данные";
  return !signal.updatedMin
    ? "Подтверждено персоналом · только что"
    : `Подтверждено персоналом · ${signal.updatedMin} мин назад`;
}

/* ── Table availability (one grid for map chips and the venue sheet) ── */

export const TABLE_TIMES = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

export type TableSlot = { time: string; taken: boolean };

/** Occupancy cannot prove a future free slot; only a booking service may provide one. */
export function tableSlots(_id: string, _occupancy: number, _dayIdx = 0): TableSlot[] {
  return [];
}

/** Next free table times for today — same grid the venue sheet renders. */
export function slotsFor(_id: string, _occupancy: number, _count = 3): string[] {
  return [];
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
export function nearbyItem(
  p: MapPoint,
  now = Date.now(),
  observation?: OccupancySignal,
): NearbyItem {
  const r = restaurants.find((x) => x.id === p.id);
  const v = venues.find((x) => x.id === p.id);
  const e = cityEvents.find((x) => x.id === p.id);
  const w = carWashById(p.id);
  const signal = liveSignal(p.id, now, observation);
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

export const nearbyFor = (
  categories: readonly string[],
  now = Date.now(),
  signals: OccupancySignals = {},
) =>
  mapPoints
    .filter((p) => categories.includes(p.category))
    .map((p) => nearbyItem(p, now, signals[p.id]))
    .sort((a, b) => a.distanceKm - b.distanceKm);
