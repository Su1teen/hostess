import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Users, CalendarDays, Sparkles, ShoppingBag } from "lucide-react";
import { money, friends } from "@/data/hostess";
import type { BookingPayload } from "./types";

type Stage = "review" | "paying" | "success";

/**
 * Шаг после «Далее»: сплит чека между друзьями + оплата в стиле Apple Pay.
 */
export function PaymentSheet({
  booking,
  onClose,
  onDone,
}: {
  booking: BookingPayload;
  onClose: () => void;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<Stage>("review");
  const [selected, setSelected] = useState<string[]>([friends[0].id, friends[1].id]);

  const items = useMemo(() => {
    if (booking.preorder.length > 0) {
      return booking.preorder.map((p) => ({
        id: p.dish.id,
        name: p.dish.name,
        note: p.qty > 1 ? `× ${p.qty}` : "",
        price: p.dish.price * p.qty,
      }));
    }
    return [
      {
        id: "deposit",
        name: "Депозит за столик",
        note: `${booking.guests} гостей`,
        price: booking.guests * 5000,
      },
    ];
  }, [booking]);

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const service = Math.round(subtotal * 0.1);
  const total = subtotal + service;
  const people = 1 + selected.length; // я + выбранные друзья
  const perPerson = Math.ceil(total / people);
  const bonus = Math.round(total * 0.05);

  const toggleFriend = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  const pay = () => {
    setStage("paying");
    setTimeout(() => setStage("success"), 2200);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="absolute inset-0 z-[60] flex flex-col bg-white"
    >
      <div className="flex-1 overflow-y-auto pb-[190px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-14">
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100"
            aria-label="Назад"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">Шаг 2 из 2</p>
            <p className="text-sm font-semibold">Сплит и оплата</p>
          </div>
          <div className="h-10 w-10" />
        </div>

        <div className="px-5 pt-5">
          {/* Сводка брони */}
          <div className="flex items-center gap-3 rounded-3xl bg-neutral-50 p-3 shadow-soft">
            <img
              src={booking.restaurant.cover}
              alt=""
              className="h-14 w-14 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{booking.restaurant.name}</p>
              <p className="flex items-center gap-1 text-xs text-neutral-500">
                <CalendarDays className="h-3 w-3" />
                {booking.day} · {booking.time}
                {booking.table ? ` · стол T${booking.table}` : ""}
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 shadow-soft">
              <Users className="h-3 w-3" /> {booking.guests}
            </span>
          </div>

          {/* Итого */}
          <div className="mt-6">
            <p className="text-xs text-neutral-500">Итого к оплате</p>
            <h1 className="text-5xl font-semibold tracking-tight">{money(total)}</h1>
            <p className="mt-1 flex items-center gap-1 text-xs text-primary">
              <Sparkles className="h-3 w-3" /> +{bonus.toLocaleString("ru-RU")} бонусов Hostess
            </p>
          </div>

          {/* Позиции */}
          <div className="mt-5 space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
              <ShoppingBag className="h-3 w-3" />
              {booking.preorder.length > 0 ? "Ваш предзаказ" : "Позиции"}
            </p>
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-soft"
              >
                <div>
                  <p className="text-sm font-semibold">{it.name}</p>
                  {it.note && <p className="text-xs text-neutral-500">{it.note}</p>}
                </div>
                <p className="text-sm font-semibold">{money(it.price)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 text-xs text-neutral-500">
              <span>Сервисный сбор 10%</span>
              <span>{money(service)}</span>
            </div>
          </div>

          {/* Друзья для сплита */}
          <div className="mt-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
              Разделить с друзьями
            </p>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {friends.map((f) => {
                const on = selected.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFriend(f.id)}
                    className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                  >
                    <span className="relative">
                      <img
                        src={f.avatar}
                        alt={f.name}
                        className={`h-14 w-14 rounded-full object-cover transition-all ${
                          on ? "ring-[3px] ring-primary" : "ring-2 ring-neutral-200 opacity-70"
                        }`}
                      />
                      <AnimatePresence>
                        {on && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-white ring-2 ring-white"
                          >
                            <Check className="h-3 w-3" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="text-[10px] font-medium text-neutral-600">{f.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Визуализация сплита */}
          <div className="mt-4 rounded-3xl bg-neutral-900 p-4 text-white shadow-float">
            <div className="flex items-center justify-between">
              <p className="text-xs opacity-70">Каждый платит</p>
              <p className="text-xs opacity-70">{people} чел.</p>
            </div>
            <motion.p
              key={perPerson}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-3xl font-semibold tracking-tight"
            >
              {money(perPerson)}
            </motion.p>
            <div className="mt-3 flex h-2 w-full gap-1 overflow-hidden rounded-full">
              {Array.from({ length: people }).map((_, i) => (
                <motion.span
                  key={i}
                  layout
                  className={`h-full flex-1 rounded-full ${i === 0 ? "bg-primary" : "bg-white/30"}`}
                />
              ))}
            </div>
            <p className="mt-2 text-[10px] opacity-50">
              Оранжевый — ваша часть. Друзья получат запрос в приложении.
            </p>
          </div>
        </div>
      </div>

      {/* Плавающая кнопка оплаты — выше навбара */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[100px] z-[8888] px-5">
        <motion.button
          onClick={pay}
          whileTap={{ scale: 0.97 }}
          className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full bg-black py-4 text-sm font-semibold text-white shadow-float"
        >
          <AppleLogo />
          Оплатить {money(perPerson)}
        </motion.button>
      </div>

      {/* Apple Pay overlay */}
      <AnimatePresence>
        {stage !== "review" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[9000] flex items-end justify-center bg-black/55 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mb-24 w-[86%] rounded-[28px] bg-white p-6 text-center shadow-float"
            >
              {stage === "paying" ? (
                <>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center">
                    <motion.span
                      className="h-10 w-10 rounded-full border-[3px] border-neutral-200 border-t-neutral-900"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    />
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold">
                    <AppleLogo dark /> Pay
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">Подтвердите боковой кнопкой…</p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white"
                  >
                    <Check className="h-7 w-7" strokeWidth={3} />
                  </motion.div>
                  <p className="mt-3 text-base font-semibold">Бронь подтверждена!</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {booking.restaurant.name} · {booking.day} · {booking.time}
                  </p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    <Sparkles className="h-3 w-3" /> +{bonus.toLocaleString("ru-RU")} бонусов
                  </motion.p>
                  <button
                    onClick={onDone}
                    className="mt-5 w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white"
                  >
                    Готово
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AppleLogo({ dark }: { dark?: boolean }) {
  return (
    <svg
      viewBox="0 0 14 17"
      className={`h-4 w-4 ${dark ? "fill-neutral-900" : "fill-white"}`}
      aria-hidden
    >
      <path d="M11.62 9.05c.02 2.3 2.02 3.07 2.04 3.08-.02.05-.32 1.1-1.05 2.17-.63.93-1.29 1.86-2.32 1.88-1.02.02-1.35-.6-2.51-.6-1.16 0-1.53.58-2.49.62-1 .04-1.76-1-2.4-1.93C1.6 12.36.6 8.9 1.94 6.55c.67-1.17 1.86-1.9 3.15-1.92.98-.02 1.9.66 2.5.66.6 0 1.72-.81 2.9-.7.5.03 1.88.2 2.77 1.51-.07.05-1.65.97-1.64 2.95ZM9.7 3.28c.53-.64.88-1.53.79-2.42-.76.03-1.68.5-2.22 1.14-.49.57-.92 1.48-.8 2.35.84.07 1.7-.43 2.23-1.07Z" />
    </svg>
  );
}
