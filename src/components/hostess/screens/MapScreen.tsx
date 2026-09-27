import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { ChevronDown, Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import {
  MAPBOX_TOKEN,
  USER_LOCATION,
  restaurants,
  venues,
  cityEvents,
  mapPoints,
  friendMapLocations,
  carWashById,
  type Restaurant,
  type Venue,
  type CityEvent,
  type CarWash,
  type MapPoint,
} from "@/data/hostess";
import { geocode, type GeoResult } from "@/lib/geo";
import { hapticSelect } from "@/lib/haptics";
import { CarWashSheet } from "../CarWashSheet";
import { VenueBookingModal } from "@/components/hostess/VenueBookingModal";
import { EventTicketModal } from "@/components/hostess/EventTicketModal";
import { CatalogSections, CategoryRail } from "@/components/hostess/screens/CatalogScreen";
import { CompactVenueCard, Rating, SlotChips, VenueRow } from "@/components/hostess/cards";
import {
  ICON_STROKE,
  IconButton,
  LiveDot,
  OccupancyRing,
  Photo,
  sheetSpring,
  spring,
  occupancyLevel,
  toneColor,
} from "@/components/hostess/system";
import {
  categoryMeta,
  freshness,
  liveSignal,
  nearbyFor,
  nearbyItem,
  slotsFor,
  type NearbyItem,
} from "@/components/hostess/venue";
import { useNow } from "@/hooks/useNow";
import type { SheetState } from "@/components/hostess/types";

mapboxgl.accessToken = MAPBOX_TOKEN;

const MAP_CENTER: [number, number] = [71.4335, 51.1335];
const ME = USER_LOCATION;
const HEADER_H = 78;

/** What the marker says: bays for washes, time for events, rating otherwise. */
function markerValue(p: MapPoint, item: NearbyItem): string {
  const c = item.signal.capacity;
  if (c) return `${c.free}/${c.total}`;
  const e = cityEvents.find((x) => x.id === p.id);
  if (e) return e.time;
  return item.rating.toFixed(1);
}

/** Thin occupancy ring: solid arc for verified load, dashed for estimated. */
function ringSvg(item: NearbyItem): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const r = 7;
  const c = 2 * Math.PI * r;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 18 18");
  svg.setAttribute("class", "hs-mk__ring");
  const circle = (cls: string) => {
    const el = document.createElementNS(ns, "circle");
    el.setAttribute("cx", "9");
    el.setAttribute("cy", "9");
    el.setAttribute("r", String(r));
    el.setAttribute("fill", "none");
    el.setAttribute("stroke-width", "2.4");
    el.setAttribute("class", cls);
    return el;
  };
  const track = circle("hs-mk__track");
  track.setAttribute("stroke", "rgb(17 18 20 / 0.1)");
  const arc = circle("hs-mk__arc");
  arc.setAttribute("stroke", toneColor[occupancyLevel(item.occupancy).tone]);
  arc.setAttribute("stroke-linecap", "round");
  if (item.signal.source === "estimated") {
    arc.setAttribute("stroke-dasharray", "1.8 2.6");
    arc.setAttribute("stroke-linecap", "butt");
  } else {
    arc.setAttribute("stroke-dasharray", `${(c * Math.min(100, Math.max(6, item.occupancy))) / 100} ${c}`);
  }
  svg.append(track, arc);
  return svg;
}

function mapPointToVenue(point: MapPoint): Venue {
  const item = nearbyItem(point);
  return {
    id: point.id,
    category: point.category,
    name: point.name,
    kind: item.subtitle,
    rating: point.rating,
    reviews: 128,
    occupancy: item.occupancy,
    peakHours: "18:00 – 21:00",
    cover: point.cover,
    priceFrom: 5000,
    distanceKm: item.distanceKm,
    services: [
      { name: "Стандартная запись", price: 5000, duration: "60 мин" },
      { name: "Приоритетная запись", price: 8000, duration: "45 мин" },
    ],
    coords: point.coords,
  };
}

