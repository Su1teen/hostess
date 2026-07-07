import { useState } from "react";
import { motion } from "framer-motion";
import { X, Ticket, CalendarDays, MapPin } from "lucide-react";
import { money, type CityEvent } from "@/data/hostess";

/**
 * Билет на событие — Bottom sheet с информацией о событии и покупкой билета.
 * Извлечён из MapScreen/CatalogScreen для переиспользования.
 */
export function EventTicketModal({ event, onClose }: { event: CityEvent; onClose: () => void }) {
  const [bought, setBought] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-end bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[32px] bg-white pb-8 shadow-float"
      >
        {/* Обложка с градиентом */}
        <div className="relative h-52">
          <img src={event.cover} alt="" className="h-full w-full rounded-t-[32px] object-cover" />
          <div className="absolute inset-0 rounded-t-[32px] bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute inset-x-4 bottom-3 text-white">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold backdrop-blur">
              {event.tag}
            </span>
            <h2 className="mt-1.5 text-xl font-semibold">{event.title}</h2>
          </div>
        </div>

        <div className="px-5 pt-4">
          {/* Метаинформация */}
          <div className="flex gap-4 text-xs text-neutral-600">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {event.date} · {event.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {event.place}
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
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setBought(true)}
              className="mt-5 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white shadow-float"
            >
              {event.price === 0
                ? "Зарегистрироваться · бесплатно"
                : `Купить билет · ${money(event.price)}`}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
