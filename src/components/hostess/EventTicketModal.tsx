import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { X, Ticket, CalendarDays, MapPin } from "lucide-react";
import { money, type CityEvent } from "@/data/hostess";

const CTA_BOTTOM = "bottom-[calc(80px+env(safe-area-inset-bottom)+16px)]";
const SCROLL_PB = "pb-[calc(140px+env(safe-area-inset-bottom)+16px)]";

/**
 * Билет на событие — Bottom sheet с информацией о событии и покупкой билета.
 * Task 1/2: sticky hero с parallax + плавное смешение с контентом + floating CTA
 * с корректным отступом от BottomNav / safe-area.
 */
export function EventTicketModal({ event, onClose }: { event: CityEvent; onClose: () => void }) {
  const [bought, setBought] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.6]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-end bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        ref={scrollRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[92%] w-full overflow-y-auto overscroll-none rounded-t-[32px] bg-white shadow-float ${SCROLL_PB}`}
      >
        {/* Hero — sticky + parallax + blending */}
        <div className="sticky top-0 z-0 h-52 overflow-hidden">
          <motion.img
            src={event.cover}
            alt=""
            style={{ scale: heroScale, opacity: heroOpacity, originY: 0 }}
            className="h-full w-full rounded-t-[32px] object-cover"
          />
          <div className="absolute inset-0 rounded-t-[32px] bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/95 via-white/80 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute inset-x-4 bottom-16 text-white">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold backdrop-blur">
              {event.tag}
            </span>
            <h2 className="mt-1.5 text-xl font-semibold">{event.title}</h2>
          </div>
        </div>

        <div className="relative z-10 rounded-t-[32px] bg-white px-5 pt-4">
          {/* Метаинформация */}
          <div className="flex gap-4 text-xs text-neutral-600">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} /> {event.date} · {event.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {event.place}
            </span>
          </div>

          {bought ? (
            /* ── Билет куплен ─────────────────────────────────────────── */
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="mx-auto flex w-56 flex-col items-center rounded-2xl bg-neutral-900 p-4 text-white shadow-float"
              >
                <Ticket className="h-6 w-6 text-primary" />
                <p className="mt-2 text-sm font-semibold">{event.title}</p>
                <p className="mt-0.5 text-[10px] opacity-60">
                  {event.date} · {event.time} · 1 билет
                </p>
                {/* Баркод-паттерн */}
                <div className="mt-3 flex gap-[3px]">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded bg-white"
                      style={{ height: 6 + ((i * 7) % 18) }}
                    />
                  ))}
                </div>
              </motion.div>
              <p className="mt-4 text-xs text-neutral-500">Билет добавлен в Wallet</p>
            </div>
          ) : null}
        </div>

        {/* Floating CTA — над BottomNav */}
        {!bought && (
          <div className={`pointer-events-none absolute inset-x-0 z-40 px-5 ${CTA_BOTTOM}`}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setBought(true)}
              className="pointer-events-auto w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white shadow-float"
            >
              {event.price === 0
                ? "Зарегистрироваться · бесплатно"
                : `Купить билет · ${money(event.price)}`}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
