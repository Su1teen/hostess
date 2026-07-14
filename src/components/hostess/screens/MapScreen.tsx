import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence, useDragControls, type PanInfo } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  X,
  Loader2,
  MapPin,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  ASTANA,
  MAPBOX_TOKEN,
  restaurants,
  venues,
  mapPoints,
  friendMapLocations,
  categories,
  occupancyForId,
  carWashById,
  carWashes,
  type Restaurant,
  type Venue,
  type CityEvent,
  type CarWash,
  type MapPoint,
} from "@/data/hostess";
import { geocode, type GeoResult } from "@/lib/geo";
import { CarWashSheet } from "../CarWashSheet";
import { useTheme, categoryToTheme } from "@/components/hostess/ThemeProvider";
import { VenueBookingModal } from "@/components/hostess/VenueBookingModal";
import { EventTicketModal } from "@/components/hostess/EventTicketModal";
import { CatalogSections, CategoryRail } from "@/components/hostess/screens/CatalogScreen";

mapboxgl.accessToken = MAPBOX_TOKEN;

// Цвет пина по категории.
const catColor: Record<string, string> = {
  food: "#F97316",
  beauty: "#EC4899",
  medicine: "#0EA5E9",
  auto: "#22C55E",
  concerts: "#A855F7",
};

// ── Состояния шторки ──────────────────────────────────────────────
type SheetState = "collapsed" | "half" | "full";

