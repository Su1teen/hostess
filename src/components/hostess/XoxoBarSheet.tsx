import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  X,
  Star,
  Clock,
  MapPin,
  Minus,
  Plus,
  Utensils,
  ChevronDown,
  Check,
  ShoppingBag,
} from "lucide-react";
import { money, type Restaurant, type Dish } from "@/data/hostess";
import { DishModal } from "./DishModal";
import type { PreorderItem } from "./types";
import { toast } from "sonner";

/* ── Helpers ──────────────────────────────────────────────────────── */

const CTA_BOTTOM = "bottom-[calc(80px+env(safe-area-inset-bottom)+16px)]";
const SCROLL_PB = "pb-[calc(180px+env(safe-area-inset-bottom)+16px)]";

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

function totalMenuItems(menu: Restaurant["menu"]) {
  return menu.reduce((acc, sec) => acc + sec.items.length, 0);
}

/* ── Component ────────────────────────────────────────────────────── */

export function XoxoBarSheet({
  r,
  onClose,
}: {
  r: Restaurant;
  onClose: () => void;
}) {
  /* ── Gallery ── */
  const [activePhoto, setActivePhoto] = useState(0);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    photoRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActivePhoto(i);
        },
        { threshold: 0.6 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  /* ── Menu ── */
  const [activeCategory, setActiveCategory] = useState("Все");
  const [dish, setDish] = useState<Dish | null>(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const menuCount = totalMenuItems(r.menu);

  const filteredSections =
    activeCategory === "Все"
      ? r.menu
      : r.menu.filter((sec) => sec.section === activeCategory);

  const previewItems = r.menu.flatMap((sec) => sec.items).slice(0, 4);

  /* ── Preorder ── */
  const [preorder, setPreorder] = useState<PreorderItem[]>([]);
  const [preorderEnabled, setPreorderEnabled] = useState(false);

  const addToPreorder = useCallback((d: Dish, qty: number) => {
    setPreorder((prev) => {
      const found = prev.find((p) => p.dish.id === d.id);
      if (found)
        return prev.map((p) =>
          p.dish.id === d.id ? { ...p, qty: p.qty + qty } : p,
        );
      return [...prev, { dish: d, qty }];
    });
    setPreorderEnabled(true);
  }, []);

  const updatePreorderQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setPreorder((prev) => prev.filter((p) => p.dish.id !== id));
    } else {
      setPreorder((prev) =>
        prev.map((p) => (p.dish.id === id ? { ...p, qty } : p)),
      );
    }
  };

  const preorderTotal = preorder.reduce(
    (s, p) => s + p.dish.price * p.qty,
    0,
  );

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
    if (formatted.length > 0 && !isPhoneValid(formatted)) {
      setPhoneError("Формат: +7 (7XX) XXX-XX-XX");
    } else {
      setPhoneError("");
    }
  };

  const handleTimeChange = (val: string) => {
    setTime(val);
    if (val && !isTimeInRange(val)) {
      setTimeError("Заведение закрыто в это время");
    } else {
      setTimeError("");
    }
  };

  const handleSubmit = () => {
    let hasError = false;
    if (!name.trim()) {
      hasError = true;
    }
    if (!isPhoneValid(phone)) {
      setPhoneError("Формат: +7 (7XX) XXX-XX-XX");
      hasError = true;
    }
    if (!isTimeInRange(time)) {
      setTimeError("Заведение закрыто в это время");
      hasError = true;
    }
    if (hasError) return;

    setBooked(true);
    toast.success("Бронь подтверждена!");
  };

  /* ── Scroll parallax ── */
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.6]);

  /* ── Menu section ref for scroll-to ── */
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="absolute inset-0 z-[100] flex flex-col bg-white"
    >
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto overscroll-none ${SCROLL_PB}`}
      >
        {/* ── Hero Gallery ──────────────────────────────────────────── */}
        <div className="sticky top-0 z-0 h-[320px] w-full overflow-hidden">
          <div className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto">
            {r.gallery.map((src, i) => (
              <div
                key={i}
                ref={(el) => {
                  photoRefs.current[i] = el;
                }}
                className="h-full w-full shrink-0 snap-center"
              >
                <motion.img
                  src={src}
                  alt=""
                  style={
                    i === 0
                      ? {
                          scale: heroScale,
                          opacity: heroOpacity,
                          originY: 0,
                        }
                      : undefined
                  }
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/95 via-white/80 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute left-4 top-14 grid h-10 w-10 place-items-center rounded-full bg-white/90 backdrop-blur shadow-soft"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Dot indicators */}
          <div className="absolute inset-x-0 top-12 flex justify-center gap-1 px-4">
            {r.gallery.map((_, i) => (
              <span
                key={i}
                className={`h-0.5 flex-1 max-w-16 rounded-full transition-colors ${
                  i === activePhoto ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>

          {/* Venue name overlay */}
          <div className="absolute inset-x-5 bottom-16 text-white">
            <div className="flex items-center gap-2">
              <span className="glass rounded-full px-2.5 py-1 text-[11px] font-semibold text-neutral-900">
                <Star className="mr-1 -mt-0.5 inline h-3 w-3 fill-primary text-primary" />{" "}
                {r.rating}
              </span>
              <span className="text-xs opacity-90">· {r.reviews} отзывов</span>
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {r.name}
            </h1>
            <p className="text-sm opacity-90">
              {r.cuisine} · {r.district}
            </p>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="relative z-10 rounded-t-[32px] bg-white px-5 pt-6">
          {/* Venue info grid */}
          <div className="grid grid-cols-3 overflow-hidden rounded-2xl bg-neutral-50 text-center">
            <div className="p-3">
              <Clock className="mx-auto h-4 w-4 text-neutral-500" />
              <p className="mt-1 text-[11px] text-neutral-500">Часы работы</p>
              <p className="text-xs font-semibold">17:00 – 04:00</p>
            </div>
            <div className="border-x border-white p-3">
              <MapPin className="mx-auto h-4 w-4 text-neutral-500" />
              <p className="mt-1 text-[11px] text-neutral-500">Адрес</p>
              <p className="text-[10px] font-semibold leading-tight">
                ул. Асфендиярова, 8
              </p>
            </div>
            <div className="p-3">
              <Star className="mx-auto h-4 w-4 text-neutral-500" />
              <p className="mt-1 text-[11px] text-neutral-500">Рейтинг</p>
              <p className="text-xs font-semibold">{r.rating} из 5</p>
            </div>
          </div>

          {/* ── Menu ────────────────────────────────────────────────── */}
          <div className="mt-6" ref={menuRef}>
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
              <Utensils className="h-4 w-4" /> Меню
              <span className="ml-auto text-[10px] font-medium text-neutral-400">
                {menuCount} позиций
              </span>
            </h3>

            {/* Category tabs */}
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-3">
              {["Все", ...r.menu.map((s) => s.section)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-2xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-800 hairline"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Preview items (when menu collapsed) */}
            {!menuExpanded && (
              <div className="space-y-3">
                {previewItems.map((d) => (
                  <motion.button
                    key={d.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDish(d)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft"
                  >
                    <img
                      src={d.image}
                      alt=""
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-tight">
                        {d.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                        {d.desc}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold text-primary">
                      {money(d.price)}
                    </p>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Expand/collapse */}
            <button
              onClick={() => setMenuExpanded((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-white py-3 text-[13px] font-semibold text-neutral-900 transition-colors active:bg-neutral-50"
            >
              {menuExpanded
                ? "Свернуть меню"
                : `Посмотреть все ${menuCount} позиций`}
              <motion.span
                animate={{ rotate: menuExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              </motion.span>
            </button>

            {/* Full menu */}
            <AnimatePresence initial={false}>
              {menuExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 30,
                  }}
                  className="overflow-hidden"
                >
                  <div className="pt-3">
                    {filteredSections.map((sec) => (
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
                              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft"
                            >
                              <img
                                src={d.image}
                                alt=""
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold leading-tight">
                                  {d.name}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                  {d.desc}
                                </p>
                              </div>
                              <p className="shrink-0 text-[13px] font-semibold text-primary">
                                {money(d.price)}
                              </p>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Booking Section ─────────────────────────────────────── */}
          <div className="mt-6 rounded-3xl bg-neutral-50 p-5">
            <h3 className="mb-4 text-[15px] font-semibold">Бронирование</h3>

            {booked ? (
              /* ── Success state ─── */
              <div className="py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 18,
                  }}
                  className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white"
                >
                  <Check className="h-7 w-7" strokeWidth={3} />
                </motion.div>
                <p className="mt-3 text-base font-semibold">
                  Бронь подтверждена!
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {name} · {guestLabel(guests)} · {time}
                  {preorder.length > 0 &&
                    ` · предзаказ ${money(preorderTotal)}`}
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
                {/* Name */}
                <div className="mb-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                    Имя
                  </p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-border/60 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Ваше имя"
                  />
                </div>

                {/* Phone */}
                <div className="mb-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                    Телефон
                  </p>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full rounded-2xl border bg-white p-3 text-sm outline-none focus:ring-2 ${
                      phoneError
                        ? "border-red-400 focus:ring-red-200"
                        : "border-border/60 focus:ring-primary/30"
                    }`}
                    placeholder="+7 (7XX) XXX-XX-XX"
                  />
                  {phoneError && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {phoneError}
                    </p>
                  )}
                </div>

                {/* Guests */}
                <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-3 hairline">
                  <div>
                    <p className="text-xs text-neutral-500">Гостей</p>
                    <p className="text-sm font-semibold">{guestLabel(guests)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {guests}
                    </span>
                    <button
                      onClick={() => setGuests(Math.min(20, guests + 1))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Time */}
                <div className="mb-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                    Время
                  </p>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className={`w-full rounded-2xl border bg-white p-3 text-sm outline-none focus:ring-2 ${
                      timeError
                        ? "border-red-400 focus:ring-red-200"
                        : "border-border/60 focus:ring-primary/30"
                    }`}
                  />
                  {timeError && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {timeError}
                    </p>
                  )}
                </div>

                {/* Pre-order toggle */}
                <button
                  onClick={() => setPreorderEnabled((v) => !v)}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                    preorderEnabled
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-900 hairline"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">
                    Добавить предзаказ по меню
                  </span>
                  <span className="ml-auto">
                    {preorderEnabled ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {/* Pre-order items */}
                {preorderEnabled && (
                  <div className="mb-3 rounded-2xl bg-white p-3 hairline">
                    {preorder.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-neutral-500">
                          Нажмите на позицию меню выше, чтобы добавить
                        </p>
                        <button
                          onClick={() => {
                            setMenuExpanded(true);
                            menuRef.current?.scrollIntoView({
                              behavior: "smooth",
                            });
                          }}
                          className="mt-2 text-xs font-semibold text-primary"
                        >
                          Выбрать из меню ↑
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {preorder.map((p) => (
                            <div
                              key={p.dish.id}
                              className="flex items-center gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">
                                  {p.dish.name}
                                </p>
                                <p className="text-[10px] text-neutral-500">
                                  {money(p.dish.price)} × {p.qty}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    updatePreorderQty(p.dish.id, p.qty - 1)
                                  }
                                  className="grid h-7 w-7 place-items-center rounded-full bg-neutral-100"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-4 text-center text-xs font-semibold">
                                  {p.qty}
                                </span>
                                <button
                                  onClick={() =>
                                    updatePreorderQty(p.dish.id, p.qty + 1)
                                  }
                                  className="grid h-7 w-7 place-items-center rounded-full bg-neutral-100"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="w-20 text-right text-xs font-semibold">
                                {money(p.dish.price * p.qty)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                          <p className="text-sm font-semibold">Итого</p>
                          <p className="text-sm font-semibold text-primary">
                            {money(preorderTotal)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  className="w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white shadow-float"
                >
                  Подтвердить бронь
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── DishModal drill-down ─────────────────────────────────── */}
      <AnimatePresence>
        {dish && (
          <DishModal
            dish={dish}
            onClose={() => setDish(null)}
            onAdd={addToPreorder}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
