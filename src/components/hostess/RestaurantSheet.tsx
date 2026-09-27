import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, MapPin, Receipt, Utensils } from "lucide-react";
import { money, occupancyForId, type Restaurant, type Dish } from "@/data/hostess";
import { hapticSelect } from "@/lib/haptics";
import { FloorPlan } from "./FloorPlan";
import { DishModal } from "./DishModal";
import { WaitlistButton } from "./waitlist/WaitlistButton";
import { VenueStats } from "./VenueStats";
import { FactsRow, VenueDetailShell } from "./VenueDetail";
import { CartLine, CartSheet, MenuSections, SignatureDishes, addPreorder, setPreorderQty } from "./menu";
import { Button, Chip, ListRow, RowGroup, SectionHeader, Stepper, Tabs, Tag, Ticker } from "./system";
import type { BookingPayload, PreorderItem } from "./types";

const times = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const days = ["Сегодня", "Завтра", "Пт 3", "Сб 4", "Вс 5", "Пн 6", "Вт 7"];
const zones = [
  { key: "hall", label: "Основной зал" },
  { key: "vip", label: "VIP" },
  { key: "terrace", label: "Терраса" },
  { key: "bar", label: "Бар" },
  { key: "lounge", label: "Лаунж" },
  { key: "private", label: "Приватный" },
];

type Tab = "book" | "menu" | "about";

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
  return [...r.specials, ...scored.map((s) => s.d)].slice(0, count);
}

const guestWord = (n: number) => (n === 1 ? "гость" : n < 5 ? "гостя" : "гостей");

