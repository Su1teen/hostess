import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, Flame, TrendingUp, Clock, Ticket } from "lucide-react";
import {
  restaurants,
  venues,
  cityEvents,
  stories,
  categories,
  money,
  type Restaurant,
  type Venue,
  type CityEvent,
  type Story,
} from "@/data/hostess";
import { useTheme, categoryToTheme } from "@/components/hostess/ThemeProvider";
import { StoryViewer } from "@/components/hostess/StoryViewer";
import { VenueBookingModal } from "@/components/hostess/VenueBookingModal";
import { EventTicketModal } from "@/components/hostess/EventTicketModal";

const hotDeals: Record<string, string> = {
  nedelka: "−30% на ближайший час",
  sadu: "−25% до 19:00",
};

const fullyBooked = ["sadu"];

export function CatalogScreen({ onOpenRestaurant }: { onOpenRestaurant: (r: Restaurant) => void }) {
  const [cat, setCat] = useState("food");
  const [story, setStory] = useState<Story | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [event, setEvent] = useState<CityEvent | null>(null);

  // Динамическая тема: переключается при смене категории.
  const { setTheme } = useTheme();
  const handleCategoryChange = useCallback(
    (category: string) => {
      setCat(category);
      setTheme(categoryToTheme(category));
    },
    [setTheme],
  );

  // Bugfix: фильтр по категории — при cat=food не показываем все venues.
  const catVenues = venues.filter((v) => v.category === cat);

  return (
    <div className="h-full overflow-y-auto bg-white pb-[140px]">
      <div className="px-5 pb-3 pt-14">
        <p className="section-subtitle">Городской хаб</p>
      </div>

      {/* ── Истории друзей ──────────────────────────────────────────── */}
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

      {/* ── Категории ──────────────────────────────────────────────── */}
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

      {/* ── Афиша выходных ──────────────────────────────────────────── */}
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
              <img src={e.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
          {/* ── Выбор редакции ────────────────────────────────────────── */}
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

          {/* ── Сейчас популярны ──────────────────────────────────────── */}
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
                    {hotDeals[r.id] && (
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg shadow-neutral-900/30">
                        <Flame className="h-3 w-3" />
                        {hotDeals[r.id]}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-neutral-500">{r.cuisine}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-neutral-900">
                        от {money(r.avgCheck)}
                      </p>
                      {fullyBooked.includes(r.id) && (
                        <span className="flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] font-semibold text-white">
                          <Clock className="h-2.5 w-2.5" /> Очередь
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Все рестораны ──────────────────────────────────────────── */}
          <div className="mt-6 space-y-3 px-5">
            <h3 className="section-title pb-1">Все рестораны</h3>
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpenRestaurant(r)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-2 text-left shadow-soft"
              >
                <div className="relative">
                  <img src={r.cover} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                  {hotDeals[r.id] && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white shadow">
                      <Flame className="h-3 w-3" />
                    </div>
                  )}
                </div>
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
                  {hotDeals[r.id] && (
                    <p className="mt-1 text-[10px] font-semibold text-neutral-900">
                      {hotDeals[r.id]}
                    </p>
                  )}
                </div>
                <div className="text-right text-[11px] text-neutral-500">
                  <p className="flex items-center justify-end gap-0.5">
                    <Star className="h-3 w-3 fill-neutral-900 text-neutral-900" />
                    {r.rating}
                  </p>
                  <p className="mt-0.5 font-semibold text-neutral-900">
                    ~{(r.avgCheck / 1000).toFixed(0)}k ₸
                  </p>
                  {fullyBooked.includes(r.id) ? (
                    <span className="mt-1 inline-block rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] font-semibold text-white">
                      Встать в очередь
                    </span>
                  ) : (
                    <span className="mt-1 inline-block rounded-full bg-neutral-900/10 px-2 py-0.5 text-[9px] font-semibold text-neutral-900">
                      Свободно
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* ── Другие категории ────────────────────────────────────────── */
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
              onClick={() => setVenue(v)}
              className="w-full overflow-hidden rounded-3xl bg-white text-left shadow-soft"
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
                  <p className="text-xs font-semibold text-neutral-900">от {money(v.priceFrom)}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Модалки (переиспользуемые компоненты) */}
      <AnimatePresence>
        {story && <StoryViewer key="story" story={story} onClose={() => setStory(null)} />}
        {venue && <VenueBookingModal key="venue" venue={venue} onClose={() => setVenue(null)} />}
        {event && <EventTicketModal key="event" event={event} onClose={() => setEvent(null)} />}
      </AnimatePresence>
    </div>
  );
}
