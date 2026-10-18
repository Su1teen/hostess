import { restaurants, venues, ASTANA, MAPBOX_TOKEN } from "@/data/hostess";

export type GeoResult = {
  id: string;
  label: string;
  sublabel: string;
  lng: number;
  lat: number;
  kind: "place" | "venue" | "restaurant";
};
const localIndex: GeoResult[] = [
  ...restaurants.map((r) => ({
    id: r.id,
    label: r.name,
    sublabel: `${r.cuisine} · ${r.district}`,
    lng: r.coords.lng,
    lat: r.coords.lat,
    kind: "restaurant" as const,
  })),
  ...venues.map((v) => ({
    id: v.id,
    label: v.name,
    sublabel: v.kind,
    lng: v.coords.lng,
    lat: v.coords.lat,
    kind: "venue" as const,
  })),
  {
    id: "bayterek",
    label: "Байтерек",
    sublabel: "Достопримечательность",
    lng: 71.4306,
    lat: 51.1283,
    kind: "place",
  },
  {
    id: "khan-shatyr",
    label: "Хан Шатыр",
    sublabel: "Торговый центр",
    lng: 71.4034,
    lat: 51.1325,
    kind: "place",
  },
  {
    id: "expo",
    label: "EXPO Нур Алем",
    sublabel: "Музей будущего",
    lng: 71.4165,
    lat: 51.0894,
    kind: "place",
  },
  {
    id: "botanical",
    label: "Ботанический сад",
    sublabel: "Парк · Есиль",
    lng: 71.4162,
    lat: 51.1063,
    kind: "place",
  },
];
export function searchLocal(query: string): GeoResult[] {
  const q = query.trim().toLocaleLowerCase("ru");
  return q
    ? localIndex.filter((item) =>
        `${item.label} ${item.sublabel}`.toLocaleLowerCase("ru").includes(q),
      )
    : [];
}
export async function geocode(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const local = searchLocal(query);
  if (query.trim().length < 3) return local;
  try {
    const params = new URLSearchParams({
      q: `${query.trim()}, Астана`,
      country: "kz",
      language: "ru",
      limit: "5",
      proximity: `${ASTANA.lng},${ASTANA.lat}`,
      bbox: "71.1,50.9,71.8,51.4",
      access_token: MAPBOX_TOKEN,
    });
    const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, {
      signal,
    });
    if (!response.ok) return local;
    const data = (await response.json()) as {
      features?: {
        id?: string;
        geometry?: { coordinates?: number[] };
        properties?: { mapbox_id?: string; name?: string; place_formatted?: string };
      }[];
    };
    const remote = (data.features ?? []).flatMap((feature): GeoResult[] => {
      const [lng, lat] = feature.geometry?.coordinates ?? [];
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || !feature.properties?.name) return [];
      return [
        {
          id: feature.properties.mapbox_id ?? feature.id ?? `${lng}:${lat}`,
          label: feature.properties.name,
          sublabel: feature.properties.place_formatted ?? "Астана",
          lng,
          lat,
          kind: "place",
        },
      ];
    });
    return [
      ...local,
      ...remote.filter((item) => !local.some((match) => match.label === item.label)),
    ];
  } catch {
    return local;
  }
}
export { ASTANA };
