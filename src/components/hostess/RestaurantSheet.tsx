import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { money, type Restaurant, type Dish } from "@/data/hostess";
import { hapticSelect } from "@/lib/haptics";
import { FloorPlan } from "./FloorPlan";
import { DishModal } from "./DishModal";
import { WaitlistButton } from "./waitlist/WaitlistButton";
import { LiveNow } from "./VenueStats";
import { VenueDetailShell } from "./VenueDetail";
import { CartLine, CartSheet, MenuSheet, MenuTeaser, addPreorder, setPreorderQty } from "./menu";
import { Rating } from "./cards";
import { Button, Chip, Stepper, Tag, Ticker } from "./system";
import { occupancyOf, tableSlots } from "./venue";
import type { BookingPayload, PreorderItem } from "./types";

const days = ["Сегодня", "Завтра", "Пт 3", "Сб 4", "Вс 5", "Пн 6", "Вт 7"];
const zones = [
  { key: "hall", label: "Основной зал" },
  { key: "vip", label: "VIP" },
  { key: "terrace", label: "Терраса" },
  { key: "bar", label: "Бар" },
  { key: "lounge", label: "Лаунж" },
  { key: "private", label: "Приватный" },
];

function pickTopDishes(r: Restaurant, count = 4): Dish[] {
  const all = r.menu.flatMap((sec) => sec.items);
  const scored = all.map((d) => {
    let score = 0;
    if (d.special) score += 3;
    if (d.tags.some((t) => /хит|hot|🔥|✨/.test(t))) score += 2;
    if (d.tags.some((t) => /new|новинка/.test(t))) score += 1;
    return { d, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  return [...r.specials, ...scored.map((s) => s.d)].filter((d) => !seen.has(d.id) && seen.add(d.id)).slice(0, count);
}

const guestWord = (n: number) => (n === 1 ? "гость" : n < 5 ? "гостя" : "гостей");

/**
 * Venue detail — cinematic live hero → identity → "now" → today's tables →
 * booking → collapsed menu → details. One primary action, docked.
 */
export function RestaurantSheet({
  r,
  onClose,
  onProceed,
}: {
  r: Restaurant;
  onClose: () => void;
  onProceed: (b: BookingPayload) => void;
}) {
  const occupancy = occupancyOf(r.id);
  const [dayIdx, setDayIdx] = useState(0);
  const slots = useMemo(() => tableSlots(r.id, occupancy, dayIdx), [r.id, occupancy, dayIdx]);
  const firstFree = Math.max(0, slots.findIndex((s) => !s.taken));
  const [guests, setGuests] = useState(2);
  const [timeIdx, setTimeIdx] = useState(firstFree);
  const [zone, setZone] = useState("hall");
  const [table, setTable] = useState<number | null>(4);
  const [dish, setDish] = useState<Dish | null>(null);
  const [preorder, setPreorder] = useState<PreorderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreText, setMoreText] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  const fullyBooked = slots.every((s) => s.taken);
  const freeCount = slots.filter((s) => !s.taken).length;
  const slot = slots[timeIdx]?.taken ? slots[firstFree] : slots[timeIdx];
  const time = slot?.time ?? slots[0].time;
  const todayFree = useMemo(() => tableSlots(r.id, occupancy, 0).filter((s) => !s.taken), [r.id, occupancy]);

  const preorderCount = preorder.reduce((s, p) => s + p.qty, 0);
  const preorderTotal = preorder.reduce((s, p) => s + p.dish.price * p.qty, 0);
  const qtyOf = (d: Dish) => preorder.find((p) => p.dish.id === d.id)?.qty ?? 0;
  const allDishes = r.menu.flatMap((sec) => sec.items);
  const fromPrice = Math.min(...allDishes.map((d) => d.price));
  const signatures = pickTopDishes(r);

  const changeDay = (i: number) => {
    setDayIdx(i);
    const next = tableSlots(r.id, occupancy, i);
    setTimeIdx(Math.max(0, next.findIndex((s) => !s.taken)));
  };

  const pickToday = (t: string) => {
    hapticSelect();
    setDayIdx(0);
    setTimeIdx(Math.max(0, tableSlots(r.id, occupancy, 0).findIndex((s) => s.time === t)));
    const sc = scrollRef.current;
    const el = bookRef.current;
    if (sc && el) sc.scrollTo({ top: el.offsetTop + 260, behavior: "smooth" });
  };

  const proceed = () => onProceed({ restaurant: r, table, day: days[dayIdx], time, guests, preorder });

  return (
    <>
      <VenueDetailShell
        name={r.name}
        images={r.gallery.length ? r.gallery : [r.cover]}
        onClose={onClose}
        scrollRef={scrollRef}
        live={r.live}
        dock={
          <>
            <CartLine count={preorderCount} total={preorderTotal} onOpen={() => setCartOpen(true)} />
            {fullyBooked ? (
              <WaitlistButton
                input={{
                  entityId: r.id,
                  entityName: r.name,
                  entityKind: "Ресторан",
                  cover: r.cover,
                  resource: `Столик на ${guests} · ${days[dayIdx]}`,
                  peopleAhead: 4,
                  etaMin: 25,
                }}
              />
            ) : (
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="t-num truncate text-[12.5px] text-ink-3">
                    {days[dayIdx]} · {time} · {guests} {guestWord(guests)}
                  </p>
                  <p className="truncate text-[16px] font-semibold tracking-[-0.015em]">
                    {table ? `Стол ${table} · ${zones.find((z) => z.key === zone)?.label}` : "Любой стол"}
                  </p>
                </div>
                <Button size="lg" onClick={proceed} className="px-7">
                  Забронировать
                </Button>
              </div>
            )}
          </>
        }
      >
        {/* Identity */}
        <div className="px-5">
          <p className="t-micro">{r.cuisine}</p>
          <h1 className="t-display mt-2">{r.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-[14px] text-ink-2">
            <Rating value={r.rating} className="text-[14px]" />
            <span className="t-num text-ink-3">{r.reviews.toLocaleString("ru-RU")} отзывов</span>
            <span className="text-ink-3">·</span>
            <span className="t-num">~{money(r.avgCheck)}</span>
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[14px] text-ink-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            <span className="truncate">
              {r.address ?? r.district} · {r.distanceKm} км
            </span>
          </p>
        </div>

        {/* Now */}
        <LiveNow id={r.id} occupancy={occupancy} peakHours={r.peakHours} className="mx-5 mt-6" />

        {/* Today's availability */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between px-5 pb-3">
            <p className="text-[15px] font-semibold tracking-[-0.012em]">Столы сегодня</p>
            <p className="t-num text-[12.5px] text-ink-3">
              {todayFree.length ? `${todayFree.length} из ${slots.length} слотов` : "мест нет"}
            </p>
          </div>
          {todayFree.length ? (
            <div className="rail gap-2">
              {todayFree.map((s) => (
                <motion.button
                  key={s.time}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => pickToday(s.time)}
                  className={`t-num h-10 shrink-0 snap-start rounded-[12px] px-4 text-[14.5px] font-medium transition-colors ${
                    dayIdx === 0 && time === s.time
                      ? "bg-ink text-white"
                      : "bg-white text-ink shadow-[inset_0_0_0_1px_var(--hs-line-strong)]"
                  }`}
                >
                  {s.time}
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="t-caption px-5">Сегодня всё занято — лист ожидания сообщит, как только стол освободится.</p>
          )}
        </div>

        {/* Story */}
        <div className="mt-8 px-5">
          <p className={`t-body text-ink-2 ${moreText ? "" : "line-clamp-3"}`}>{r.description}</p>
          {!moreText && (
            <button type="button" onClick={() => setMoreText(true)} className="mt-1 text-[14px] font-medium text-ink">
              Читать дальше
            </button>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {r.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        {/* Booking */}
        <section ref={bookRef} className="mt-12 space-y-7">
          <h2 className="t-headline px-5">Бронирование</h2>
          <div className="rail gap-2">
            {days.map((d, i) => (
              <Chip key={d} selected={dayIdx === i} tone="outline" onClick={() => changeDay(i)}>
                {d}
              </Chip>
            ))}
          </div>

          <div className="flex items-center justify-between px-5">
            <div>
              <p className="t-micro">Гости</p>
              <p className="mt-1.5 text-[15px]">
                <Ticker value={guests} /> {guestWord(guests)}
              </p>
            </div>
            <Stepper value={guests} onChange={setGuests} min={1} max={20} />
          </div>

          <div className="px-5">
            <div className="flex items-baseline justify-between pb-3">
              <p className="t-micro">Время</p>
              <p className="t-num text-[12px] text-ink-3">
                {fullyBooked ? "На этот день мест нет" : `${freeCount} свободно`}
              </p>
            </div>
            {fullyBooked ? (
              <p className="t-caption border-y border-line py-4">
                Все столы на {days[dayIdx].toLowerCase()} заняты. Встаньте в лист ожидания — мы сообщим, как только
                освободится место.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s, i) => {
                  const on = time === s.time && !s.taken;
                  return (
                    <motion.button
                      key={s.time}
                      type="button"
                      disabled={s.taken}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        hapticSelect();
                        setTimeIdx(i);
                      }}
                      className={`t-num h-11 rounded-[12px] text-[14.5px] font-medium transition-colors ${
                        on
                          ? "bg-ink text-white"
                          : s.taken
                            ? "bg-stone text-ink-3/70 line-through decoration-ink-3/40"
                            : "bg-white text-ink shadow-[inset_0_0_0_1px_var(--hs-line-strong)]"
                      }`}
                    >
                      {s.time}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between px-5 pb-3">
              <p className="t-micro">Зона и стол</p>
              <p className="text-[12px] text-ink-3">{table ? `Выбран стол ${table}` : "Любой стол"}</p>
            </div>
            <div className="rail gap-2 pb-3">
              {zones.map((z) => (
                <Chip
                  key={z.key}
                  selected={zone === z.key}
                  onClick={() => {
                    setZone(z.key);
                    setTable(null);
                  }}
                >
                  {z.label}
                </Chip>
              ))}
            </div>
            <div className="px-5">
              <FloorPlan zone={zone} selected={table} onSelect={setTable} />
            </div>
          </div>
        </section>

        {/* Menu — collapsed by default */}
        <MenuTeaser
          className="mt-12"
          count={allDishes.length}
          fromPrice={fromPrice}
          dishes={signatures}
          onOpen={() => setMenuOpen(true)}
        />

        {/* Details */}
        <section className="mt-12 px-5">
          <h2 className="t-headline">О месте</h2>
          <dl className="divide-hairline mt-3 border-y border-line">
            {[
              ["Адрес", r.address ?? r.district],
              ["Часы", r.hours ?? "Ежедневно"],
              ["Кухня", r.cuisine],
              ["Средний чек", `${money(r.avgCheck)} на гостя`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="text-[14px] text-ink-3">{k}</dt>
                <dd className="t-num truncate text-right text-[14.5px]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </VenueDetailShell>

      <AnimatePresence>
        {menuOpen && (
          <MenuSheet
            key="menu"
            title={r.name}
            sections={r.menu}
            signatures={signatures}
            qtyOf={qtyOf}
            onOpenDish={setDish}
            onQty={(d, q) => setPreorder((prev) => setPreorderQty(prev, d, q))}
            cartCount={preorderCount}
            cartTotal={preorderTotal}
            onClose={() => setMenuOpen(false)}
          />
        )}
        {dish && (
          <DishModal
            key="dish"
            dish={dish}
            onClose={() => setDish(null)}
            onAdd={(d, q) => setPreorder((prev) => addPreorder(prev, d, q))}
          />
        )}
        {cartOpen && (
          <CartSheet
            key="cart"
            items={preorder}
            onQty={(d, q) => setPreorder((prev) => setPreorderQty(prev, d, q))}
            onClose={() => setCartOpen(false)}
            footer={
              <Button block size="lg" onClick={() => setCartOpen(false)}>
                Готово
              </Button>
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}
