import { describe, expect, test } from "bun:test";
import { discoveryFeatures, discoveryPriority, markerSize } from "../src/lib/map-discovery";
import { isFreshOccupancy, occupancyColor, occupancyResponseSchema } from "../src/lib/occupancy";
import { liveSignal, freshness, tableSlots } from "../src/components/hostess/venue";
import type { MapPoint } from "../src/data/hostess";
import { restaurants } from "../src/data/hostess";
const now = Date.parse("2026-10-18T01:00:00Z");
const signal = {
  venueId: "xoxo",
  valuePercent: 35,
  level: "low" as const,
  source: "staff_confirmed" as const,
  updatedAt: new Date(now - 10_000).toISOString(),
  staleAfter: 90,
  capacity: 17,
  occupiedUnits: 6,
};
describe("trustworthy occupancy", () => {
  test("static restaurants and demo resources never become verified observations", () => {
    for (const id of ["xoxo", "sadu", "unknown", "wash1"]) {
      expect(liveSignal(id, now).source).toBe("unknown");
      expect(liveSignal(id, now).occupancy).toBe(-1);
    }
  });
  test("occupancy and a calendar day never fabricate bookable restaurant tables", () => {
    expect(tableSlots("sadu", 0, 0)).toEqual([]);
    expect(tableSlots("sadu", 95, 5)).toEqual([]);
  });
  test("fresh staff data expires and future timestamps are rejected", () => {
    expect(isFreshOccupancy(signal, now)).toBe(true);
    expect(liveSignal("xoxo", now, signal).occupancy).toBe(35);
    expect(isFreshOccupancy(signal, now + 100_000)).toBe(false);
    expect(liveSignal("xoxo", now + 100_000, signal).source).toBe("stale");
    expect(freshness(liveSignal("xoxo", now + 100_000, signal))).toContain("устарело");
    expect(
      isFreshOccupancy({ ...signal, updatedAt: new Date(now + 60_000).toISOString() }, now),
    ).toBe(false);
  });
  test("unknown is neutral and actual values drive thresholds", () => {
    expect(occupancyColor(undefined, now)).toBe("#a9aca9");
    expect(occupancyColor(signal, now)).toBe("#39876b");
    expect(occupancyColor({ ...signal, valuePercent: 60 }, now)).toBe("#d8a32e");
    expect(occupancyColor({ ...signal, valuePercent: 90 }, now)).toBe("#dc6258");
    expect(occupancyColor(signal, now + 100_000)).toBe("#a9aca9");
    expect(
      occupancyResponseSchema.safeParse({
        signals: [{ ...signal, valuePercent: 300 }],
        updatedAt: new Date(now).toISOString(),
      }).success,
    ).toBe(false);
  });
});
describe("map source and zoom", () => {
  test("connected XOXO pin matches its published street location", () => {
    expect(restaurants.find((venue) => venue.id === "xoxo")?.coords).toEqual({
      lng: 71.381633,
      lat: 51.134284,
    });
  });
  const points: MapPoint[] = Array.from({ length: 120 }, (_, i) => ({
    id: String(i),
    name: `Venue ${i}`,
    category: i % 2 ? "food" : "beauty",
    cover: "photo.jpg",
    rating: 0,
    coords: { lng: 71.4 + i / 10000, lat: 51.1 },
  }));
  test("all category matches remain in the spatial source beyond 24", () => {
    expect(discoveryFeatures(points, ["food"]).features).toHaveLength(60);
    expect(discoveryFeatures(points, ["food", "beauty"]).features).toHaveLength(120);
    expect(discoveryFeatures(points, []).features).toHaveLength(0);
    expect(
      new Set(discoveryFeatures(points, ["food", "beauty"]).features.map((f) => f.id)).size,
    ).toBe(120);
  });
  test("size progresses continuously and caps at a usable mobile size", () => {
    for (let z = 11; z < 18; z += 0.1)
      expect(Math.abs(markerSize(z + 0.1) - markerSize(z))).toBeLessThanOrEqual(0.71);
    expect(markerSize(17)).toBeGreaterThan(markerSize(13));
    expect(markerSize(25)).toBeLessThanOrEqual(94);
    expect(markerSize(2)).toBeGreaterThanOrEqual(40);
  });
  test("priority uses explicit integration metadata, not ratings", () => {
    expect(discoveryPriority({ ...points[0], rating: 5 })).toBe(
      discoveryPriority({ ...points[0], rating: 1 }),
    );
    expect(discoveryPriority({ ...points[0], discovery: { connected: true } })).toBeGreaterThan(
      discoveryPriority(points[0]),
    );
  });
});
