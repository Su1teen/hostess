import { useQuery } from "@tanstack/react-query";
import { CATALOG_OCCUPANCY, occupancyResponseSchema, type OccupancySignals } from "@/lib/occupancy";

// A single cached, batched read is shared by the map, catalogue and venue sheets.
export function useOccupancy() {
  const query = useQuery({
    queryKey: ["venue-occupancy", "xoxo"],
    queryFn: async ({ signal }): Promise<OccupancySignals> => {
      const response = await fetch("/api/guest/v1/occupancy?venues=xoxo", {
        signal,
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Не удалось обновить загрузку");
      const data = occupancyResponseSchema.parse(await response.json());
      return Object.fromEntries(data.signals.map((item) => [item.venueId, item]));
    },
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: 1,
  });
  return { ...query, signals: { ...CATALOG_OCCUPANCY, ...query.data } };
}
