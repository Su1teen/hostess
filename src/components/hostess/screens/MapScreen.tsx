import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
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
  Flame,
  TrendingUp,
  Ticket,
} from "lucide-react";
import {
  ASTANA,
  MAPBOX_TOKEN,
  restaurants,
  venues,
  mapPoints,
  friendMapLocations,
  categories,
  cityEvents,
  stories,
  money,
  occupancyForId,
  occupancyColor,
  carWashById,
  type Restaurant,
  type Venue,
  type CityEvent,
  type Story,
  type CarWash,
  type MapPoint,
} from "@/data/hostess";
import { geocode, type GeoResult } from "@/lib/geo";
import { CoverFlowCarousel, type CoverFlowItem } from "../CoverFlowCarousel";
import { CarWashSheet } from "../CarWashSheet";
import { useTheme, categoryToTheme } from "@/components/hostess/ThemeProvider";
import { StoryViewer } from "@/components/hostess/StoryViewer";
import { VenueBookingModal } from "@/components/hostess/VenueBookingModal";
import { EventTicketModal } from "@/components/hostess/EventTicketModal";

mapboxgl.accessToken = MAPBOX_TOKEN;

const filters = ["Рядом", "Ужин", "Завтрак", "Терраса", "Wine bar", "Азия", "Стейк"];

// Цвет пина по категории.
const catColor: Record<string, string> = {
  food: "#F97316",
  beauty: "#EC4899",
  medicine: "#0EA5E9",
  auto: "#22C55E",
  concerts: "#A855F7",
};

