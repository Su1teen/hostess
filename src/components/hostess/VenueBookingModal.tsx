import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { money, type Venue } from "@/data/hostess";

/**
 * Запись в заведение (барбершоп, клиника, автомойка и т.д.) —
 * Bottom sheet с выбором услуги и времени.
 * Извлечён из MapScreen/CatalogScreen для переиспользования.
 */
export function VenueBookingModal({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const [service, setService] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const slots = ["10:00", "11:30", "13:00", "15:30", "17:00", "19:30"];

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
        className="max-h-[92%] w-full overflow-y-auto rounded-t-[32px] bg-white pb-8 shadow-float"
      >
        {/* Обложка */}
        <div className="relative h-48">
          <img src={venue.cover} alt="" className="h-full w-full rounded-t-[32px] object-cover" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <h2 className="text-xl font-semibold">{venue.name}</h2>
          <p className="text-sm text-neutral-500">{venue.kind}</p>

          {booked ? (
            /* ── Успешная запись ──────────────────────────────────────── */
            <div className="py-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white"
              >
                <Check className="h-7 w-7" strokeWidth={3} />
              </motion.div>
              <p className="mt-3 text-base font-semibold">Вы записаны!</p>
              <p className="mt-1 text-xs text-neutral-500">
                {venue.services[service].name} · завтра в {slot}
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
              {/* ── Выбор услуги ──────────────────────────────────────── */}
              <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                Услуга
              </p>
              <div className="space-y-2">
                {venue.services.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => setService(i)}
                    className={`flex w-full items-center justify-between rounded-2xl p-3 text-left transition-all ${
                      service === i ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-900"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className={`text-xs ${service === i ? "text-white/60" : "text-neutral-500"}`}>
                        {s.duration}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{money(s.price)}</p>
                  </button>
                ))}
              </div>

              {/* ── Выбор времени ─────────────────────────────────────── */}
              <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                Завтра
              </p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlot(s)}
                    className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-semibold transition-colors ${
                      slot === s ? "bg-primary text-white" : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!slot}
                onClick={() => setBooked(true)}
                className="mt-5 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white shadow-float disabled:opacity-40"
              >
                Записаться · {money(venue.services[service].price)}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
