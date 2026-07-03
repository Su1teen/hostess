import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { Search, SlidersHorizontal, Star, Clock } from "lucide-react";
import { ASTANA, MAPBOX_TOKEN, restaurants, type Restaurant } from "@/data/hostess";

mapboxgl.accessToken = MAPBOX_TOKEN;

const filters = ["Рядом", "Ужин", "Завтрак", "Терраса", "Wine bar", "Азия", "Стейк"];

export function MapScreen({ onOpenRestaurant }: { onOpenRestaurant: (r: Restaurant) => void }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [expanded, setExpanded] = useState(false);
  const y = useMotionValue(0);
  const controls = useAnimation();

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
      restaurants.forEach((r) => {
        const el = document.createElement("button");
        el.className =
          "flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-semibold text-neutral-900 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.25)] ring-1 ring-black/5 hover:scale-105 transition";
        el.innerHTML = `<span class="h-1.5 w-1.5 rounded-full bg-[#F97316]"></span>${r.name} · ${r.rating}`;
        el.onclick = () => onOpenRestaurant(r);
        new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([r.coords.lng, r.coords.lat])
          .addTo(map);
      });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [onOpenRestaurant]);

  const toggle = (next: boolean) => {
    setExpanded(next);
    controls.start({ y: next ? -380 : 0, transition: { type: "spring", stiffness: 260, damping: 30 } });
  };

  return (
    <div className="relative h-full w-full bg-neutral-100">
      <div ref={mapNode} className="absolute inset-0" />

      {/* Top overlay */}
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
      </div>

      {/* Bottom sheet */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -420, bottom: 0 }}
        dragElastic={0.15}
        style={{ y }}
        animate={controls}
        onDragEnd={(_, info) => toggle(info.offset.y < -60 || (expanded && info.offset.y < 60))}
        className="absolute inset-x-0 bottom-0 z-20 rounded-t-[28px] bg-white shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.25)]"
        initial={{ y: 0 }}
      >
        <div className="flex justify-center pt-2.5">
          <div className="h-1.5 w-10 rounded-full bg-neutral-300" />
        </div>

        <div className="px-4 pb-3 pt-3">
          <button
            onClick={() => toggle(!expanded)}
            className="flex w-full items-center gap-3 rounded-2xl bg-neutral-100 px-4 py-3 text-left"
          >
            <Search className="h-5 w-5 text-neutral-500" />
            <span className="flex-1 text-sm text-neutral-500">Найти ресторан, кухню, блюдо…</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white shadow-sm">
              <SlidersHorizontal className="h-4 w-4 text-neutral-700" />
            </span>
          </button>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {filters.map((f, i) => (
              <button
                key={f}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium ${
                  i === 0
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700"
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
                  <img src={r.cover} alt={r.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    <Star className="h-3 w-3 fill-white" /> {r.rating}
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-neutral-900 backdrop-blur">
                    {r.distanceKm} км
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[15px] font-semibold text-neutral-900">{r.name}</p>
                  <p className="text-xs text-neutral-500">{r.cuisine} · {r.district}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-600">
                    <Clock className="h-3 w-3" />
                    Свободно сегодня
                    <span className="ml-auto font-semibold text-primary">от {(r.avgCheck/1000).toFixed(0)}k ₸</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {expanded && (
            <div className="space-y-3 px-4">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onOpenRestaurant(r)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-2 text-left hairline"
                >
                  <img src={r.cover} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-neutral-500">{r.cuisine}</p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-600">
                      <Star className="h-3 w-3 fill-primary text-primary" /> {r.rating}
                      <span>· {r.reviews} отз.</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-neutral-500">
                    <p>{r.distanceKm} км</p>
                    <p className="font-semibold text-neutral-900">~{(r.avgCheck/1000).toFixed(0)}k</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
