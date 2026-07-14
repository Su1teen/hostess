import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { X, Check } from "lucide-react";
import { money, type Venue } from "@/data/hostess";
import { useWaitlist } from "./waitlist/WaitlistProvider";
import { JoinWaitlistSheet } from "./waitlist/JoinWaitlistSheet";
import type { JoinWaitlistInput } from "./waitlist/types";

const CTA_BOTTOM = "bottom-[calc(80px+env(safe-area-inset-bottom)+16px)]";
const SCROLL_PB = "pb-[calc(140px+env(safe-area-inset-bottom)+16px)]";

/**
 * Запись в заведение (барбершоп, клиника, автомойка и т.д.) —
 * Bottom sheet с выбором услуги и времени.
 * Task 2: floating CTA с корректным отступом от BottomNav / safe-area.
 */
export function VenueBookingModal({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const [service, setService] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [waitInput, setWaitInput] = useState<JoinWaitlistInput | null>(null);
  const { join, isQueued } = useWaitlist();
  const slots = ["10:00", "11:30", "13:00", "15:30", "17:00", "19:30"];
  // Мок: эти слоты «полностью заняты» — на них можно только встать в очередь.
  const fullSlots = new Set(["13:00", "17:00"]);

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
        {/* Обложка — sticky + parallax + blending */}
        <div className="sticky top-0 z-0 h-48 overflow-hidden">
          <motion.img
            src={venue.cover}
            alt=""
            style={{ scale: heroScale, opacity: heroOpacity, originY: 0 }}
            className="h-full w-full rounded-t-[32px] object-cover"
          />
          <div className="absolute inset-0 rounded-t-[32px] bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/95 via-white/80 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative z-10 rounded-t-[32px] bg-white px-5 pt-4">
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
                      <p
                        className={`text-xs ${service === i ? "text-white/60" : "text-neutral-500"}`}
                      >
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
                {slots.map((s) => {
                  const full = fullSlots.has(s);
                  const queued = isQueued(`${venue.id}-${s}`);
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        if (full) {
                          // Полностью занято → открываем очередь (Waitlist).
                          setWaitInput({
                            entityId: `${venue.id}-${s}`,
                            entityName: venue.name,
                            entityKind: venue.kind,
                            cover: venue.cover,
                            resource: `${venue.services[service].name} · ${s}`,
                            peopleAhead: 3 + (s.length % 3),
                            etaMin: 18 + (s.length % 12),
                          });
                          return;
                        }
                        setSlot(s);
                      }}
                      className={`relative shrink-0 rounded-2xl px-4 py-3 text-xs font-semibold transition-colors ${
                        full
                          ? queued
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-red-50/60 text-red-600 ring-1 ring-red-200"
                          : slot === s
                            ? "bg-primary text-white"
                            : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {s}
                      {/* Индикатор «полностью занято» — изящная красная точка + нижняя полоска */}
                      {full && (
                        <>
                          <span
                            className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${
                              queued ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          <span
                            className={`absolute inset-x-2 bottom-1 h-[2px] rounded-full ${
                              queued ? "bg-emerald-500/70" : "bg-red-500/80"
                            }`}
                          />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-neutral-400">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />
                слот занят — нажмите, чтобы встать в очередь
              </p>
            </>
          )}
        </div>

        {/* Floating CTA — над BottomNav */}
        {!booked && (
          <div className={`pointer-events-none absolute inset-x-0 z-40 px-5 ${CTA_BOTTOM}`}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!slot}
              onClick={() => setBooked(true)}
              className="pointer-events-auto w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white shadow-float disabled:opacity-40"
            >
              Записаться · {money(venue.services[service].price)}
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Waitlist — поверх модалки записи (z-[120] внутри JoinWaitlistSheet).
          stopPropagation, чтобы клик по подложке очереди не закрывал саму модалку. */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <AnimatePresence>
          {waitInput && (
            <JoinWaitlistSheet
              input={waitInput}
              onClose={() => setWaitInput(null)}
              onConfirm={(inp) => {
                join(inp);
                setWaitInput(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
