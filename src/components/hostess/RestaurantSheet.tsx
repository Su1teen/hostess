import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Star, Clock, MapPin, Minus, Plus, Flame, Utensils, Wine } from "lucide-react";
import { money, occupancyForId, type Restaurant, type Dish } from "@/data/hostess";
import { FloorPlan } from "./FloorPlan";
import { WheelPicker } from "./WheelPicker";
import { DishModal } from "./DishModal";
import { WaitlistButton } from "./waitlist/WaitlistButton";
import type { BookingPayload, PreorderItem } from "./types";

const times = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const days = ["Сегодня", "Завтра", "Пт 3", "Сб 4", "Вс 5", "Пн 6", "Вт 7"];
const zones = [
  { key: "hall", label: "Основной зал" },
  { key: "terrace", label: "Терраса" },
  { key: "bar", label: "Бар" },
];

export function RestaurantSheet({
  r,
  onClose,
  onProceed,
}: {
  r: Restaurant;
  onClose: () => void;
  onProceed: (b: BookingPayload) => void;
}) {
  const [guests, setGuests] = useState(2);
  const [timeIdx, setTimeIdx] = useState(4);
  const [zone, setZone] = useState("hall");
  const [table, setTable] = useState<number | null>(4);
  const [dayIdx, setDayIdx] = useState(0);
  const [dish, setDish] = useState<Dish | null>(null);
  const [preorder, setPreorder] = useState<PreorderItem[]>([]);
  const time = times[timeIdx];
  // Демо-логика «всё занято»: часть комбинаций день+заведение полностью заняты.
  const fullyBooked = occupancyForId(`${r.id}-${days[dayIdx]}`) === "busy";

  const addToPreorder = (d: Dish, qty: number) =>
    setPreorder((prev) => {
      const found = prev.find((p) => p.dish.id === d.id);
      if (found) {
        return prev.map((p) => (p.dish.id === d.id ? { ...p, qty: p.qty + qty } : p));
      }
      return [...prev, { dish: d, qty }];
    });

  const preorderCount = preorder.reduce((s, p) => s + p.qty, 0);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="absolute inset-0 z-[100] flex flex-col bg-white"
    >
      <div className="flex-1 overflow-y-auto pb-[170px]">
        {/* Hero */}
        <div className="relative h-72 w-full">
          <img src={r.cover} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white" />
          <button
            onClick={onClose}
            className="absolute left-4 top-14 grid h-10 w-10 place-items-center rounded-full bg-white/90 backdrop-blur"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Story dots */}
          <div className="absolute inset-x-0 top-12 flex justify-center gap-1 px-4">
            {r.gallery.map((_, i) => (
              <span
                key={i}
                className={`h-0.5 flex-1 max-w-16 rounded-full ${i === 0 ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
          <div className="absolute inset-x-5 bottom-6 text-white">
            <div className="flex items-center gap-2">
              <span className="glass rounded-full px-2.5 py-1 text-[11px] font-semibold text-neutral-900">
                <Star className="mr-1 -mt-0.5 inline h-3 w-3 fill-primary text-primary" />{" "}
                {r.rating}
              </span>
              <span className="text-xs opacity-90">· {r.reviews} отзывов</span>
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{r.name}</h1>
            <p className="text-sm opacity-90">
              {r.cuisine} · {r.district}
            </p>
          </div>
        </div>

        <div className="px-5">
          {/* Info chips */}
          <div className="no-scrollbar -mt-2 flex gap-2 overflow-x-auto pb-4">
            {r.tags.map((t) => (
              <span
                key={t}
                className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700"
              >
                {t}
              </span>
            ))}
            <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700">
              Средний чек ~{(r.avgCheck / 1000).toFixed(0)}k ₸
            </span>
          </div>

          <p className="text-sm leading-relaxed text-neutral-600">{r.description}</p>

          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-2xl bg-neutral-50 text-center">
            <div className="p-3">
              <Clock className="mx-auto h-4 w-4 text-neutral-500" />
              <p className="mt-1 text-[11px] text-neutral-500">Открыто</p>
              <p className="text-xs font-semibold">до 01:00</p>
            </div>
            <div className="border-x border-white p-3">
              <MapPin className="mx-auto h-4 w-4 text-neutral-500" />
              <p className="mt-1 text-[11px] text-neutral-500">Расстояние</p>
              <p className="text-xs font-semibold">{r.distanceKm} км</p>
            </div>
            <div className="p-3">
              <Wine className="mx-auto h-4 w-4 text-neutral-500" />
              <p className="mt-1 text-[11px] text-neutral-500">Винная карта</p>
              <p className="text-xs font-semibold">120+</p>
            </div>
          </div>

          {/* Specials */}
          {r.specials.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
                <Flame className="h-4 w-4 text-primary" /> Specials
              </h3>
              <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
                {r.specials.map((s) => (
                  <div
                    key={s.id}
                    className="relative w-64 shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#EA580C] p-4 text-white"
                  >
                    <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
                      {s.special}
                    </span>
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight">{s.name}</p>
                        <p className="mt-1 text-[11px] opacity-80">{s.desc}</p>
                        <p className="mt-3 text-lg font-semibold">{money(s.price)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menu */}
          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
              <Utensils className="h-4 w-4" /> Меню
            </h3>
            {r.menu.map((sec) => (
              <div key={sec.section} className="mb-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                  {sec.section}
                </p>
                <div className="space-y-3">
                  {sec.items.map((d) => (
                    <motion.button
                      key={d.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDish(d)}
                      className="relative flex w-full overflow-hidden rounded-3xl bg-white text-left shadow-soft"
                    >
                      <div className="min-w-0 flex-1 p-4">
                        <p className="text-[15px] font-semibold leading-tight">{d.name}</p>
                        <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{d.desc}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {d.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="mt-3 text-lg font-semibold text-primary">{money(d.price)}</p>
                      </div>
                      <div className="relative w-32 shrink-0">
                        <img
                          src={d.image}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                          {d.weight} г
                        </span>
                        <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-900 backdrop-blur">
                          <Flame className="mr-0.5 -mt-0.5 inline h-2.5 w-2.5 text-primary" />
                          {d.kcal} ккал
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Booking flow */}
          <div className="mt-4 rounded-3xl bg-neutral-50 p-4">
            <h3 className="mb-3 text-[15px] font-semibold">Бронирование</h3>

            {/* Guests */}
            <div className="flex items-center justify-between rounded-2xl bg-white p-3 hairline">
              <div>
                <p className="text-xs text-neutral-500">Гостей</p>
                <p className="text-sm font-semibold">{guests} человек</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{guests}</span>
                <button
                  onClick={() => setGuests(Math.min(20, guests + 1))}
                  className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Дата + время: iOS-барабаны */}
            <div className="mt-3 rounded-2xl bg-white p-3 shadow-soft">
              <div className="flex divide-x divide-neutral-100">
                <WheelPicker label="Дата" options={days} value={dayIdx} onChange={setDayIdx} />
                <WheelPicker label="Время" options={times} value={timeIdx} onChange={setTimeIdx} />
              </div>
            </div>

            {/* Zones */}
            <div className="mt-3 flex gap-2">
              {zones.map((z) => (
                <button
                  key={z.key}
                  onClick={() => setZone(z.key)}
                  className={`flex-1 rounded-2xl px-3 py-2.5 text-xs font-medium ${
                    zone === z.key
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-800 hairline"
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>

            {/* Floor plan — realistic interactive layout */}
            <div className="mt-3">
              <FloorPlan selected={table} onSelect={setTable} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating CTA — pinned above the global navbar.
          Если на выбранный день всё занято — вместо брони «Встать в очередь». */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[100px] z-40 px-5">
        {fullyBooked ? (
          <div className="pointer-events-auto">
            <WaitlistButton
              input={{
                entityId: r.id,
                entityName: r.name,
                entityKind: "Ресторан",
                cover: r.cover,
                resource: `Столик на ${guests}`,
                peopleAhead: 4,
                etaMin: 25,
              }}
            />
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              onProceed({
                restaurant: r,
                table,
                day: days[dayIdx],
                time,
                guests,
                preorder,
              })
            }
            className="pointer-events-auto flex w-full items-center justify-between rounded-full bg-neutral-900 py-4 pl-6 pr-3 text-white shadow-float"
          >
            <span className="text-left">
              <span className="block text-[11px] opacity-70">
                {days[dayIdx]} · {time} · {guests} гостей
                {preorderCount > 0 && ` · предзаказ ${preorderCount}`}
              </span>
              <span className="text-sm font-semibold">
                {table ? `Забронировать T${table}` : "Выберите столик"}
              </span>
            </span>
            <span className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold">Далее</span>
          </motion.button>
        )}
      </div>

      {/* Drill-down: детальная карточка блюда */}
      <AnimatePresence>
        {dish && <DishModal dish={dish} onClose={() => setDish(null)} onAdd={addToPreorder} />}
      </AnimatePresence>
    </motion.div>
  );
}
