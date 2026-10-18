import { z } from "zod";
import { restaurants, venues, mapPoints } from "@/data/hostess";

export const occupancySignalSchema = z.object({
  venueId: z.string(),
  valuePercent: z.number().min(0).max(100).nullable().optional(),
  level: z.enum(["low", "medium", "high", "unknown"]),
  source: z.enum(["staff_confirmed", "unavailable", "catalog"]),
  updatedAt: z.string().datetime().nullable(),
  staleAfter: z.number().positive(),
  capacity: z.number().int().nonnegative().optional(),
  occupiedUnits: z.number().int().nonnegative().optional(),
});
export const occupancyResponseSchema = z.object({
  signals: z.array(occupancySignalSchema),
  updatedAt: z.string().datetime(),
});
export type OccupancySignal = z.infer<typeof occupancySignalSchema>;
export type OccupancySignals = Readonly<Record<string, OccupancySignal>>;
/** Catalogue atmosphere is separate from the connected XOXO operational feed. */
export function catalogOccupancy(id: string): OccupancySignal | undefined {
  if (id === "xoxo" || !mapPoints.some((point) => point.id === id)) return undefined;
  const venue = restaurants.find((item) => item.id === id) ?? venues.find((item) => item.id === id);
  const hash = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const value = venue?.occupancy ?? 35 + (hash % 58);
  return {
    venueId: id,
    valuePercent: value,
    level: value >= 80 ? "high" : value >= 55 ? "medium" : "low",
    source: "catalog",
    updatedAt: null,
    staleAfter: 90,
  };
}
export const CATALOG_OCCUPANCY: OccupancySignals = Object.fromEntries(
  mapPoints.flatMap((point) => {
    const signal = catalogOccupancy(point.id);
    return signal ? [[point.id, signal]] : [];
  }),
);
export const EMPTY_OCCUPANCY: OccupancySignals = {};

/** Operational table occupancy is not a forecast, people count or booking availability. */
export function isFreshOccupancy(signal: OccupancySignal | undefined, now = Date.now()): boolean {
  if (
    !signal ||
    signal.source !== "staff_confirmed" ||
    signal.valuePercent == null ||
    !signal.updatedAt
  )
    return false;
  const age = now - Date.parse(signal.updatedAt);
  return Number.isFinite(age) && age >= -30_000 && age <= signal.staleAfter * 1_000;
}

export function occupancyColor(signal?: OccupancySignal, now = Date.now()): string {
  if (signal?.source !== "catalog" && !isFreshOccupancy(signal, now)) return "#a9aca9";
  const value = signal!.valuePercent!;
  return value >= 80 ? "#dc6258" : value >= 55 ? "#d8a32e" : "#39876b";
}
