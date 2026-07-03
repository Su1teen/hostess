import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  ChevronUp,
  X,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  ASTANA,
  MAPBOX_TOKEN,
  restaurants,
  venues,
  friends,
  categories,
  type Restaurant,
} from "@/data/hostess";
import { geocode, type GeoResult } from "@/lib/geo";

mapboxgl.accessToken = MAPBOX_TOKEN;

const filters = ["Рядом", "Ужин", "Завтрак", "Терраса", "Wine bar", "Азия", "Стейк"];

// Цвет пина по категории (для некаталоговых заведений).
const catColor: Record<string, string> = {
  food: "#F97316",
  beauty: "#EC4899",
  medicine: "#0EA5E9",
  auto: "#22C55E",
  concerts: "#A855F7",
};

const friendLocations = [
  { friend: friends[0], coords: { lng: 71.4225, lat: 51.129 } },
  { friend: friends[1], coords: { lng: 71.428, lat: 51.1285 } },
  { friend: friends[2], coords: { lng: 71.408, lat: 51.1325 } },
  { friend: friends[3], coords: { lng: 71.44, lat: 51.1555 } },
];

export function MapScreen({
  onOpenRestaurant,
  onExpandToCatalog,
}: {
  onOpenRestaurant: (r: Restaurant) => void;
  onExpandToCatalog: () => void;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const controls = useAnimation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Дебаунс-поиск через Positionstack (с локальным фолбэком).
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await geocode(q, ctrl.signal);
        setResults(r);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  // Инициализация карты.
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapNode.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [ASTANA.lng, ASTANA.lat],
      zoom: 12.2,
      attributionControl: false,
      pitch: 30,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.resize();
      setTimeout(() => map.resize(), 300);

      // Рестораны — оранжевые пины.
      restaurants.forEach((r) => {
        const el = document.createElement("button");
        el.className =
          "flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-semibold text-neutral-900 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.25)] ring-1 ring-black/5 hover:scale-105 transition";
        el.innerHTML = `<span class="h-1.5 w-1.5 rounded-full" style="background:${catColor.food}"></span>${r.name} · ${r.rating}`;
        el.onclick = () => onOpenRestaurant(r);
        const m = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([r.coords.lng, r.coords.lat])
          .addTo(map);
        markersRef.current.push(m);
      });

      // Другие заведения — цветные пины по категории.
      venues.forEach((v) => {
        const color = catColor[v.category] ?? "#64748B";
        const el = document.createElement("div");
        el.className =
          "flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-neutral-900 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.22)] ring-1 ring-black/5 hover:scale-105 transition";
        el.innerHTML = `<span class="h-2 w-2 rounded-full" style="background:${color}"></span>${v.name}`;
        const m = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([v.coords.lng, v.coords.lat])
          .addTo(map);
        markersRef.current.push(m);
      });

      // Аватарки друзей.
      friendLocations.forEach(({ friend, coords }) => {
        const el = document.createElement("div");
        el.className = "friend-marker";
        el.innerHTML = `
          <div style="position:relative;width:40px;height:40px;">
            <div style="position:absolute;inset:-2px;border-radius:50%;background:linear-gradient(135deg,#F97316,#EC4899);animation:pulse-ring 2s ease-out infinite;"></div>
            <img src="${friend.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid white;position:relative;box-shadow:0 4px 12px rgba(0,0,0,0.2);" />
            <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:white;font-size:9px;font-weight:600;padding:1px 6px;border-radius:8px;white-space:nowrap;">${friend.name}</div>
          </div>
        `;
        const m = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);
        markersRef.current.push(m);
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [onOpenRestaurant]);

  // Перелёт к выбранному результату поиска.
  const flyTo = (r: GeoResult) => {
    setQuery(r.label);
    setShowResults(false);
    mapRef.current?.flyTo({
      center: [r.lng, r.lat],
      zoom: 14.5,
      speed: 1.4,
      curve: 1.6,
    });
    // Если это ресторан — открываем карточку.
    if (r.kind === "restaurant") {
      const rest = restaurants.find((x) => x.id === r.id);
      if (rest) setTimeout(() => onOpenRestaurant(rest), 700);
    }
  };

  // Expanding the sheet (swipe/click up) fluidly hands off to the Catalog.
  const expand = () => {
    controls
      .start({
        y: -600,
        transition: { type: "spring", stiffness: 320, damping: 34 },
      })
      .then(() => onExpandToCatalog());
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -70 || info.velocity.y < -500) {
      expand();
    } else {
      controls.start({ y: 0, transition: { type: "spring", stiffness: 320, damping: 34 } });
    }
  };

  return (
    <div className="relative h-full w-full bg-neutral-100">
      <div ref={mapNode} className="absolute inset-0" />

      {/* Top overlay: локация + поиск */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-4 pt-14">
        <div className="pointer-events-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">Ваша локация</p>
            <p className="text-lg font-semibold text-neutral-900">Астана · Есиль</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
            alt=""
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-md"
          />
        </div>

        {/* Живой поиск */}
        <div className="pointer-events-auto relative">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-float">
            <Search className="h-5 w-5 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Найти место, ресторан, блюдо…"
              className="flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
            />
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : query ? (
              <button onClick={() => setQuery("")} aria-label="Очистить">
                <X className="h-4 w-4 text-neutral-400" />
              </button>
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-100">
                <SlidersHorizontal className="h-4 w-4 text-neutral-700" />
              </span>
            )}
          </div>

          <AnimatePresence>
            {showResults && (query || loading) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute inset-x-0 top-full mt-2 max-h-80 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-float"
              >
                {loading && results.length === 0 && (
                  <div className="flex items-center gap-3 p-3 text-sm text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Ищем через Positionstack…
                  </div>
                )}
                {!loading && results.length === 0 && (
                  <div className="p-3 text-sm text-neutral-500">Ничего не найдено</div>
                )}
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => flyTo(r)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-neutral-50"
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: `${catColor[r.kind === "restaurant" ? "food" : r.kind === "venue" ? "beauty" : "concerts"]}1A`,
                      }}
                    >
                      <MapPin
                        className="h-4 w-4"
                        style={{
                          color:
                            catColor[
                              r.kind === "restaurant"
                                ? "food"
                                : r.kind === "venue"
                                  ? "beauty"
                                  : "concerts"
                            ],
                        }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">{r.label}</p>
                      <p className="truncate text-xs text-neutral-500">{r.sublabel}</p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                      {r.kind === "restaurant"
                        ? "Ресторан"
                        : r.kind === "venue"
                          ? "Заведение"
                          : "Место"}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Легенда категорий */}
      <div className="pointer-events-none absolute left-4 top-44 z-10 flex flex-col gap-1.5">
        {categories
          .filter((c) => c.key !== "concerts")
          .map((c) => (
            <div
              key={c.key}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-neutral-700 shadow-soft backdrop-blur"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: catColor[c.key] ?? "#64748B" }}
              />
              {c.label}
            </div>
          ))}
      </div>

      {/* Bottom sheet — swipe or tap up to open the Catalog */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.4, bottom: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ y: 0 }}
        className="absolute inset-x-0 bottom-0 z-20 rounded-t-[28px] bg-white shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.25)]"
      >
        <button
          onClick={expand}
          className="flex w-full flex-col items-center gap-1 pt-2.5"
          aria-label="Открыть каталог"
        >
          <div className="h-1.5 w-10 rounded-full bg-neutral-300" />
          <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
        </button>

        <div className="px-4 pb-3 pt-1">
          <div className="no-scrollbar mt-1 flex gap-2 overflow-x-auto">
            {filters.map((f, i) => (
              <button
                key={f}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium ${
                  i === 0 ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-32">
          <div className="flex items-center justify-between px-4 pb-2">
            <h3 className="text-[15px] font-semibold text-neutral-900">Рядом с вами</h3>
            <span className="text-xs text-neutral-500">{restaurants.length} мест</span>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-4">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpenRestaurant(r)}
                className="group w-[260px] shrink-0 overflow-hidden rounded-3xl bg-white text-left hairline"
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src={r.cover}
                    alt={r.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    <Star className="h-3 w-3 fill-white" /> {r.rating}
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-neutral-900 backdrop-blur">
                    {r.distanceKm} км
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[15px] font-semibold text-neutral-900">{r.name}</p>
                  <p className="text-xs text-neutral-500">
                    {r.cuisine} · {r.district}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-600">
                    <Clock className="h-3 w-3" />
                    Свободно сегодня
                    <span className="ml-auto font-semibold text-primary">
                      от {(r.avgCheck / 1000).toFixed(0)}k ₸
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