export function RestaurantSheet({
  r,
  onClose,
  onProceed,
}: {
  r: Restaurant;
  onClose: () => void;
  onProceed: (b: BookingPayload) => void;
}) {
  const [tab, setTab] = useState<Tab>("book");
  const [guests, setGuests] = useState(2);
  const [timeIdx, setTimeIdx] = useState(4);
  const [dayIdx, setDayIdx] = useState(0);
  const [zone, setZone] = useState("hall");
  const [table, setTable] = useState<number | null>(4);
  const [dish, setDish] = useState<Dish | null>(null);
  const [preorder, setPreorder] = useState<PreorderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const time = times[timeIdx];
  const fullyBooked = occupancyForId(`${r.id}-${days[dayIdx]}`) === "busy";
  const takenSlots = new Set(times.filter((t) => occupancyForId(`${r.id}-${days[dayIdx]}-${t}`) === "busy"));
  const preorderCount = preorder.reduce((s, p) => s + p.qty, 0);
  const preorderTotal = preorder.reduce((s, p) => s + p.dish.price * p.qty, 0);
  const qtyOf = (d: Dish) => preorder.find((p) => p.dish.id === d.id)?.qty ?? 0;
  const menuCount = r.menu.reduce((acc, sec) => acc + sec.items.length, 0);

  const changeZone = (z: string) => {
    setZone(z);
    setTable(null);
  };

  const goTab = (t: Tab) => {
    setTab(t);
    const el = tabsRef.current;
    const sc = scrollRef.current;
    if (el && sc && sc.scrollTop > el.offsetTop + 400) sc.scrollTo({ top: el.offsetTop + 300, behavior: "smooth" });
  };

  const proceed = () =>
    onProceed({ restaurant: r, table, day: days[dayIdx], time, guests, preorder });

  return (
    <>
      <VenueDetailShell
        name={r.name}
        images={r.gallery.length ? r.gallery : [r.cover]}
        onClose={onClose}
        scrollRef={scrollRef}
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
                    {table ? `Столик ${table} · ${zones.find((z) => z.key === zone)?.label}` : "Любой столик"}
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
        {/* Essentials */}
        <div className="px-5">
          <p className="t-micro">{r.cuisine}</p>
          <h1 className="t-display mt-2">{r.name}</h1>
          <p className="mt-2.5 flex items-center gap-1.5 text-[14px] text-ink-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            <span className="truncate">
              {r.district}
              {r.address ? ` · ${r.address}` : ""} · {r.distanceKm} км
            </span>
          </p>
          <p className="t-body mt-4 text-ink-2">{r.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {r.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <FactsRow
            facts={[
              { label: "Оценка", value: `★ ${r.rating.toFixed(1)}`, sub: `${r.reviews.toLocaleString("ru-RU")} отзывов` },
              { label: "Средний чек", value: money(r.avgCheck), sub: "на гостя" },
              {
                label: "Сегодня",
                value: r.hours ? `до ${r.hours.split("–")[1]?.trim()}` : "Открыто",
                sub: r.hours ? `с ${r.hours.split("–")[0].trim()}` : undefined,
              },
            ]}
          />
        </div>

        <div className="mt-6 px-5">
          <VenueStats occupancy={r.occupancy} peakHours={r.peakHours} />
        </div>

        {/* Progressive sections */}
        <div ref={tabsRef} className="sticky top-[calc(var(--sat)+58px)] z-10 mt-8 bg-canvas pt-1">
          <Tabs
            id={`venue-${r.id}`}
            value={tab}
            onChange={goTab}
            tabs={[
              { key: "book", label: "Бронь" },
              { key: "menu", label: `Меню · ${menuCount}` },
              { key: "about", label: "О месте" },
            ]}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === "book" && (
              <div className="space-y-8 pt-6">
                <div>
                  <p className="t-micro px-5 pb-3">Когда</p>
                  <div className="rail gap-2">
                    {days.map((d, i) => (
                      <Chip key={d} selected={dayIdx === i} tone="outline" onClick={() => setDayIdx(i)}>
                        {d}
                      </Chip>
                    ))}
                  </div>
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
                    <p className="text-[12px] text-ink-3">
                      {fullyBooked ? "На этот день мест нет" : `${times.length - takenSlots.size} слотов свободно`}
                    </p>
                  </div>
                  {fullyBooked ? (
                    <p className="t-caption rounded-card bg-surface p-4 shadow-hairline">
                      Все столы на {days[dayIdx].toLowerCase()} заняты. Встаньте в лист ожидания — мы сообщим, как
                      только освободится место.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {times.map((t, i) => {
                        const taken = takenSlots.has(t);
                        const on = timeIdx === i;
                        return (
                          <motion.button
                            key={t}
                            type="button"
                            disabled={taken}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => {
                              hapticSelect();
                              setTimeIdx(i);
                            }}
                            className={`t-num h-11 rounded-[14px] text-[14.5px] font-medium transition-colors ${
                              on
                                ? "bg-ink text-white"
                                : taken
                                  ? "bg-transparent text-ink-3 line-through decoration-ink-3/50"
                                  : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--hs-line-strong)]"
                            }`}
                          >
                            {t}
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
                      <Chip key={z.key} selected={zone === z.key} onClick={() => changeZone(z.key)}>
                        {z.label}
                      </Chip>
                    ))}
                  </div>
                  <div className="mx-5 overflow-hidden rounded-card bg-surface p-2 shadow-hairline">
                    <FloorPlan zone={zone} selected={table} onSelect={setTable} />
                  </div>
                </div>
              </div>
            )}

            {tab === "menu" && (
              <div className="pt-6">
                <SectionHeader eyebrow="От шефа" title="Фирменные блюда" />
                <div className="mt-4">
                  <SignatureDishes dishes={pickTopDishes(r)} onOpen={setDish} />
                </div>
                <MenuSections
                  sections={r.menu}
                  qtyOf={qtyOf}
                  onOpen={setDish}
                  onQty={(d, q) => setPreorder((prev) => setPreorderQty(prev, d, q))}
                />
                <p className="t-caption px-5 pt-6">
                  Предзаказ подадут к вашему приходу. Оплата — вместе с бронью.
                </p>
              </div>
            )}

            {tab === "about" && (
              <div className="space-y-6 px-5 pt-6">
                <p className="t-body text-ink-2">{r.description}</p>
                <RowGroup>
                  <ListRow icon={MapPin} title={r.address ?? r.district} subtitle={`${r.district} · ${r.distanceKm} км от вас`} chevron={false} />
                  <ListRow icon={Clock} title={r.hours ?? "Ежедневно"} subtitle="Часы работы" chevron={false} />
                  <ListRow icon={Utensils} title={r.cuisine} subtitle="Кухня" chevron={false} />
                  <ListRow icon={Receipt} title={money(r.avgCheck)} subtitle="Средний чек на гостя" chevron={false} />
                </RowGroup>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </VenueDetailShell>

      <AnimatePresence>
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
