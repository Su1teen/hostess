import { restaurants, venues, ASTANA } from "@/data/hostess";

/**
 * Positionstack — геокодинг и поиск локаций.
 * Важно: Positionstack не предоставляет тайлы карт, поэтому рендер карты
 * остаётся на Mapbox, а этот сервис отвечает за forward-геокодинг поиска.
 * Free-план работает только по http, поэтому на https-деплое запрос
 * упадёт (mixed content) и мы мягко откатываемся на локальный поиск.
 */
const POSITIONSTACK_KEY = "a740bde5fa6ecc4acd087627b6a42a3f";

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
    id: "p1",
    label: "Байтерек",
    sublabel: "Достопримечательность",
    lng: 71.4306,
    lat: 51.1283,
    kind: "place",
  },
  {
    id: "p2",
    label: "Хан Шатыр",
    sublabel: "ТРЦ · Left Bank",
    lng: 71.4034,
    lat: 51.1325,
    kind: "place",
  },
  {
    id: "p3",
    label: "EXPO Нур Алем",
    sublabel: "Музей будущего",
    lng: 71.4165,
    lat: 51.0894,
    kind: "place",
  },
  {
    id: "p4",
    label: "Ботанический сад",
    sublabel: "Парк · Есиль",
    lng: 71.4162,
    lat: 51.1063,
    kind: "place",
  },
  {
    id: "p5",
    label: "Триатлон-парк",
    sublabel: "Парк · Набережная",
    lng: 71.4573,
    lat: 51.1417,
    kind: "place",
  },
];

export function searchLocal(query: string): GeoResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return localIndex.filter(
    (i) => i.label.toLowerCase().includes(q) || i.sublabel.toLowerCase().includes(q),
  );
}

type PositionstackHit = {
  latitude: number;
  longitude: number;
  name: string;
  label: string;
  locality?: string;
  region?: string;
};

export async function geocode(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const local = searchLocal(query);
  // На https positionstack (free) недоступен — сразу локальный поиск.
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return local;
  }
  try {
    const url =
      `http://api.positionstack.com/v1/forward?access_key=${POSITIONSTACK_KEY}` +
      `&query=${encodeURIComponent(`${query}, Астана`)}&country=KZ&limit=5`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`positionstack ${res.status}`);
    const json = (await res.json()) as { data?: PositionstackHit[] };
    const remote: GeoResult[] = (json.data ?? [])
      .filter((h) => h.latitude && h.longitude)
      .map((h, i) => ({
        id: `ps-${i}`,
        label: h.name || h.label,
        sublabel: h.locality || h.region || "Астана",
        lng: h.longitude,
        lat: h.latitude,
        kind: "place" as const,
      }));
    // Локальные совпадения (рестораны/заведения) показываем первыми.
    return [...local, ...remote.filter((r) => !local.some((l) => l.label === r.label))];
  } catch {
    return local;
  }
}

export { ASTANA };
