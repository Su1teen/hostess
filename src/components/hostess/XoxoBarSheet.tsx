import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Receipt, ShoppingBag, UserRound } from "lucide-react";
import { toast } from "sonner";
import { money, type Restaurant, type Dish } from "@/data/hostess";
import { addXoxoOrder, addXoxoVisit, readXoxoAccount, xoxoCashback } from "@/lib/xoxo-loyalty";
import { findXoxoExchangeProduct, useXoxoExchange } from "@/hooks/useXoxoExchange";
import { hapticSuccess } from "@/lib/haptics";
import { Switch } from "@/components/ui/switch";
import { DishModal } from "./DishModal";
import { VenueStats } from "./VenueStats";
import { FactsRow, VenueDetailShell } from "./VenueDetail";
import { CartLine, CartSheet, MenuSections, SignatureDishes, addPreorder, setPreorderQty } from "./menu";
import {
  BottomSheet,
  Button,
  Chip,
  EmptyState,
  IconButton,
  LiveDot,
  SectionHeader,
  Stepper,
  SuccessMark,
  Tabs,
  Tag,
} from "./system";
import type { PreorderItem } from "./types";
import { cn } from "@/lib/utils";

/* ── Helpers ──────────────────────────────────────────────────────── */

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  let r = "+7";
  if (digits.length > 1) r += " (" + digits.slice(1, 4);
  if (digits.length >= 4) r += ") ";
  if (digits.length > 4) r += digits.slice(4, 7);
  if (digits.length > 7) r += "-" + digits.slice(7, 9);
  if (digits.length > 9) r += "-" + digits.slice(9, 11);
  return r;
}

function isPhoneValid(formatted: string): boolean {
  const digits = formatted.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("77");
}

function isTimeInRange(timeStr: string): boolean {
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return false;
  // 17:00–23:59 OR 00:00–04:00
  return (h >= 17 && h <= 23) || (h >= 0 && h <= 3) || (h === 4 && m === 0);
}

function guestLabel(n: number): string {
  if (n === 1) return "1 место";
  if (n >= 2 && n <= 4) return `${n} места`;
  return `${n} мест`;
}

type Tab = "menu" | "book";

/* ── Component ────────────────────────────────────────────────────── */