export function MapScreen({
  onOpenRestaurant,
  sheetState = "peek",
  onSheetStateChange,
  onOpenProfile,
  onOverlayChange,
}: {
  onOpenRestaurant: (r: Restaurant) => void;
  sheetState?: SheetState;
  onSheetStateChange?: (s: SheetState) => void;
  onOpenProfile?: () => void;
  onOverlayChange?: (open: boolean) => void;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const pinElsRef = useRef(new Map<string, HTMLElement>());
  const friendMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const renderClustersRef = useRef<() => void>(() => {});
  const activeCategoriesRef = useRef(new Set<string>(["food"]));
  const selectedRef = useRef<string | null>(null);
  const selectPointRef = useRef<(p: MapPoint) => void>(() => {});
  const markerClickAt = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const safeProbe = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [containerH, setContainerH] = useState(800);
  const [sab, setSab] = useState(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [internalSheet, setInternalSheet] = useState<SheetState>(sheetState);
  const sheet = onSheetStateChange ? sheetState : internalSheet;
  const setSheet = useCallback(
    (s: SheetState) => {
      if (onSheetStateChange) onSheetStateChange(s);
      else setInternalSheet(s);
    },
    [onSheetStateChange],
  );

  const [cat, setCat] = useState("food");
  const [activeCategories, setActiveCategories] = useState<string[]>(["food"]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [event, setEvent] = useState<CityEvent | null>(null);
  const [carWash, setCarWash] = useState<CarWash | null>(null);
  const now = useNow(30_000);

  useEffect(() => {
    onOverlayChange?.(Boolean(venue || event || carWash));
  }, [venue, event, carWash, onOverlayChange]);

  const openVenue = (v: Venue) => {
    const wash = carWashById(v.id);
    if (v.category === "auto" && wash) setCarWash(wash);
    else setVenue(v);
  };

  // Открыть детальную карточку точки.
  const openPoint = (p: MapPoint) => {
    const rest = restaurants.find((restaurant) => restaurant.id === p.id);
    if (rest) return onOpenRestaurant(rest);
    const cityEvent = cityEvents.find((item) => item.id === p.id);
    if (cityEvent) return setEvent(cityEvent);
    const wash = carWashById(p.id);
    if (wash) return setCarWash(wash);
    const item = venues.find((venueItem) => venueItem.id === p.id);
    setVenue(item ?? mapPointToVenue(p));
  };

  /* ── Sheet geometry ───────────────────────────────────────────── */
  const navSpace = 56 + sab;
  const collapsedV = navSpace + HEADER_H;
  const peekV = collapsedV + 124;
  const halfV = Math.max(peekV + 140, Math.round(containerH * 0.6));
  const visibleOf = useCallback(
    (s: SheetState) =>
      s === "collapsed" ? collapsedV : s === "peek" ? peekV : s === "half" ? halfV : containerH,
    [collapsedV, peekV, halfV, containerH],
  );
  const yOf = useCallback((s: SheetState) => containerH - visibleOf(s), [containerH, visibleOf]);

  const sheetY = useMotionValue(containerH - peekV);
  const dragging = useRef(false);
  const radius = useTransform(sheetY, [0, 48], [0, 30]);
  const overlayOpacity = useTransform(sheetY, (v) => Math.min(1, Math.max(0, (v - 40) / (containerH * 0.25))));
  const controlsY = useTransform(sheetY, (v) => v - 56);
  const controlsOpacity = useTransform(sheetY, (v) =>
    Math.min(1, Math.max(0, (v - containerH * 0.38) / 80)),
  );

  useLayoutEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerH(containerRef.current.clientHeight);
      if (safeProbe.current) setSab(safeProbe.current.clientHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (dragging.current) return;
    const controls = animate(sheetY, yOf(sheet), sheetSpring);
    return () => controls.stop();
  }, [sheet, yOf, sheetY]);

  const order: SheetState[] = ["full", "half", "peek", "collapsed"];
  const lastDragEnd = useRef(0);
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    dragging.current = false;
    lastDragEnd.current = Date.now();
    const projected = sheetY.get() + info.velocity.y * 0.2;
    let target = order.reduce((best, s) =>
      Math.abs(yOf(s) - projected) < Math.abs(yOf(best) - projected) ? s : best,
    );
    if (target === sheet && Math.abs(info.velocity.y) > 500) {
      const i = order.indexOf(sheet) + (info.velocity.y > 0 ? 1 : -1);
      target = order[Math.max(0, Math.min(order.length - 1, i))];
    }
    animate(sheetY, yOf(target), { ...sheetSpring, velocity: info.velocity.y });
    if (target !== sheet) setSheet(target);
  };

  /* ── Categories ───────────────────────────────────────────────── */
  const handleCategorySelect = useCallback(
    (category: string) => {
      const isActive = activeCategories.includes(category);
      if (isActive && activeCategories.length === 1) return;
      const next = isActive
        ? activeCategories.filter((item) => item !== category)
        : [...activeCategories, category];
      setActiveCategories(next);
      setCat((isActive && cat === category ? next[next.length - 1] : category) ?? "food");
      setSelectedId(null);
    },
    [activeCategories, cat],
  );

  const selectDiscoveryCategory = (c: string) => {
    setCat(c);
    setActiveCategories([c]);
  };

  useEffect(() => {
    activeCategoriesRef.current = new Set(activeCategories);
    renderClustersRef.current();
  }, [activeCategories]);

  const nearby = useMemo(() => nearbyFor(activeCategories, now), [activeCategories, now]);
  const freeNow = nearby.filter((i) => occupancyLevel(i.occupancy).tone === "live").length;
  // Bookable (verified) places first, then the calmest.
  const nowRail = [...nearby]
    .sort(
      (a, b) =>
        Number(a.signal.source === "estimated") - Number(b.signal.source === "estimated") ||
        a.occupancy - b.occupancy,
    )
    .slice(0, 8);

  /* ── Selection ────────────────────────────────────────────────── */
  const selectPoint = (p: MapPoint) => {
    hapticSelect();
    setSelectedId(p.id);
    setSheet("collapsed");
    const map = mapRef.current;
    if (map) {
      map.easeTo({
        center: [p.coords.lng, p.coords.lat],
        zoom: Math.max(map.getZoom(), 13.6),
        offset: [0, -Math.round(containerH * 0.14)],
        duration: 650,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    }
  };
  selectPointRef.current = selectPoint;

  useEffect(() => {
    selectedRef.current = selectedId;
    pinElsRef.current.forEach((el, id) => {
      const on = id === selectedId;
      el.querySelector(".hs-mk")?.classList.toggle("hs-mk--sel", on);
      el.style.zIndex = on ? "5" : "";
    });
  }, [selectedId]);

  // Realtime tick: bays finish, reservations start — markers follow.
  useEffect(() => {
    renderClustersRef.current();
  }, [now]);

  useEffect(() => {
    if (sheet !== "collapsed") setSelectedId(null);
  }, [sheet]);

  const selectedPoint = selectedId ? mapPoints.find((p) => p.id === selectedId) : undefined;
  const selectedItem = selectedPoint ? nearbyItem(selectedPoint, now) : undefined;

  /* ── Search ───────────────────────────────────────────────────── */
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
        setResults(await geocode(q, ctrl.signal));
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const onOpenRef = useRef(onOpenRestaurant);
  onOpenRef.current = onOpenRestaurant;

  /* ── Map init (once) ──────────────────────────────────────────── */
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapNode.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: MAP_CENTER,
      zoom: 12.9,
      attributionControl: false,
      pitch: 0,
    });
    mapRef.current = map;

    const CELL = 64;
    const renderClusters = () => {
      pointMarkersRef.current.forEach((m) => m.remove());
      pointMarkersRef.current = [];
      pinElsRef.current.clear();

      type Cell = { points: MapPoint[]; sx: number; sy: number };
      const cells = new Map<string, Cell>();
      const c = map.getCenter();
      const active = mapPoints
        .filter((point) => activeCategoriesRef.current.has(point.category))
        .sort(
          (a, b) =>
            (a.coords.lng - c.lng) ** 2 +
            (a.coords.lat - c.lat) ** 2 -
            ((b.coords.lng - c.lng) ** 2 + (b.coords.lat - c.lat) ** 2),
        )
        .slice(0, 24);

      active.forEach((p) => {
        const px = map.project([p.coords.lng, p.coords.lat]);
        const key = `${Math.floor(px.x / CELL)}:${Math.floor(px.y / CELL)}`;
        const cell = cells.get(key) ?? { points: [], sx: 0, sy: 0 };
        cell.points.push(p);
        cell.sx += p.coords.lng;
        cell.sy += p.coords.lat;
        cells.set(key, cell);
      });

      const now = Date.now();
      cells.forEach((cell) => {
        if (cell.points.length > 1 && !cell.points.some((p) => p.id === selectedRef.current)) {
          const lng = cell.sx / cell.points.length;
          const lat = cell.sy / cell.points.length;
          const tones = cell.points.map((p) => occupancyLevel(liveSignal(p.id, now).occupancy).tone);
          const share = (t: string) => (tones.filter((x) => x === t).length / tones.length) * 100;
          const el = document.createElement("button");
          el.type = "button";
          el.className = "hs-cl";
          el.style.setProperty("--g", `${share("live")}%`);
          el.style.setProperty("--a", `${share("live") + share("warn")}%`);
          el.setAttribute("aria-label", `${cell.points.length} мест, свободно ${tones.filter((t) => t === "live").length}`);
          const label = document.createElement("span");
          label.textContent = String(cell.points.length);
          el.appendChild(label);
          el.onclick = (e) => {
            e.stopPropagation();
            markerClickAt.current = Date.now();
            map.easeTo({ center: [lng, lat], zoom: Math.min(map.getZoom() + 1.8, 16), duration: 500 });
          };
          pointMarkersRef.current.push(
            new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(map),
          );
          return;
        }
        cell.points.forEach((p) => {
          const item = nearbyItem(p, now);
          const sel = p.id === selectedRef.current;
          const wrap = document.createElement("div");
          const pin = document.createElement("button");
          pin.type = "button";
          pin.className = `hs-mk${sel ? " hs-mk--sel" : ""}`;
          pin.setAttribute("aria-label", `${p.name}, ${item.status}`);
          const name = document.createElement("span");
          name.className = "hs-mk__name";
          name.textContent = p.name;
          const sep = document.createElement("span");
          sep.className = "hs-mk__sep";
          const value = document.createElement("span");
          value.textContent = markerValue(p, item);
          pin.append(ringSvg(item), name, sep, value);
          pin.onclick = (e) => {
            e.stopPropagation();
            markerClickAt.current = Date.now();
            selectPointRef.current(p);
          };
          wrap.appendChild(pin);
          if (sel) wrap.style.zIndex = "5";
          pinElsRef.current.set(p.id, wrap);
          pointMarkersRef.current.push(
            new mapboxgl.Marker({ element: wrap, anchor: "bottom", offset: [0, -5] })
              .setLngLat([p.coords.lng, p.coords.lat])
              .addTo(map),
          );
        });
      });
    };
    renderClustersRef.current = renderClusters;

    map.on("load", () => {
      // Чистая нейтральная подложка: маркеры и кольца загрузки — главный слой.
      const paint: [string, string, string][] = [
        ["land", "background-color", "#f5f6f8"],
        ["water", "fill-color", "#d3dfe9"],
        ["landuse", "fill-color", "#eef0f3"],
        ["national-park", "fill-color", "#e8efea"],
        ["building", "fill-color", "#eceef1"],
      ];
      paint.forEach(([layer, prop, value]) => {
        try {
          if (map.getLayer(layer)) map.setPaintProperty(layer, prop as never, value as never);
        } catch {
          /* style variant without this layer */
        }
      });

      map.resize();
      setTimeout(() => map.resize(), 300);
      renderClusters();

      const me = document.createElement("div");
      me.className = "hs-me";
      friendMarkersRef.current.push(
        new mapboxgl.Marker({ element: me, anchor: "center" }).setLngLat([ME.lng, ME.lat]).addTo(map),
      );

      friendMapLocations.forEach((f) => {
        const el = document.createElement("div");
        el.className = "hs-friend";
        el.title = `${f.name} · ${f.minutesAgo < 60 ? `${f.minutesAgo} мин` : `${Math.floor(f.minutesAgo / 60)} ч`}`;
        const img = document.createElement("img");
        img.src = f.avatar;
        img.alt = "";
        img.onerror = () => {
          img.remove();
          const fb = document.createElement("span");
          fb.className = "hs-friend__fallback";
          fb.textContent = f.name.slice(0, 1);
          el.appendChild(fb);
        };
        el.appendChild(img);
        friendMarkersRef.current.push(
          new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([f.coords.lng, f.coords.lat]).addTo(map),
        );
      });
    });

    map.on("moveend", renderClusters);
    map.on("click", () => {
      if (Date.now() - markerClickAt.current < 350) return;
      setSelectedId(null);
    });

    return () => {
      pointMarkersRef.current.forEach((m) => m.remove());
      friendMarkersRef.current.forEach((m) => m.remove());
      pointMarkersRef.current = [];
      friendMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
      renderClustersRef.current = () => {};
    };
  }, []);

  const flyTo = (r: GeoResult) => {
    setQuery(r.label);
    setShowResults(false);
    mapRef.current?.flyTo({ center: [r.lng, r.lat], zoom: 14.5, speed: 1.4, curve: 1.6 });
    const point = mapPoints.find((p) => p.id === r.id);
    if (point) setTimeout(() => selectPointRef.current(point), 650);
  };

  const locate = () => {
    hapticSelect();
    mapRef.current?.flyTo({ center: [ME.lng, ME.lat], zoom: 14.2, speed: 1.3 });
  };

  const activeLabels = activeCategories.map((c) => categoryMeta[c]?.label ?? c).join(", ");
  const nearMode = sheet !== "full";

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#f4f5f7]">
      <div ref={safeProbe} className="pointer-events-none absolute h-[var(--sab)] w-0" />
      <div ref={mapNode} className="absolute inset-0 h-full w-full touch-manipulation" />

      {/* ── Floating search + filters ─────────────────────────────── */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-safe"
      >
        <div className="flex items-center gap-2.5 px-4">
          <div className="pointer-events-auto relative min-w-0 flex-1">
            <div className="flex h-12 items-center gap-2.5 rounded-[18px] bg-white pl-4 pr-1.5 shadow-float">
              <Search className="h-[18px] w-[18px] shrink-0 text-ink-2" strokeWidth={ICON_STROKE} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                placeholder="Рестораны, бары, адреса"
                enterKeyHint="search"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
              />
              {loading ? (
                <Loader2 className="mr-2.5 h-4 w-4 shrink-0 animate-spin text-ink-3" />
              ) : query ? (
                <IconButton
                  icon={X}
                  label="Очистить"
                  variant="stone"
                  size={34}
                  iconSize={15}
                  onClick={() => setQuery("")}
                />
              ) : null}
            </div>

            <AnimatePresence>
              {showResults && (query || loading) && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="no-scrollbar absolute inset-x-0 top-full mt-2 max-h-80 origin-top overflow-y-auto rounded-card bg-white p-1.5 shadow-float"
                >
                  {loading && results.length === 0 &&
                    [0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5">
                        <span className="skeleton h-9 w-9 rounded-[11px]" />
                        <span className="flex-1 space-y-1.5">
                          <span className="skeleton block h-3 w-2/3 rounded" />
                          <span className="skeleton block h-2.5 w-1/3 rounded" />
                        </span>
                      </div>
                    ))}
                  {!loading && results.length === 0 && (
                    <p className="t-caption p-3">Ничего не нашли — попробуйте другое название</p>
                  )}
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => flyTo(r)}
                      className="press-soft flex min-h-12 w-full items-center gap-3 rounded-[14px] p-2.5 text-left"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-stone text-ink">
                        <MapPin className="h-4 w-4" strokeWidth={ICON_STROKE} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium">{r.label}</span>
                        <span className="block truncate text-[12.5px] text-ink-3">{r.sublabel}</span>
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onOpenProfile}
            className="pointer-events-auto grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white shadow-float"
            aria-label="Открыть профиль"
          >
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          </motion.button>
        </div>

        <div className="pointer-events-auto mt-2.5">
          <CategoryRail activeValues={activeCategories} onSelect={handleCategorySelect} tone="surface" className="pb-3" />
        </div>
      </motion.div>

      {/* ── Map controls ride on top of the sheet ─────────────────── */}
      <motion.div
        style={{ y: controlsY, opacity: controlsOpacity }}
        className="pointer-events-none absolute right-4 top-0 z-[15]"
      >
        <IconButton
          icon={LocateFixed}
          label="Где я"
          variant="surface"
          size={44}
          className="pointer-events-auto shadow-float"
          onClick={locate}
        />
      </motion.div>

      {/* ── Selected venue card (Booking-style marker → result) ───── */}
      <AnimatePresence>
        {selectedPoint && selectedItem && sheet === "collapsed" && (
          <motion.div
            key={selectedPoint.id}
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={spring}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 60 || info.velocity.y > 500) setSelectedId(null);
            }}
            className="absolute inset-x-3 z-[25]"
            style={{ bottom: collapsedV + 10 }}
          >
            <div className="rounded-hero bg-white p-3 shadow-float">
              <button
                type="button"
                onClick={() => openPoint(selectedPoint)}
                className="flex w-full items-stretch gap-3.5 text-left"
              >
                <Photo src={selectedItem.cover} className="h-[104px] w-[104px] shrink-0 rounded-[16px]" eager />
                <span className="flex min-w-0 flex-1 flex-col py-0.5">
                  <span className="t-micro">{categoryMeta[selectedItem.category]?.label}</span>
                  <span className="mt-1 flex items-start justify-between gap-2">
                    <span className="truncate text-[18px] font-semibold leading-tight tracking-[-0.02em]">
                      {selectedItem.name}
                    </span>
                    <Rating value={selectedItem.rating} className="shrink-0 pt-1" />
                  </span>
                  <span className="mt-0.5 truncate text-[13px] text-ink-2">
                    {selectedItem.distanceKm} км{selectedItem.price ? ` · ${selectedItem.price}` : ""}
                  </span>
                  <span className="mt-auto pt-2">
                    <span className="flex items-center gap-2">
                      <OccupancyRing
                        value={selectedItem.occupancy}
                        size={18}
                        stroke={2.2}
                        estimated={selectedItem.signal.source === "estimated"}
                      />
                      <span className="truncate text-[13px] font-medium">{selectedItem.status}</span>
                      {selectedItem.signal.source === "verified" && !selectedItem.signal.capacity && (
                        <span className="t-num shrink-0 text-[12.5px] text-ink-3">{selectedItem.occupancy}%</span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">{freshness(selectedItem.signal)}</span>
                  </span>
                </span>
              </button>
              {selectedItem.category === "food" && (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <SlotChips
                    slots={slotsFor(selectedItem.id, selectedItem.occupancy)}
                    onPick={() => openPoint(selectedPoint)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom sheet: collapsed · peek · half · full ──────────── */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: containerH - collapsedV }}
        dragElastic={0.06}
        dragMomentum={false}
        onDragStart={() => (dragging.current = true)}
        onDragEnd={handleDragEnd}
        style={{
          y: sheetY,
          height: containerH,
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
        }}
        className="absolute inset-x-0 top-0 z-20 flex flex-col overflow-hidden bg-canvas shadow-sheet"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {nearMode ? (
            <motion.div
              key="near"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                onPointerDown={(e) => dragControls.start(e)}
                onClick={() => {
                  if (Date.now() - lastDragEnd.current < 300) return;
                  setSheet(sheet === "half" ? "peek" : "half");
                }}
                className="relative flex touch-none cursor-grab flex-col"
                style={{ height: HEADER_H }}
              >
                <span className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-[rgb(17_18_20/0.16)]" />
                <div className="flex items-end justify-between gap-3 px-5 pt-3">
                  <div className="min-w-0">
                    <p className="t-subhead font-semibold">Рядом с вами</p>
                    <p className="t-caption mt-0.5 truncate">
                      {nearby.length} мест · {activeLabels}
                    </p>
                  </div>
                  <span className="mb-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[12.5px] font-medium shadow-hairline">
                    <LiveDot tone="live" pulse />
                    <span className="t-num">{freeNow}</span> свободно
                  </span>
                </div>
              </div>

              <div
                className={`no-scrollbar ${sheet === "half" ? "catalog-scroll overflow-y-auto" : "overflow-hidden"}`}
                style={{
                  height: Math.max(0, visibleOf(sheet) - HEADER_H - (sheet === "half" ? 0 : navSpace)),
                }}
              >
                <div className="rail gap-2.5 pb-3 pt-2">
                  {nowRail.map((item) => {
                    const p = mapPoints.find((x) => x.id === item.id)!;
                    return (
                      <CompactVenueCard
                        key={item.id}
                        image={item.cover}
                        title={item.name}
                        subtitle={item.subtitle}
                        occupancy={item.occupancy}
                        status={item.status}
                        estimated={item.signal.source === "estimated"}
                        rating={item.rating}
                        onClick={() => openPoint(p)}
                      />
                    );
                  })}
                </div>

                <div style={{ paddingBottom: navSpace + 16 }}>
                  <p className="t-micro px-5 pb-4 pt-5">Все места поблизости</p>
                  <div className="space-y-5">
                    {nearby.map((item) => {
                      const p = mapPoints.find((x) => x.id === item.id)!;
                      return (
                        <VenueRow
                          key={item.id}
                          image={item.cover}
                          title={item.name}
                          subtitle={item.subtitle}
                          occupancy={item.occupancy}
                          status={item.status}
                          estimated={item.signal.source === "estimated"}
                          rating={item.rating}
                          meta={`${item.distanceKm} км`}
                          onClick={() => openPoint(p)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="discover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex h-full min-h-0 flex-col"
            >
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="pt-safe shrink-0 touch-none border-b border-line pb-3"
              >
                <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-1">
                  <div>
                    <p className="t-micro">Астана · сегодня</p>
                    <h1 className="t-title mt-1.5">Места</h1>
                  </div>
                  <IconButton
                    icon={ChevronDown}
                    label="Свернуть"
                    variant="stone"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setSheet("half")}
                  />
                </div>
                <div onPointerDown={(e) => e.stopPropagation()} className="touch-auto">
                  <CategoryRail activeValues={[cat]} onSelect={selectDiscoveryCategory} />
                </div>
              </div>
              <div className="catalog-scroll no-scrollbar min-h-0 flex-1 overflow-y-auto pb-nav">
                <CatalogSections
                  category={cat}
                  onOpenRestaurant={onOpenRestaurant}
                  onOpenVenue={openVenue}
                  onOpenEvent={setEvent}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Модалки — вне шторки, чтобы не обрезались её высотой. */}
      <AnimatePresence>
        {venue && <VenueBookingModal key="venue" venue={venue} onClose={() => setVenue(null)} />}
        {event && <EventTicketModal key="event" event={event} onClose={() => setEvent(null)} />}
        {carWash && <CarWashSheet key="carwash" wash={carWash} onClose={() => setCarWash(null)} />}
      </AnimatePresence>
    </div>
  );
}
