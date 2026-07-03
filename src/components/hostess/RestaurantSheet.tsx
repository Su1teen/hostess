import { useState } from "react";
import { motion } from "framer-motion";
import { X, Star, Clock, MapPin, Minus, Plus, Flame, Utensils, Wine } from "lucide-react";
import { money, friends, type Restaurant } from "@/data/hostess";

const times = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const zones = [
  { key: "hall", label: "Основной зал" },
  { key: "terrace", label: "Терраса" },
  { key: "bar", label: "Бар" },
];

const floorTables = [
  { id: 0, x: 8, y: 8, seats: 2, taken: true },
  { id: 1, x: 28, y: 8, seats: 3, taken: false },
  { id: 2, x: 48, y: 8, seats: 4, taken: false },
  { id: 3, x: 68, y: 8, seats: 2, taken: true },
  { id: 4, x: 85, y: 8, seats: 3, taken: false },
  { id: 5, x: 5, y: 32, seats: 4, taken: true },
  { id: 6, x: 22, y: 35, seats: 2, taken: false },
  { id: 7, x: 42, y: 32, seats: 3, taken: true },
  { id: 8, x: 62, y: 35, seats: 4, taken: false },
  { id: 9, x: 82, y: 32, seats: 2, taken: true },
  { id: 10, x: 5, y: 58, seats: 3, taken: false },
  { id: 11, x: 22, y: 60, seats: 4, taken: true },
  { id: 12, x: 42, y: 58, seats: 2, taken: false },
  { id: 13, x: 62, y: 60, seats: 3, taken: false },
  { id: 14, x: 82, y: 58, seats: 4, taken: false },
  { id: 15, x: 5, y: 82, seats: 2, taken: false },
  { id: 16, x: 22, y: 84, seats: 3, taken: true },
  { id: 17, x: 42, y: 82, seats: 4, taken: true },
  { id: 18, x: 62, y: 84, seats: 2, taken: false },
  { id: 19, x: 82, y: 82, seats: 3, taken: true },
];

