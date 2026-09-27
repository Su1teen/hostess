import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { money, friends } from "@/data/hostess";
import { hapticSelect, hapticSuccess } from "@/lib/haptics";
import { Button, Dock, IconButton, Photo, SuccessMark, Ticker, sheetSpring, softSpring } from "./system";
import type { BookingPayload } from "./types";

type Stage = "review" | "paying" | "success";

/** Step 2 of booking: bill split with friends + Apple Pay–style confirmation. */
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
    return [{ id: "deposit", name: "Депозит за стол", note: `${booking.guests} гостей`, price: booking.guests * 5000 }];
  }, [booking]);

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const service = Math.round(subtotal * 0.1);
  const total = subtotal + service;
  const people = 1 + selected.length;
  const perPerson = Math.ceil(total / people);
  const bonus = Math.round(total * 0.05);

  const toggleFriend = (id: string) => {
    hapticSelect();
    setSelected((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const pay = () => {
    setStage("paying");
    setTimeout(() => {
      hapticSuccess();
      setStage("success");
    }, 2000);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={sheetSpring}
      className="absolute inset-0 z-[105] flex flex-col bg-canvas"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-safe">
        <IconButton icon={ChevronLeft} label="Назад" variant="stone" onClick={onClose} iconSize={20} />
        <p className="text-[15px] font-semibold tracking-[-0.01em]">Оплата и сплит</p>
        <span className="w-10" />
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto overscroll-none pb-8">
        <div className="flex items-center gap-3.5 px-5 pt-4">
          <Photo src={booking.restaurant.cover} className="h-14 w-14 shrink-0 rounded-[16px]" />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold tracking-[-0.015em]">{booking.restaurant.name}</p>
            <p className="t-num truncate text-[13px] text-ink-2">
              {booking.day} · {booking.time} · {booking.guests} гостей{booking.table ? ` · стол ${booking.table}` : ""}
            </p>
          </div>
        </div>

        <div className="px-5 pt-8">
          <p className="t-micro">Итого к оплате</p>
          <p className="t-num mt-2 text-[48px] font-semibold leading-none tracking-[-0.045em]">{money(total)}</p>
          <p className="t-num mt-2 text-[13px] font-medium text-brass">+{bonus.toLocaleString("ru-RU")} бонусов Hostess</p>
        </div>

        <div className="mt-7 px-5">
          <p className="t-micro pb-1">{booking.preorder.length > 0 ? "Предзаказ" : "Позиции"}</p>
          <div className="divide-hairline">
            {items.map((it) => (
              <div key={it.id} className="flex items-baseline justify-between gap-3 py-3">
                <p className="min-w-0 truncate text-[15px]">
                  {it.name}
                  {it.note && <span className="ml-1.5 text-ink-3">{it.note}</span>}
                </p>
                <p className="t-num shrink-0 text-[15px]">{money(it.price)}</p>
              </div>
            ))}
            <div className="flex items-baseline justify-between py-3 text-[14px] text-ink-3">
              <span>Сервисный сбор 10%</span>
              <span className="t-num">{money(service)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="t-micro px-5 pb-3">Разделить с друзьями</p>
          <div className="rail gap-4">
            {friends.map((f) => {
              const on = selected.includes(f.id);
              return (
                <button key={f.id} type="button" onClick={() => toggleFriend(f.id)} className="w-16 shrink-0 snap-start text-center">
                  <span className="relative mx-auto block h-14 w-14">
                    <motion.img
                      src={f.avatar}
                      alt={f.name}
                      animate={{ opacity: on ? 1 : 0.45, scale: on ? 1 : 0.94 }}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                    <AnimatePresence>
                      {on && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={softSpring}
                          className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-canvas bg-ink text-white"
                        >
                          <Check className="h-3 w-3" strokeWidth={2.4} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className={`mt-1.5 block truncate text-[12px] ${on ? "font-medium text-ink" : "text-ink-3"}`}>{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-5 mt-6 rounded-card bg-surface p-4 shadow-hairline">
          <div className="flex items-baseline justify-between">
            <p className="t-caption">Каждый платит</p>
            <p className="t-num text-[12.5px] text-ink-3">{people} чел.</p>
          </div>
          <Ticker value={money(perPerson)} className="mt-1 text-[30px] font-semibold tracking-[-0.03em]" />
          <div className="mt-3 flex h-[5px] gap-1">
            {Array.from({ length: people }).map((_, i) => (
              <motion.span key={i} layout className={`h-full flex-1 rounded-full ${i === 0 ? "bg-ink" : "bg-stone-2"}`} />
            ))}
          </div>
          <p className="mt-2.5 text-[12px] text-ink-3">Ваша часть — первая. Друзья получат запрос в приложении.</p>
        </div>
      </div>

      <Dock>
        <Button block size="lg" onClick={pay} className="bg-black">
          <AppleLogo /> Оплатить {money(perPerson)}
        </Button>
      </Dock>

      <AnimatePresence>
        {stage !== "review" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] flex items-end bg-[rgb(17_18_20/0.36)] px-3 pb-[calc(var(--sab)+12px)]"
          >
            <motion.div
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={sheetSpring}
              className="w-full rounded-hero bg-surface p-6 text-center shadow-float"
            >
              {stage === "paying" ? (
                <div className="py-4">
                  <motion.span
                    className="mx-auto block h-10 w-10 rounded-full border-[2.5px] border-stone-2 border-t-ink"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  />
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-[16px] font-semibold">
                    <AppleLogo dark /> Pay
                  </p>
                  <p className="t-caption mt-1">Подтвердите двойным нажатием боковой кнопки</p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <SuccessMark />
                  <p className="t-headline mt-4">Стол забронирован</p>
                  <p className="t-caption mt-1">
                    {booking.restaurant.name} · {booking.day} · {booking.time}
                  </p>
                  <p className="t-num mt-3 text-[13px] font-medium text-brass">+{bonus.toLocaleString("ru-RU")} бонусов</p>
                  <Button block size="lg" className="mt-6" onClick={onDone}>
                    Готово
                  </Button>
                </div>
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
    <svg viewBox="0 0 14 17" className={`h-4 w-4 ${dark ? "fill-ink" : "fill-white"}`} aria-hidden>
      <path d="M11.62 9.05c.02 2.3 2.02 3.07 2.04 3.08-.02.05-.32 1.1-1.05 2.17-.63.93-1.29 1.86-2.32 1.88-1.02.02-1.35-.6-2.51-.6-1.16 0-1.53.58-2.49.62-1 .04-1.76-1-2.4-1.93C1.6 12.36.6 8.9 1.94 6.55c.67-1.17 1.86-1.9 3.15-1.92.98-.02 1.9.66 2.5.66.6 0 1.72-.81 2.9-.7.5.03 1.88.2 2.77 1.51-.07.05-1.65.97-1.64 2.95ZM9.7 3.28c.53-.64.88-1.53.79-2.42-.76.03-1.68.5-2.22 1.14-.49.57-.92 1.48-.8 2.35.84.07 1.7-.43 2.23-1.07Z" />
    </svg>
  );
}