export function XoxoBarSheet({ r, onClose }: { r: Restaurant; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("menu");

  /* ── Menu + live exchange ── */
  const [activeCategory, setActiveCategory] = useState("Все");
  const [dish, setDish] = useState<Dish | null>(null);
  const exchange = useXoxoExchange();
  const liveProduct = (item: Dish) => findXoxoExchangeProduct(item.name, exchange.products);
  const priceOf = (item: Dish) => liveProduct(item)?.price ?? item.price;
  const menuCount = r.menu.reduce((acc, sec) => acc + sec.items.length, 0);
  const filteredSections =
    activeCategory === "Все" ? r.menu : r.menu.filter((sec) => sec.section === activeCategory);
  const signature = r.menu
    .flatMap((sec) => sec.items)
    .filter((d) => d.image.startsWith("/image/"))
    .slice(0, 6);

  /* ── Preorder ── */
  const [preorder, setPreorder] = useState<PreorderItem[]>([]);
  const [preorderEnabled, setPreorderEnabled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [account, setAccount] = useState(readXoxoAccount);
  const [accountOpen, setAccountOpen] = useState(false);

  const addToPreorder = useCallback((d: Dish, qty: number) => {
    setPreorder((prev) => addPreorder(prev, d, qty));
    setPreorderEnabled(true);
  }, []);
  const changeQty = (d: Dish, qty: number) => {
    setPreorder((prev) => setPreorderQty(prev, d, qty));
    if (qty > 0) setPreorderEnabled(true);
  };
  const qtyOf = (d: Dish) => preorder.find((p) => p.dish.id === d.id)?.qty ?? 0;
  const preorderCount = preorder.reduce((s, p) => s + p.qty, 0);
  const preorderTotal = preorder.reduce((s, p) => s + priceOf(p.dish) * p.qty, 0);
  const orderItems = () =>
    preorder.map(({ dish: item, qty }) => ({ name: item.name, quantity: qty, price: priceOf(item) }));

  const purchaseNow = () => {
    if (!preorder.length) return;
    hapticSuccess();
    setAccount(addXoxoOrder("Покупка", orderItems()));
    setPreorder([]);
    setPreorderEnabled(false);
    setCartOpen(false);
    toast.success(`Покупка записана · кэшбэк ${money(Math.round(preorderTotal * 0.05))}`);
  };

  /* ── Booking form ── */
  const [name, setName] = useState("Султан");
  const [phone, setPhone] = useState("+7 (701) 000-00-00");
  const [phoneError, setPhoneError] = useState("");
  const [guests, setGuests] = useState(3);
  const [time, setTime] = useState("23:00");
  const [timeError, setTimeError] = useState("");
  const [booked, setBooked] = useState(false);

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhone(val);
    setPhone(formatted);
    setPhoneError(formatted.length > 0 && !isPhoneValid(formatted) ? "Формат: +7 (7XX) XXX-XX-XX" : "");
  };

  const handleTimeChange = (val: string) => {
    setTime(val);
    setTimeError(val && !isTimeInRange(val) ? "Заведение закрыто в это время" : "");
  };

  const goTab = (t: Tab) => {
    setTab(t);
    const el = tabsRef.current;
    const sc = scrollRef.current;
    if (el && sc) sc.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
  };

  const handleSubmit = () => {
    let hasError = !name.trim();
    if (!isPhoneValid(phone)) {
      setPhoneError("Формат: +7 (7XX) XXX-XX-XX");
      hasError = true;
    }
    if (!isTimeInRange(time)) {
      setTimeError("Заведение закрыто в это время");
      hasError = true;
    }
    if (hasError) {
      if (tab !== "book") goTab("book");
      return;
    }
    let next = addXoxoVisit(guests, time);
    if (preorderEnabled && preorder.length) next = addXoxoOrder("Предзаказ", orderItems());
    setAccount(next);
    setBooked(true);
    hapticSuccess();
    toast.success("Бронь подтверждена");
  };

  const updated = exchange.updatedAt
    ? new Date(exchange.updatedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : null;

  const priceMeta = (d: Dish) => {
    const p = liveProduct(d);
    if (!p) return null;
    const up = p.changePercent > 0;
    const down = p.changePercent < 0;
    return (
      <>
        <span className={cn("t-num text-[12px] font-medium", up ? "text-busy" : down ? "text-live" : "text-ink-3")}>
          {up ? "↗" : down ? "↘" : "→"} {Math.abs(p.changePercent).toFixed(1)}%
        </span>
        <span className="t-num text-[12px] text-ink-3">
          мин. {money(p.minPrice)} · меню {money(p.originalPrice)}
        </span>
      </>
    );
  };

  return (
    <>
      <VenueDetailShell
        name={r.name}
        images={r.gallery}
        onClose={onClose}
        scrollRef={scrollRef}
        heroShade="mood"
        topRight={
          <IconButton
            icon={UserRound}
            label="Кабинет"
            variant="photo"
            onClick={() => setAccountOpen(true)}
          />
        }
        heroOverlay={
          <div className="px-5 text-white">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/70">
              Sports · Lounge · Nightlife
            </p>
            <h1 className="t-display mt-2 max-w-[320px]">{r.name}</h1>
          </div>
        }
        dock={
          booked ? (
            <Button block size="lg" onClick={onClose}>
              Готово
            </Button>
          ) : (
            <>
              <CartLine count={preorderCount} total={preorderTotal} onOpen={() => setCartOpen(true)} />
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="t-num truncate text-[12.5px] text-ink-3">
                    {tab === "book" ? `${name || "Гость"} · ${guestLabel(guests)}` : r.hours}
                  </p>
                  <p className="truncate text-[16px] font-semibold tracking-[-0.015em]">
                    {tab === "book" ? `Сегодня в ${time}` : "Стол на вечер"}
                  </p>
                </div>
                {tab === "book" ? (
                  <Button size="lg" onClick={handleSubmit} className="px-7">
                    Подтвердить
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => goTab("book")} className="px-7">
                    Забронировать
                  </Button>
                )}
              </div>
            </>
          )
        }
      >
        <div className="px-5">
          <p className="t-caption flex items-center gap-1.5 text-ink-2">
            {r.address} · {r.distanceKm} км
          </p>
          <p className="t-body mt-3 text-ink-2">{r.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {r.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <FactsRow
            facts={[
              { label: "Открыто", value: r.hours ?? "17:00 – 04:00", sub: "каждый день" },
              { label: "Средний чек", value: money(r.avgCheck), sub: "на гостя" },
              { label: "Оценка", value: `★ ${r.rating.toFixed(1)}`, sub: `${r.reviews} отзывов` },
            ]}
          />
        </div>

        {/* Live drinks exchange — realtime intelligence, stated calmly */}
        <div className="mt-6 space-y-3 px-5">
          <div className="rounded-card bg-surface p-4 shadow-hairline">
            <div className="flex items-center justify-between gap-3">
              <p className="t-micro">Биржа напитков</p>
              <span className="t-num text-[11.5px] text-ink-3">авто · 30 сек</span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <LiveDot tone={exchange.connected ? "live" : "warn"} pulse={exchange.connected} size={8} />
              <p className="text-[15px] font-medium">
                {exchange.connected ? "В эфире" : "Ожидает соединения"}
                {exchange.roundKey && <span className="text-ink-3"> · раунд {exchange.roundKey}</span>}
              </p>
            </div>
            <p className="t-caption mt-1.5">
              Цены на напитки меняются вместе со спросом в зале
              {updated ? ` · обновлено в ${updated}` : ". Сейчас действуют цены меню."}
            </p>
          </div>
          <VenueStats occupancy={r.occupancy} peakHours={r.peakHours} title="В зале сейчас" />
        </div>

        <div ref={tabsRef} className="sticky top-[calc(var(--sat)+58px)] z-10 mt-8 bg-canvas pt-1">
          <Tabs
            id="xoxo"
            value={tab}
            onChange={goTab}
            tabs={[
              { key: "menu", label: `Бар · ${menuCount}` },
              { key: "book", label: "Бронь" },
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
            {tab === "menu" && (
              <div className="pt-6">
                <SectionHeader eyebrow="Биржевые цены" title="Хиты бара" />
                <div className="mt-4">
                  <SignatureDishes dishes={signature} onOpen={setDish} priceOf={priceOf} />
                </div>
                <div className="rail mt-7 gap-2">
                  {["Все", ...r.menu.map((s) => s.section)].map((c) => (
                    <Chip key={c} selected={activeCategory === c} onClick={() => setActiveCategory(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
                <MenuSections
                  sections={filteredSections}
                  qtyOf={qtyOf}
                  onOpen={setDish}
                  onQty={changeQty}
                  priceOf={priceOf}
                  priceMeta={priceMeta}
                />
              </div>
            )}

            {tab === "book" && (
              <div className="px-5 pt-6">
                {booked ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <SuccessMark />
                    <p className="t-headline mt-5">Бронь подтверждена</p>
                    <p className="t-caption mt-1.5">
                      {name} · {guestLabel(guests)} · сегодня в {time}
                      {preorder.length > 0 && preorderEnabled && ` · предзаказ ${money(preorderTotal)}`}
                    </p>
                    <p className="t-caption mt-4 max-w-[260px]">
                      Визит и кэшбэк уже в вашем кабинете XOXO.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <Field label="Имя" error={!name.trim() ? "Укажите имя" : ""}>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ваше имя"
                        autoComplete="given-name"
                        className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-ink-3"
                      />
                    </Field>
                    <Field label="Телефон" error={phoneError}>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="+7 (7XX) XXX-XX-XX"
                        autoComplete="tel"
                        className="t-num h-full w-full bg-transparent text-[15px] outline-none placeholder:text-ink-3"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Время" error={timeError}>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => handleTimeChange(e.target.value)}
                          className="t-num h-full w-full bg-transparent text-[15px] outline-none"
                        />
                      </Field>
                      <div>
                        <p className="t-micro mb-2">Гости</p>
                        <Stepper value={guests} onChange={setGuests} min={1} max={20} tone="surface" />
                      </div>
                    </div>

                    <div className="rounded-card bg-surface shadow-hairline">
                      <label className="flex cursor-pointer items-center gap-3.5 px-4 py-3.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-stone">
                          <ShoppingBag className="h-[17px] w-[17px]" strokeWidth={1.6} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px]">Предзаказ к столу</span>
                          <span className="t-num block truncate text-[13px] text-ink-3">
                            {preorderCount > 0
                              ? `${preorderCount} поз. · ${money(preorderTotal)} · кэшбэк 5%`
                              : "Напитки будут готовы к приходу"}
                          </span>
                        </span>
                        <Switch checked={preorderEnabled} onCheckedChange={setPreorderEnabled} />
                      </label>
                      {preorderEnabled && preorder.length === 0 && (
                        <div className="border-t border-line px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => goTab("menu")}
                            className="press text-[14px] font-medium text-ink"
                          >
                            Выбрать в баре →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </VenueDetailShell>

      <AnimatePresence>
        {cartOpen && (
          <CartSheet
            key="cart"
            items={preorder}
            priceOf={priceOf}
            onQty={changeQty}
            onClose={() => setCartOpen(false)}
            note={
              preorderTotal > 0 && (
                <p className="mb-3 text-[13px] font-medium text-live">
                  Вернём {money(Math.round(preorderTotal * 0.05))} · 5% кэшбэк
                </p>
              )
            }
            footer={
              <div className="flex gap-2.5">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  disabled={!preorder.length}
                  onClick={() => {
                    setPreorderEnabled(true);
                    setCartOpen(false);
                    goTab("book");
                  }}
                >
                  К брони
                </Button>
                <Button size="lg" className="flex-[1.4]" disabled={!preorder.length} onClick={purchaseNow}>
                  Оплатить сейчас
                </Button>
              </div>
            }
          />
        )}

        {accountOpen && (
          <BottomSheet
            key="account"
            onClose={() => setAccountOpen(false)}
            z="z-[150]"
            maxHeight="90%"
            header={
              <div className="px-5 pb-4 pt-8">
                <p className="t-micro">XOXO · мой кабинет</p>
                <h2 className="t-title mt-1.5">Советов Султан</h2>
              </div>
            }
          >
            <div className="px-5 pb-8">
              <div className="relative overflow-hidden rounded-hero bg-[#17150f] p-5 text-white shadow-float">
                <img src={r.gallery[1] ?? r.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#17150f]/40 to-[#17150f]/90" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#d8b58a]">XOXO Member</p>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">5% кэшбэк</p>
                  </div>
                  <p className="mt-8 text-[13px] text-white/60">Накоплено кэшбэка</p>
                  <p className="t-num mt-1 text-[40px] font-semibold leading-none tracking-[-0.03em]">
                    {money(xoxoCashback(account))}
                  </p>
                  <div className="mt-6 flex gap-6 border-t border-white/15 pt-4 text-[13px]">
                    <span>
                      <span className="t-num font-semibold">{account.orders.length}</span>
                      <span className="text-white/60"> заказов</span>
                    </span>
                    <span>
                      <span className="t-num font-semibold">{account.visits.length}</span>
                      <span className="text-white/60"> визитов</span>
                    </span>
                  </div>
                </div>
              </div>

              <p className="t-micro mb-2 mt-8">Заказы</p>
              {account.orders.length === 0 ? (
                <EmptyState icon={Receipt} title="Заказов пока нет" className="py-6" />
              ) : (
                <div className="divide-hairline rounded-card bg-surface px-4 shadow-hairline">
                  {account.orders.map((order) => (
                    <div key={order.id} className="flex items-start justify-between gap-3 py-3.5">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium">{order.kind}</p>
                        <p className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-3">
                          {new Date(order.date).toLocaleDateString("ru-RU")} ·{" "}
                          {order.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="t-num text-[15px] font-medium">{money(order.total)}</p>
                        <p className="t-num mt-0.5 text-[12.5px] font-medium text-live">+{money(order.cashback)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="t-micro mb-2 mt-8">Посещения</p>
              <div className="divide-hairline rounded-card bg-surface px-4 shadow-hairline">
                {account.visits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between py-3.5 text-[14.5px]">
                    <span className="t-num">
                      {new Date(visit.date).toLocaleDateString("ru-RU")} · {visit.time}
                    </span>
                    <span className="text-ink-2">{guestLabel(visit.guests)}</span>
                  </div>
                ))}
              </div>
            </div>
          </BottomSheet>
        )}

        {dish && (
          <DishModal
            key="dish"
            dish={{ ...dish, price: priceOf(dish) }}
            onClose={() => setDish(null)}
            onAdd={addToPreorder}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="t-micro mb-2">{label}</p>
      <div
        className={cn(
          "h-12 rounded-row bg-surface px-4 transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_var(--hs-ink)]",
          error ? "shadow-[inset_0_0_0_1.5px_var(--hs-busy)]" : "shadow-hairline",
        )}
      >
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 text-[12px] text-busy"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
