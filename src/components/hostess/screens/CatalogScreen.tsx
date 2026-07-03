import { Star, Flame, TrendingUp } from "lucide-react";
import { restaurants, money, type Restaurant } from "@/data/hostess";
import { motion } from "framer-motion";

const categories = [
  { key: "all", label: "Всё", emoji: "✨" },
  { key: "kaz", label: "Казахская", emoji: "🇰🇿" },
  { key: "steak", label: "Стейки", emoji: "🥩" },
  { key: "asia", label: "Азия", emoji: "🍜" },
  { key: "wine", label: "Wine", emoji: "🍷" },
  { key: "bfast", label: "Завтраки", emoji: "🥐" },
];

export function CatalogScreen({ onOpenRestaurant }: { onOpenRestaurant: (r: Restaurant) => void }) {
  return (
    <div className="h-full overflow-y-auto bg-white pb-32">
      <div className="sticky top-0 z-10 bg-white/85 px-5 pb-3 pt-14 backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">Каталог</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Лучшие места <span className="italic text-neutral-500" style={{ fontFamily: "var(--font-display)" }}>Астаны</span>
        </h1>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-5 pb-2">
        {categories.map((c, i) => (
          <button
            key={c.key}
            className={`flex shrink-0 items-center gap-2 rounded-full py-2 pl-1.5 pr-4 text-sm ${
              i === 0 ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800"
            }`}
          >
            <span className={`grid h-8 w-8 place-items-center rounded-full ${i === 0 ? "bg-white text-base" : "bg-white text-base"}`}>
              {c.emoji}
            </span>
            <span className="font-medium">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Editor's pick — big card */}
      <div className="px-5 pt-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
          <Flame className="h-3.5 w-3.5 text-primary" /> Выбор редакции
        </p>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpenRestaurant(restaurants[0])}
          className="relative h-72 w-full overflow-hidden rounded-3xl text-left"
        >
          <img src={restaurants[0].cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white">Новое</span>
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

      {/* Trending row */}
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
              className="w-[220px] shrink-0 overflow-hidden rounded-3xl bg-white text-left hairline"
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
                <p className="mt-1 text-[11px] font-semibold text-primary">от {money(r.avgCheck)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3 px-5">
        <h3 className="pb-1 text-[15px] font-semibold text-neutral-900">Все заведения</h3>
        {restaurants.map((r) => (
          <button
            key={r.id}
            onClick={() => onOpenRestaurant(r)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-2 text-left hairline"
          >
            <img src={r.cover} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.name}</p>
              <p className="truncate text-xs text-neutral-500">{r.cuisine} · {r.district}</p>
              <div className="mt-1.5 flex gap-1">
                {r.tags.slice(0, 2).map((t) => (
                  <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">{t}</span>
                ))}
              </div>
            </div>
            <div className="text-right text-[11px] text-neutral-500">
              <p className="flex items-center gap-0.5 justify-end"><Star className="h-3 w-3 fill-primary text-primary" />{r.rating}</p>
              <p className="mt-0.5 font-semibold text-neutral-900">~{(r.avgCheck/1000).toFixed(0)}k ₸</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