export function MapScreen({
  onOpenRestaurant,
  sheetState = "collapsed",
  onSheetStateChange,
}: {
  onOpenRestaurant: (r: Restaurant) => void;
  sheetState?: SheetState;
  onSheetStateChange?: (s: SheetState) => void;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const friendMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const openPointRef = useRef<(p: MapPoint) => void>(() => {});
  const sheetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [containerH, setContainerH] = useState(800);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Внутреннее состояние шторки (может управляться извне через props).
  const [internalSheet, setInternalSheet] = useState<SheetState>(sheetState);
  const sheet = onSheetStateChange ? sheetState : internalSheet;
  const setSheet = (s: SheetState) => {
    if (onSheetStateChange) onSheetStateChange(s);
    else setInternalSheet(s);
  };

  // Каталог-стейт
  const [cat, setCat] = useState("food");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [event, setEvent] = useState<CityEvent | null>(null);
  const [carWash, setCarWash] = useState<CarWash | null>(null);

  // Открытие точки: ресторан → карточка, авто → экран автомойки.
  const openVenue = (v: Venue) => {
    const wash = carWashById(v.id);
    if (v.category === "auto" && wash) setCarWash(wash);
    else setVenue(v);
  };

  // Клик по пину на карте.
  const openPoint = (p: MapPoint) => {
    if (p.category === "food") {
      const rest = restaurants.find((r) => r.id === p.id);
      if (rest) onOpenRestaurant(rest);
    } else if (p.category === "auto") {
      const wash = carWashById(p.id);
      if (wash) setCarWash(wash);
    } else {
      const item = venues.find((venueItem) => venueItem.id === p.id);
      if (item) setVenue(item);
    }
  };
  openPointRef.current = openPoint;

  // Динамическая тема: переключается при смене категории.
  const { setTheme } = useTheme();
  const handleCategoryChange = useCallback(
    (category: string) => {
      setCat(category);
      setTheme(categoryToTheme(category));
    },
    [setTheme],
  );

  // Высота контейнера (для расчёта позиций шторки).
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerH(containerRef.current.clientHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Дебаунс-поиск через Positionstack.
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

  // Стабильная ссылка на onOpenRestaurant через ref — предотвращает
  // пересоздание карты при ре-рендерах родителя (bugfix: stale closure).
  const onOpenRef = useRef(onOpenRestaurant);
  onOpenRef.current = onOpenRestaurant;

  // Инициализация карты + динамическая кластеризация — выполняется один раз.
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapNode.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [ASTANA.lng, ASTANA.lat],
      zoom: 12.5,
      attributionControl: false,
      pitch: 30,
    });
    mapRef.current = map;

    // ── Клиентская кластеризация по пиксельной сетке ──────────────
    // При отдалении близкие пины группируются в кластер со счётчиком;
    // при приближении сетка «разъезжается» и открываются одиночные пины.
    const CELL = 68; // размер ячейки сетки, px
    const renderClusters = () => {
      // Убираем прежние пины точек (аватарки друзей не трогаем).
      pointMarkersRef.current.forEach((m) => m.remove());
      pointMarkersRef.current = [];

      type Cell = { points: MapPoint[]; sx: number; sy: number };
      const cells = new Map<string, Cell>();
      mapPoints.forEach((p) => {
        const px = map.project([p.coords.lng, p.coords.lat]);
        const key = `${Math.floor(px.x / CELL)}:${Math.floor(px.y / CELL)}`;
        const cell = cells.get(key) ?? { points: [], sx: 0, sy: 0 };
        cell.points.push(p);
        cell.sx += p.coords.lng;
        cell.sy += p.coords.lat;
        cells.set(key, cell);
      });

      cells.forEach((cell) => {
        if (cell.points.length > 1) {
          const lng = cell.sx / cell.points.length;
          const lat = cell.sy / cell.points.length;
          const el = document.createElement("button");
          el.className = "cluster-marker";
          el.type = "button";
          el.setAttribute("aria-label", `${cell.points.length} заведений`);
          Object.assign(el.style, {
            width: "58px",
            height: "50px",
            borderRadius: "18px",
            background: "#ffffff",
            color: "#171717",
            fontFamily: "Clarity City, sans-serif",
            fontSize: "15px",
            fontWeight: "400",
            boxShadow: "0 10px 26px rgba(15, 23, 42, 0.2)",
            border: "1px solid rgba(15, 23, 42, 0.07)",
          });
          el.textContent = String(cell.points.length);
          el.onclick = () =>
            map.easeTo({
              center: [lng, lat],
              zoom: Math.min(map.getZoom() + 2, 16),
              duration: 500,
            });
          const m = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([lng, lat])
            .addTo(map);
          pointMarkersRef.current.push(m);
        } else {
          const p = cell.points[0];
          const color = catColor[p.category] ?? "#64748B";
          const occStatus = occupancyForId(p.id);
          const ringColor =
            occStatus === "busy" ? "#ef4444" : occStatus === "moderate" ? "#f97316" : "#22c55e";

          let coverImg = "";
          const rest = restaurants.find((restaurant) => restaurant.id === p.id);
          const venue = venues.find((item) => item.id === p.id);
          const wash = carWashes.find((item) => item.id === p.id);
          if (rest) coverImg = rest.cover;
          else if (venue) coverImg = venue.cover;
          else if (wash) coverImg = wash.cover;

          const isLarge = map.getZoom() >= 14 || occStatus === "busy";
          const markerWidth = isLarge ? 84 : 66;
          const markerHeight = isLarge ? 68 : 54;
          const el = document.createElement("button");
          el.type = "button";
          el.className = "group relative flex flex-col items-center";
          el.setAttribute("aria-label", p.name);

          const frame = document.createElement("span");
          Object.assign(frame.style, {
            display: "block",
            width: `${markerWidth}px`,
            height: `${markerHeight}px`,
            overflow: "hidden",
            borderRadius: isLarge ? "22px" : "18px",
            border: `3px solid ${ringColor}`,
            background: "#ffffff",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.24)",
            padding: "2px",
          });

          if (coverImg) {
            const image = document.createElement("img");
            image.src = coverImg;
            image.alt = "";
            Object.assign(image.style, {
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: isLarge ? "17px" : "13px",
            });
            frame.appendChild(image);
          } else {
            Object.assign(frame.style, {
              display: "grid",
              placeItems: "center",
              background: color,
              color: "#ffffff",
              fontFamily: "Clarity City, sans-serif",
              fontSize: "18px",
              fontWeight: "400",
            });
            frame.textContent = p.name.slice(0, 1);
          }

          const label = document.createElement("span");
          label.textContent = p.name;
          Object.assign(label.style, {
            maxWidth: `${Math.max(markerWidth + 30, 104)}px`,
            marginTop: "5px",
            overflow: "hidden",
            color: "#171717",
            fontFamily: "Clarity City, sans-serif",
            fontSize: "10px",
            fontWeight: "400",
            lineHeight: "1.1",
            textOverflow: "ellipsis",
            textShadow: "0 1px 2px rgba(255,255,255,0.95)",
            whiteSpace: "nowrap",
          });
          el.append(frame, label);
          el.onclick = () => openPointRef.current(p);
          const m = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([p.coords.lng, p.coords.lat])
            .addTo(map);
          pointMarkersRef.current.push(m);
        }
      });
    };

    map.on("load", () => {
      map.resize();
      setTimeout(() => map.resize(), 300);
      renderClusters();

      // Аватарки друзей (Zenly-style, 8 штук) — создаются один раз.
      friendMapLocations.forEach((f) => {
        const el = document.createElement("div");
        el.className = "friend-marker";
        const agoText =
          f.minutesAgo < 60 ? `${f.minutesAgo} мин` : `${Math.floor(f.minutesAgo / 60)} ч`;
        el.innerHTML = `
          <div style="position:relative;width:44px;height:44px;">
            <div style="position:absolute;inset:-3px;border-radius:50%;background:linear-gradient(135deg,#F97316,#EC4899);animation:pulse-ring 2.5s ease-out infinite;"></div>
            <img src="${f.avatar}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2.5px solid white;position:relative;box-shadow:0 4px 12px rgba(0,0,0,0.25);" />
            <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:white;font-family:'Clarity City',sans-serif;font-size:9px;font-weight:400;padding:2px 7px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${f.name} · ${agoText}</div>
          </div>
        `;
        const m = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([f.coords.lng, f.coords.lat])
          .addTo(map);
        friendMarkersRef.current.push(m);
      });
    });

    // Перекластеризация при изменении масштаба/сдвиге.
    map.on("zoomend", renderClusters);
    map.on("moveend", renderClusters);

    return () => {
      pointMarkersRef.current.forEach((m) => m.remove());
      friendMarkersRef.current.forEach((m) => m.remove());
      pointMarkersRef.current = [];
      friendMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []); // Пустой deps — карта создаётся один раз (bugfix)

  // Перелёт к результату поиска.
  const flyTo = (r: GeoResult) => {
    setQuery(r.label);
    setShowResults(false);
    mapRef.current?.flyTo({
      center: [r.lng, r.lat],
      zoom: 14.5,
      speed: 1.4,
      curve: 1.6,
    });
    if (r.kind === "restaurant") {
      const rest = restaurants.find((x) => x.id === r.id);
      if (rest) setTimeout(() => onOpenRef.current(rest), 700);
    }
  };

  // ── Физика шторки ────────────────────────────────────────────────
  const collapsedH = 118;
  const halfH = Math.round(containerH * 0.55);
  const fullH = containerH;

  const sheetHeight = sheet === "collapsed" ? collapsedH : sheet === "half" ? halfH : fullH;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    let target: SheetState = sheet;

    if (velocity < -300 || offset < -60) {
      target = sheet === "collapsed" ? "half" : sheet === "half" ? "full" : "full";
    } else if (velocity > 300 || offset > 60) {
      target = sheet === "full" ? "half" : sheet === "half" ? "collapsed" : "collapsed";
    } else {
      const midPoint = (collapsedH + halfH) / 2;
      const fullPoint = (halfH + fullH) / 2;
      if (sheetHeight < midPoint) target = "collapsed";
      else if (sheetHeight < fullPoint) target = "half";
      else target = "full";
    }

    setSheet(target);
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-neutral-100">
      {/* ── Карта на весь экран ─────────────────────────────────────── */}
      <div ref={mapNode} className="absolute inset-0 h-full w-full" />

      {/* ── Верхний оверлей: локация + поиск ────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-4 pt-14">
        <div className="pointer-events-auto flex items-center justify-between">
          <div>
            <p className="section-subtitle">Ваша локация</p>
            <p className="text-lg font-normal text-neutral-900">Астана · Есиль</p>
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
              <Loader2 className="h-4 w-4 animate-spin text-neutral-900" />
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
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-900" />
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
                      <p className="truncate text-sm font-normal text-neutral-900">{r.label}</p>
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

      {/* ── Легенда категорий (видна только когда шторка не full) ──── */}
      <AnimatePresence>
        {sheet !== "full" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pointer-events-none absolute left-4 top-44 z-10 flex flex-col gap-1.5"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM SHEET — резиновая шторка с 3 snap-состояниями ───── */}
      <motion.div
        ref={sheetRef}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={{ height: sheetHeight }}
        transition={{ type: "spring", stiffness: 400, damping: 38, mass: 0.8 }}
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.25)]"
      >
        {/* Грань для перетаскивания */}
        <button
          type="button"
          onPointerDown={(event) => dragControls.start(event)}
          onClick={() =>
            setSheet(sheet === "collapsed" ? "half" : sheet === "half" ? "full" : "collapsed")
          }
          className="flex w-full shrink-0 touch-none flex-col items-center gap-1 pt-2.5 pb-1"
          aria-label="Переключить шторку"
        >
          <div className="h-1.5 w-10 rounded-full bg-neutral-300" />
          <div className="flex items-center gap-1 text-neutral-400">
            {sheet === "full" ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </div>
        </button>

        <div className="shrink-0">
          <CategoryRail value={cat} onChange={handleCategoryChange} />
        </div>

        {/* ── Half-состояние: горизонтальная карусель "Рядом с вами" ─ */}
        {sheet === "half" && (
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h3 className="text-[19px] font-normal tracking-[-0.02em] text-neutral-900">
                Ближайшие заведения
              </h3>
              <span className="text-xs font-light text-neutral-500">{restaurants.length} мест</span>
            </div>
            <div className="no-scrollbar touch-pan-x snap-x snap-mandatory overflow-x-auto px-5 pb-2">
              <div className="flex w-max gap-3.5">
                {restaurants.map((r) => (
                  <motion.button
                    key={r.id}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => onOpenRestaurant(r)}
                    className="relative aspect-video w-[76vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-neutral-200 text-left shadow-soft"
                  >
                    <img
                      src={r.cover}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/5" />
                    <span className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-normal text-neutral-900 backdrop-blur-md">
                      <Star className="mr-1 inline h-3 w-3" strokeWidth={1.5} />
                      {r.rating}
                    </span>
                    <span className="absolute inset-x-4 bottom-4 text-white">
                      <span className="block text-[17px] font-normal">{r.name}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-light text-white/75">
                        <Clock className="h-3 w-3" strokeWidth={1.5} />
                        {r.cuisine} · {r.distanceKm} км
                      </span>
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Full-состояние: категории + три чистых блока ─────────── */}
        {sheet === "full" && (
          <div className="catalog-scroll min-h-0 flex-1 overflow-y-auto bg-[#fafafa] pb-[130px]">
            <CatalogSections
              category={cat}
              onOpenRestaurant={onOpenRestaurant}
              onOpenVenue={openVenue}
              onOpenEvent={setEvent}
            />
          </div>
        )}

        {/* Модалки каталога (переиспользуемые компоненты) */}
        <AnimatePresence>
          {venue && <VenueBookingModal key="venue" venue={venue} onClose={() => setVenue(null)} />}
          {event && <EventTicketModal key="event" event={event} onClose={() => setEvent(null)} />}
          {carWash && (
            <CarWashSheet key="carwash" wash={carWash} onClose={() => setCarWash(null)} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
