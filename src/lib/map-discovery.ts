import type { MapPoint } from "@/data/hostess";

export const DISCOVERY_SOURCE = "hostess-discovery";
export function markerSize(zoom: number, priority = 0): number {
  return Math.max(40, Math.min(94, 40 + (zoom - 11) * 7 + Math.min(6, priority * 2)));
}
export function discoveryPriority(point: MapPoint): number {
  return (
    (point.discovery?.connected ? 4 : 0) +
    (point.discovery?.featured ? 2 : 0) +
    (point.cover ? 1 : 0)
  );
}
export function discoveryFeatures(points: readonly MapPoint[], categories: readonly string[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.flatMap((point, index) => {
      if (
        !categories.includes(point.category) ||
        !Number.isFinite(point.coords.lng) ||
        !Number.isFinite(point.coords.lat)
      )
        return [];
      return [
        {
          type: "Feature" as const,
          id: point.id,
          properties: {
            venueId: point.id,
            representative: discoveryPriority(point) * 100_000 + index,
          },
          geometry: { type: "Point" as const, coordinates: [point.coords.lng, point.coords.lat] },
        },
      ];
    }),
  };
}