export function RestaurantSheet({ r, onClose }: { r: Restaurant; onClose: () => void }) {
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("20:00");
  const [zone, setZone] = useState("hall");
  const [table, setTable] = useState<number | null>(6);
  const [dayIdx, setDayIdx] = useState(0);
  const days = ["Сегодня", "Завтра", "Пт 3", "Сб 4", "Вс 5", "Пн 6", "Вт 7"];

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="absolute inset-0 z-50 overflow-y-auto bg-white pb-32"
    >
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
              <Star className="mr-1 -mt-0.5 inline h-3 w-3 fill-primary text-primary" /> {r.rating}
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
                  <div
                    key={d.id}
                    className="relative flex overflow-hidden rounded-3xl bg-white hairline"
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
                  </div>
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

          {/* Date scroll */}
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {days.map((d, i) => (
              <button
                key={d}
                onClick={() => setDayIdx(i)}
                className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-medium ${
                  dayIdx === i ? "bg-neutral-900 text-white" : "bg-white text-neutral-700 hairline"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Time slots */}
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {times.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-semibold ${
                  time === t ? "bg-primary text-white" : "bg-white text-neutral-800 hairline"
                }`}
              >
                {t}
              </button>
            ))}
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

          {/* Floor plan — realistic absolute positioning */}
          <div className="mt-3 rounded-3xl bg-white p-4 hairline">
            <div className="mb-3 flex items-center justify-between text-[11px] text-neutral-500">
              <span className="font-medium">План зала</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-neutral-300" />
                  Занято
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full border border-primary" />
                  Свободно
                </span>
              </span>
            </div>

            <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-neutral-50">
              {/* Zone markers */}
              <div className="absolute left-[12%] top-[44%] flex h-[14%] w-[22%] items-center justify-center rounded-xl bg-neutral-200/70 text-[10px] font-medium text-neutral-500">
                Бар
              </div>
              <div className="absolute left-[40%] top-[44%] flex h-[14%] w-[22%] items-center justify-center rounded-xl bg-neutral-200/70 text-[10px] font-medium text-neutral-500">
                Сцена
              </div>
              <div className="absolute right-[8%] top-[44%] flex h-[14%] w-[14%] items-center justify-center rounded-xl bg-neutral-200/70 text-[10px] font-medium text-neutral-500">
                WC
              </div>

              {/* Tables with absolute positioning */}
              {floorTables.map((t) => {
                const selected = table === t.id;
                return (
                  <button
                    key={t.id}
                    disabled={t.taken}
                    onClick={() => setTable(t.id)}
                    style={{ left: `${t.x}%`, top: `${t.y}%` }}
                    className={`absolute flex h-9 w-9 flex-col items-center justify-center rounded-full text-[9px] font-semibold transition-all ${
                      t.taken
                        ? "bg-neutral-200 text-neutral-400"
                        : selected
                          ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110"
                          : "border-2 border-primary/60 bg-white text-primary hover:bg-primary/10"
                    }`}
                  >
                    <span className="leading-none">T{t.id + 1}</span>
                    <span className="text-[7px] opacity-70">{t.seats}p</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 px-5">
        <button className="pointer-events-auto flex w-full items-center justify-between rounded-full bg-neutral-900 py-4 pl-6 pr-3 text-white shadow-xl">
          <span className="text-left">
            <span className="block text-[11px] opacity-70">
              {days[dayIdx]} · {time} · {guests} гостей
            </span>
            <span className="text-sm font-semibold">Забронировать T{(table ?? 0) + 1}</span>
          </span>
          <span className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold">Далее</span>
        </button>
      </div>
    </motion.div>
  );
}

export function SplitBillSheet({ onClose }: { onClose: () => void }) {
  const items = [
    { id: 1, name: "Рибай Dry Aged 45 дней", price: 21500, assigned: "А" },
    { id: 2, name: "Тартар из говядины", price: 6900, assigned: "Д" },
    { id: 3, name: "Судак на углях", price: 8900, assigned: "М" },
    { id: 4, name: "Бешбармак", price: 12400, assigned: "Е" },
    { id: 5, name: "Вино Пино Нуар (0.75)", price: 18500, assigned: "все" },
  ];
  const people = [
    { id: "А", name: "Айгерим", avatar: friends[0].avatar, color: "bg-primary" },
    { id: "Д", name: "Данияр", avatar: friends[1].avatar, color: "bg-neutral-900" },
    { id: "М", name: "Мадина", avatar: friends[2].avatar, color: "bg-pink-500" },
    { id: "Е", name: "Ерлан", avatar: friends[3].avatar, color: "bg-emerald-500" },
  ];
  const total = items.reduce((s, i) => s + i.price, 0);
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="absolute inset-0 z-50 overflow-y-auto bg-white pb-32"
    >
      <div className="flex items-center justify-between px-5 pt-14">
        <button
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-widest text-neutral-500">Split bill</p>
          <p className="text-sm font-semibold">Ауыл</p>
        </div>
        <div className="h-10 w-10" />
      </div>

      <div className="px-5 pt-6">
        <p className="text-xs text-neutral-500">Итого к оплате</p>
        <h1 className="text-5xl font-semibold tracking-tight">{money(total)}</h1>

        <div className="mt-5 flex gap-3">
          {people.map((p) => {
            const personalItems = items.filter((i) => i.assigned === p.id);
            const sharedPortion =
              (items.find((i) => i.assigned === "все")?.price ?? 0) / people.length;
            const personTotal = personalItems.reduce((s, i) => s + i.price, 0) + sharedPortion;
            return (
              <div key={p.id} className="flex-1 rounded-2xl bg-neutral-50 p-3 text-center">
                <img
                  src={p.avatar}
                  alt=""
                  className="mx-auto h-10 w-10 rounded-full object-cover ring-2 ring-white"
                />
                <p className="mt-2 text-[11px] text-neutral-500">{p.name}</p>
                <p className="text-sm font-semibold">{money(Math.round(personTotal))}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
            Позиции
          </p>
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 hairline">
              <div className="flex-1">
                <p className="text-sm font-semibold">{it.name}</p>
                <p className="text-xs text-neutral-500">{money(it.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                {it.assigned === "все" ? (
                  <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold text-white">
                    На всех
                  </span>
                ) : (
                  people
                    .filter((p) => p.id === it.assigned)
                    .map((p) => (
                      <img
                        key={p.id}
                        src={p.avatar}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover ring-2 ring-white"
                      />
                    ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-20 z-10 px-5">
        <button className="w-full rounded-full bg-primary py-4 text-sm font-semibold text-white shadow-xl shadow-primary/30">
          Отправить запрос друзьям
        </button>
      </div>
    </motion.div>
  );
}
