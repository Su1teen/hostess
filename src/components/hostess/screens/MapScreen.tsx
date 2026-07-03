import { useEffect, useRef, useState } from "react";
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
  CalendarDays,
  Check,
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
  type Restaurant,
  type Venue,
  type CityEvent,
  type Story,
} from "@/data/hostess";
import { geocode, type GeoResult } from "@/lib/geo";

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

// ── Состояния шторки ──────────────────────────────────────────────
// collapsed: торчит только поиск + грань (~90px)
// half:      среднее положение — видны карточки "Рядом с вами"
// full:      каталог на весь экран
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
  const markersRef = useRef<mapboxgl.Marker[]>([]);
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

  // Инициализация карты.
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

    map.on("load", () => {
      map.resize();
      setTimeout(() => map.resize(), 300);

      // Все точки карты (19+) — цветные пины по категории.
      mapPoints.forEach((p) => {
        const color = catColor[p.category] ?? "#64748B";
        const el = document.createElement("button");
        el.className =
          "flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-neutral-900 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.22)] ring-1 ring-black/5 hover:scale-105 transition";
        el.innerHTML = `<span class="h-2 w-2 rounded-full" style="background:${color}"></span>${p.name}`;
        // Рестораны открывают карточку.
        if (p.category === "food") {
          const rest = restaurants.find((r) => r.id === p.id);
          if (rest) el.onclick = () => onOpenRestaurant(rest);
        }
        const m = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([p.coords.lng, p.coords.lat])
          .addTo(map);
        markersRef.current.push(m);
      });

      // Аватарки друзей (Zenly-style, 8 штук).
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
      if (rest) setTimeout(() => onOpenRestaurant(rest), 700);
    }
  };

  // ── Физика шторки ────────────────────────────────────────────────
  // Высота шторки в каждом состоянии (в px от низа).
  // collapsed: ~90px (поиск + грань), half: 45% экрана, full: 100% экрана.
  const collapsedH = 92;
  const halfH = Math.round(containerH * 0.55);
  const fullH = containerH;

  const sheetHeight = sheet === "collapsed" ? collapsedH : sheet === "half" ? halfH : fullH;

  // Drag: перетаскиваем шторку мышкой/пальцем. На release — snap к ближайшему.
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.y; // отрицательный = тянули вверх
    const velocity = info.velocity.y;
    const currentH = sheetHeight;

    // Определяем целевое состояние по направлению жеста.
    let target: SheetState = sheet;

    if (velocity < -300 || offset < -60) {
      // Тянем вверх → следующее состояние.
      target = sheet === "collapsed" ? "half" : sheet === "half" ? "full" : "full";
    } else if (velocity > 300 || offset > 60) {
      // Тянем вниз → предыдущее состояние.
      target = sheet === "full" ? "half" : sheet === "half" ? "collapsed" : "collapsed";
    } else {
      // Мягкий отпуск — snap к ближайшему по позиции.
      const midPoint = (collapsedH + halfH) / 2;
      const fullPoint = (halfH + fullH) / 2;
      if (currentH < midPoint) target = "collapsed";
      else if (currentH < fullPoint) target = "half";
      else target = "full";
    }

    setSheet(target);
  };

  // Прокрутка содержимого внутри шторки: только в full-режиме каталожная часть скроллится.
  // В half — скроллится горизонтальная карусель карточек.
  const catVenues = venues.filter((v) => cat === "food" || v.category === cat);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-neutral-100">
      {/* ── Карта на весь экран ─────────────────────────────────────── */}
      <div ref={mapNode} className="absolute inset-0 h-screen w-full" />

      {/* ── Верхний оверлей: локация + поиск ────────────────────────── */}
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

        {/* ── Свернутое состояние: только поиск + фильтры ─────────── */}
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
        {sheet !== "collapsed" && (
          <div className="shrink-0 pb-2">
            <div className="flex items-center justify-between px-4 pb-2">
              <h3 className="text-[15px] font-semibold text-neutral-900">Рядом с вами</h3>
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
                      <span className="ml-auto font-semibold text-primary">
                        от {(r.avgCheck / 1000).toFixed(0)}k ₸
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Full-состояние: полный каталог (скроллится) ──────────── */}
        {sheet === "full" && (
          <div className="flex-1 overflow-y-auto pb-[140px]">
            {/* Заголовок каталога */}
            <div className="sticky top-0 z-10 bg-white/85 px-5 pb-3 pt-2 backdrop-blur-xl">
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

            {/* Сторис друзей */}
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

            {/* Категории */}
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-2">
              {categories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
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

            {/* Афиша выходных */}
            <div className="mt-4">
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
                  <Ticket className="h-4 w-4 text-primary" /> Афиша выходных
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
                        <span className="flex items-center gap-0.5 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white">
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
                {/* Выбор редакции */}
                <div className="px-5 pt-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    <Flame className="h-3.5 w-3.5 text-primary" /> Выбор редакции
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
                      <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white">
                        Новое
                      </span>
                      <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold text-neutral-900">
                        <Star className="mr-1 -mt-0.5 inline h-3 w-3 fill-primary text-primary" />
                        {restaurants[0].rating}
                      </span>
                    </div>
                    <div className="absolute inset-x-4 bottom-4 text-white">
                      <h2 className="text-2xl font-semibold">{restaurants[0].name}</h2>
                      <p className="text-sm opacity-80">{restaurants[0].description}</p>
                    </div>
                  </motion.button>
                </div>

                {/* Тренды */}
                <div className="mt-6">
                  <div className="flex items-center justify-between px-5 pb-3">
                    <h3 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
                      <TrendingUp className="h-4 w-4 text-primary" /> Сейчас популярны
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
                            <Star className="mr-0.5 -mt-0.5 inline h-3 w-3 fill-primary text-primary" />
                            {r.rating}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold">{r.name}</p>
                          <p className="text-xs text-neutral-500">{r.cuisine}</p>
                          <p className="mt-1.5 text-[11px] font-semibold text-primary">
                            от {money(r.avgCheck)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Все рестораны */}
                <div className="mt-6 space-y-3 px-5">
                  <h3 className="pb-1 text-[15px] font-semibold text-neutral-900">Все заведения</h3>
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
                          <Star className="h-3 w-3 fill-primary text-primary" />
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
              /* Другие категории */
              <div className="mt-4 space-y-3 px-5">
                {catVenues.map((v) => (
                  <motion.button
                    key={v.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setVenue(v)}
                    className="w-full overflow-hidden rounded-3xl bg-white text-left shadow-soft"
                  >
                    <div className="relative h-36">
                      <img src={v.cover} alt="" className="h-full w-full object-cover" />
                      {v.badge && (
                        <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-lg shadow-primary/30">
                          {v.badge}
                        </span>
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                        <Star className="mr-0.5 -mt-0.5 inline h-3 w-3 fill-primary text-primary" />
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
                        <p className="text-xs font-semibold text-primary">
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

        {/* Модалки каталога (сторис, заведение, событие) */}
        <AnimatePresence>
          {story && <StoryViewer key="story" story={story} onClose={() => setStory(null)} />}
          {venue && <VenueModal key="venue" venue={venue} onClose={() => setVenue(null)} />}
          {event && <EventModal key="event" event={event} onClose={() => setEvent(null)} />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Просмотр сторис ──────────────────────────────────────────────── */

function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
      onClick={onClose}
    >
      <img src={story.cover} alt="" className="h-full w-full object-cover opacity-90" />
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 pt-12">
        <div className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-white/25">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "linear" }}
            className="h-full bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <img
            src={story.avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white/60"
          />
          <p className="text-sm font-semibold text-white">{story.name}</p>
          <button onClick={onClose} className="ml-auto text-white/80" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <p className="absolute inset-x-6 bottom-24 text-center text-lg font-semibold text-white drop-shadow">
        {story.caption}
      </p>
    </motion.div>
  );
}

/* ── Запись в заведение ───────────────────────────────────────────── */

function VenueModal({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const [service, setService] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const slots = ["10:00", "11:30", "13:00", "15:30", "17:00", "19:30"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-end bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92%] w-full overflow-y-auto rounded-t-[32px] bg-white pb-8 shadow-float"
      >
        <div className="relative h-48">
          <img src={venue.cover} alt="" className="h-full w-full rounded-t-[32px] object-cover" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 pt-4">
          <h2 className="text-xl font-semibold">{venue.name}</h2>
          <p className="text-sm text-neutral-500">{venue.kind}</p>

          {booked ? (
            <div className="py-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white"
              >
                <Check className="h-7 w-7" strokeWidth={3} />
              </motion.div>
              <p className="mt-3 text-base font-semibold">Вы записаны!</p>
              <p className="mt-1 text-xs text-neutral-500">
                {venue.services[service].name} · завтра в {slot}
              </p>
              <button
                onClick={onClose}
                className="mt-5 rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white"
              >
                Отлично
              </button>
            </div>
          ) : (
            <>
              <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                Услуга
              </p>
              <div className="space-y-2">
                {venue.services.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => setService(i)}
                    className={`flex w-full items-center justify-between rounded-2xl p-3 text-left transition-all ${
                      service === i ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-900"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p
                        className={`text-xs ${service === i ? "text-white/60" : "text-neutral-500"}`}
                      >
                        {s.duration}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{money(s.price)}</p>
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                Завтра
              </p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlot(s)}
                    className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-semibold transition-colors ${
                      slot === s ? "bg-primary text-white" : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!slot}
                onClick={() => setBooked(true)}
                className="mt-5 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white shadow-float disabled:opacity-40"
              >
                Записаться · {money(venue.services[service].price)}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Билет на событие ─────────────────────────────────────────────── */

function EventModal({ event, onClose }: { event: CityEvent; onClose: () => void }) {
  const [bought, setBought] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-end bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[32px] bg-white pb-8 shadow-float"
      >
        <div className="relative h-52">
          <img src={event.cover} alt="" className="h-full w-full rounded-t-[32px] object-cover" />
          <div className="absolute inset-0 rounded-t-[32px] bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute inset-x-4 bottom-3 text-white">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold backdrop-blur">
              {event.tag}
            </span>
            <h2 className="mt-1.5 text-xl font-semibold">{event.title}</h2>
          </div>
        </div>
        <div className="px-5 pt-4">
          <div className="flex gap-4 text-xs text-neutral-600">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {event.date} · {event.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {event.place}
            </span>
          </div>

          {bought ? (
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="mx-auto flex w-56 flex-col items-center rounded-2xl bg-neutral-900 p-4 text-white shadow-float"
              >
                <Ticket className="h-6 w-6 text-primary" />
                <p className="mt-2 text-sm font-semibold">{event.title}</p>
                <p className="mt-0.5 text-[10px] opacity-60">
                  {event.date} · {event.time} · 1 билет
                </p>
              </motion.div>
              <p className="mt-4 text-xs text-neutral-500">Билет добавлен в Wallet</p>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setBought(true)}
              className="mt-5 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white shadow-float"
            >
              {event.price === 0
                ? "Зарегистрироваться · бесплатно"
                : `Купить билет · ${money(event.price)}`}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