// SVG-иконка по категории (для белых пинов на карте).
function iconSvgFor(p: MapPoint): { svg: string; label: string } {
  if (p.category === "food") {
    return {
      label: "Ресторан",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
    };
  }
  if (p.category === "beauty") {
    const barber = p.name.toLowerCase().includes("барбер");
    return {
      label: barber ? "Барбершоп" : "Красота",
      svg: barber
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>`,
    };
  }
  if (p.category === "medicine") {
    return {
      label: "Медицина",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></svg>`,
    };
  }
  return {
    label: "Авто",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
  };
}

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
  const [story, setStory] = useState<Story | null>(null);
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
          // ── Кластер ──
          const lng = cell.sx / cell.points.length;
          const lat = cell.sy / cell.points.length;
          const el = document.createElement("button");
          el.className = "cluster-marker";
          el.innerHTML = `
            <div style="position:relative;display:grid;place-items:center;width:46px;height:46px;border-radius:9999px;background:white;box-shadow:0 6px 18px rgba(0,0,0,0.18);border:1px solid rgba(0,0,0,0.04);">
              <span style="font-size:15px;font-weight:700;color:#111;">${cell.points.length}</span>
              <span style="position:absolute;inset:0;border-radius:9999px;border:2px solid rgba(249,115,22,0.35);"></span>
            </div>`;
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
          // ── Одиночный белый пин с индикатором загруженности ──
          const p = cell.points[0];
          const color = catColor[p.category] ?? "#64748B";
          const occ = occupancyColor[occupancyForId(p.id)];
          const { svg, label } = iconSvgFor(p);
          const el = document.createElement("button");
          el.className =
            "group relative flex flex-col items-center transition-transform hover:z-50 hover:scale-110";
          el.innerHTML = `
            <div style="position:relative;">
              <div style="display:grid;place-items:center;width:40px;height:40px;border-radius:9999px;background:white;box-shadow:0 4px 12px rgba(0,0,0,0.16);border:1px solid rgba(0,0,0,0.04);color:${color};">
                ${svg}
              </div>
              <span style="position:absolute;top:-1px;right:-1px;width:12px;height:12px;border-radius:9999px;background:${occ};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.25);"></span>
            </div>
            <div class="opacity-0 transition-opacity group-hover:opacity-100" style="position:absolute;top:44px;white-space:nowrap;border-radius:6px;background:rgba(17,17,17,0.9);padding:2px 6px;font-size:9.5px;font-weight:500;color:white;backdrop-filter:blur(6px);">${label}</div>`;
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
            <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:white;font-size:9px;font-weight:600;padding:2px 7px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${f.name} · ${agoText}</div>
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
  const collapsedH = 170;
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

  // Фильтрация venues по категории (bugfix: при cat=food не показываем все venues).
  const catVenues = venues.filter((v) => v.category === cat);

  // Карточки для Cover Flow карусели (Task 2): афиша города.
  const coverItems: CoverFlowItem[] = cityEvents.map((e) => ({
    id: e.id,
    image: e.cover,
    title: e.title,
    subtitle: `${e.place} · ${e.date}`,
    badge: e.hot ? "Хит" : e.tag,
    meta: e.price === 0 ? "Бесплатно" : `от ${money(e.price)}`,
  }));

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-neutral-100">
      {/* ── Карта на весь экран ─────────────────────────────────────── */}
      <div ref={mapNode} className="absolute inset-0 h-full w-full" />

      {/* ── Верхний оверлей: локация + поиск ────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-4 pt-14">
        <div className="pointer-events-auto flex items-center justify-between">
          <div>
            <p className="section-subtitle">Ваша локация</p>
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
          onClick={() =>
            setSheet(sheet === "collapsed" ? "half" : sheet === "half" ? "full" : "collapsed")
          }
          className="flex w-full shrink-0 flex-col items-center gap-1 pt-2.5 pb-1"
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

        {/* ── Свернутое состояние: только фильтры ─────────────────── */}
        <div className="shrink-0 px-4 pb-2 pt-1">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
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

        {/* ── Half-состояние: горизонтальная карусель "Рядом с вами" ─ */}
        {sheet === "half" && (
          <div className="shrink-0 pb-2">
            <div className="flex items-center justify-between px-4 pb-2">
              <h3 className="section-title">Ближайшие заведения</h3>
              <span className="text-xs text-neutral-500">{restaurants.length} мест</span>
            </div>
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onOpenRestaurant(r)}
                  className="group w-[240px] shrink-0 overflow-hidden rounded-3xl bg-white text-left hairline"
                >
                  <div className="relative h-32 w-full overflow-hidden">
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
                      <span className="ml-auto font-semibold text-neutral-900">
                        от {(r.avgCheck / 1000).toFixed(0)}k ₸
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Full-состояние: полный каталог (единый скролл) ──────────── */}
        {sheet === "full" && (
          <div className="flex-1 overflow-y-auto bg-gray-50 pb-[140px]">
            {/* Рядом с вами — теперь часть единого скролла (Task 2) */}
            <div className="pt-2">
              <div className="flex items-center justify-between px-5 pb-2">
                <h3 className="text-[15px] font-semibold text-neutral-900">Рядом с вами</h3>
                <span className="text-xs text-neutral-500">{restaurants.length} мест</span>
              </div>
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
                {restaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onOpenRestaurant(r)}
                    className="group w-[240px] shrink-0 overflow-hidden rounded-3xl border border-border/50 bg-white text-left shadow-soft"
                  >
                    <div className="relative h-32 w-full overflow-hidden">
                      <img
                        src={r.cover}
                        alt={r.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                        <Star className="h-3 w-3 fill-white" /> {r.rating}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[15px] font-semibold text-neutral-900">{r.name}</p>
                      <p className="text-xs text-neutral-500">
                        {r.cuisine} · {r.district}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Flow карусель (Task 2) между "Рядом" и "Городской хаб" */}
            <div className="mt-5">
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
                  <Flame className="h-4 w-4 text-primary" /> Выбор дня
                </h3>
              </div>
              <CoverFlowCarousel
                items={coverItems}
                onSelect={(it) => {
                  const ev = cityEvents.find((e) => e.id === it.id);
                  if (ev) setEvent(ev);
                }}
              />
            </div>

            {/* Заголовок каталога */}
            <div className="px-5 pb-3 pt-6">
              <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                Городской хаб
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                Вся{" "}
                <span
                  className="italic text-neutral-500"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Астана
                </span>{" "}
                здесь
              </h1>
            </div>

            {/* ── Истории друзей ────────────────────────────────────── */}
            <div className="px-5 pb-1">
              <h3 className="section-title mb-2">Истории друзей</h3>
            </div>
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1 pt-1">
              {stories.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStory(s)}
                  className="flex w-16 shrink-0 flex-col items-center gap-1"
                >
                  <span
                    className={`rounded-full p-[2.5px] ${
                      s.viewed
                        ? "bg-neutral-200"
                        : "bg-gradient-to-tr from-primary via-pink-500 to-amber-400"
                    }`}
                  >
                    <img
                      src={s.avatar}
                      alt={s.name}
                      className="h-14 w-14 rounded-full border-2 border-white object-cover"
                    />
                  </span>
                  <span className="text-[10px] font-medium text-neutral-600">{s.name}</span>
                </button>
              ))}
            </div>

            {/* ── Категории ────────────────────────────────────────── */}
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-2">
              {categories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => handleCategoryChange(c.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-full py-2 pl-1.5 pr-4 text-sm transition-colors ${
                    cat === c.key ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-base shadow-soft">
                    {c.emoji}
                  </span>
                  <span className="font-medium">{c.label}</span>
                </button>
              ))}
            </div>

            {/* ── Афиша выходных ────────────────────────────────────── */}
            <div className="mt-4">
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="section-title flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-neutral-900" /> Афиша выходных
                </h3>
                <button className="text-xs font-medium text-neutral-500">Все →</button>
              </div>
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
                {cityEvents.map((e) => (
                  <motion.button
                    key={e.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setEvent(e)}
                    className="relative h-44 w-[280px] shrink-0 overflow-hidden rounded-3xl text-left shadow-soft"
                  >
                    <img
                      src={e.cover}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-neutral-900 backdrop-blur">
                        {e.tag}
                      </span>
                      {e.hot && (
                        <span className="flex items-center gap-0.5 rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-bold text-white">
                          <Flame className="h-2.5 w-2.5" /> Хит
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-3 bottom-3 text-white">
                      <p className="text-[15px] font-semibold leading-tight">{e.title}</p>
                      <p className="mt-0.5 text-[11px] opacity-80">
                        {e.place} · {e.date} · {e.time}
                      </p>
                      <p className="mt-1 text-xs font-bold">
                        {e.price === 0 ? "Вход свободный" : `от ${money(e.price)}`}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {cat === "food" ? (
              <>
                {/* ── Выбор редакции ──────────────────────────────────── */}
                <div className="px-5 pt-4">
                  <p className="section-subtitle mb-3 flex items-center gap-2">
                    <Flame className="h-3.5 w-3.5 text-neutral-900" /> Выбор редакции
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onOpenRestaurant(restaurants[0])}
                    className="relative h-72 w-full overflow-hidden rounded-3xl text-left shadow-float"
                  >
                    <img
                      src={restaurants[0].cover}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold text-white">
                        Новое
                      </span>
                      <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold text-neutral-900">
                        <Star className="mr-1 -mt-0.5 inline h-3 w-3 fill-neutral-900 text-neutral-900" />
                        {restaurants[0].rating}
                      </span>
                    </div>
                    <div className="absolute inset-x-4 bottom-4 text-white">
                      <h2 className="text-2xl">{restaurants[0].name}</h2>
                      <p className="text-sm opacity-80">{restaurants[0].description}</p>
                    </div>
                  </motion.button>
                </div>

                {/* ── Сейчас популярны ────────────────────────────────── */}
                <div className="mt-6">
                  <div className="flex items-center justify-between px-5 pb-3">
                    <h3 className="section-title flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-neutral-900" /> Сейчас популярны
                    </h3>
                    <button className="text-xs font-medium text-neutral-500">Все →</button>
                  </div>
                  <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
                    {restaurants.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onOpenRestaurant(r)}
                        className="w-[220px] shrink-0 overflow-hidden rounded-3xl bg-white text-left shadow-soft"
                      >
                        <div className="relative h-32">
                          <img src={r.cover} alt="" className="h-full w-full object-cover" />
                          <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                            <Star className="mr-0.5 -mt-0.5 inline h-3 w-3 fill-neutral-900 text-neutral-900" />
                            {r.rating}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold">{r.name}</p>
                          <p className="text-xs text-neutral-500">{r.cuisine}</p>
                          <p className="mt-1.5 text-[11px] font-semibold text-neutral-900">
                            от {money(r.avgCheck)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Все рестораны ────────────────────────────────────── */}
                <div className="mt-6 space-y-3 px-5">
                  <h3 className="section-title pb-1">Все рестораны</h3>
                  {restaurants.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpenRestaurant(r)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white p-2 text-left shadow-soft"
                    >
                      <img src={r.cover} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{r.name}</p>
                        <p className="truncate text-xs text-neutral-500">
                          {r.cuisine} · {r.district}
                        </p>
                        <div className="mt-1.5 flex gap-1">
                          {r.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-neutral-500">
                        <p className="flex items-center justify-end gap-0.5">
                          <Star className="h-3 w-3 fill-neutral-900 text-neutral-900" />
                          {r.rating}
                        </p>
                        <p className="mt-0.5 font-semibold text-neutral-900">
                          ~{(r.avgCheck / 1000).toFixed(0)}k ₸
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* ── Другие категории ──────────────────────────────────── */
              <div className="mt-4 space-y-3 px-5">
                <h3 className="section-title pb-1">
                  {categories.find((c) => c.key === cat)?.label ?? "Заведения"}
                </h3>
                {catVenues.length === 0 && (
                  <p className="py-8 text-center text-sm text-neutral-400">
                    Пока нет заведений в этой категории
                  </p>
                )}
                {catVenues.map((v) => (
                  <motion.button
                    key={v.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openVenue(v)}
                    className="w-full overflow-hidden rounded-3xl border border-border/50 bg-white text-left shadow-soft"
                  >
                    <div className="relative h-36">
                      <img src={v.cover} alt="" className="h-full w-full object-cover" />
                      {v.badge && (
                        <span className="absolute left-3 top-3 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg shadow-neutral-900/30">
                          {v.badge}
                        </span>
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                        <Star className="mr-0.5 -mt-0.5 inline h-3 w-3 fill-neutral-900 text-neutral-900" />
                        {v.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-semibold">{v.name}</p>
                        <p className="text-xs text-neutral-500">{v.kind}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-neutral-500">{v.distanceKm} км</p>
                        <p className="text-xs font-semibold text-neutral-900">
                          от {money(v.priceFrom)}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Модалки каталога (переиспользуемые компоненты) */}
        <AnimatePresence>
          {story && <StoryViewer key="story" story={story} onClose={() => setStory(null)} />}
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
