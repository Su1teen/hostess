import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  QrCode,
  Users,
  MapPin,
  Clock,
  Ban,
  CalendarX,
  Search,
} from "lucide-react";
import { bookings, calendarEvents, type Booking } from "@/data/hostess";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BentoCard, BentoHeader } from "../Bento";

function statusLabel(status: Booking["status"]) {
  return {
    confirmed: { label: "Подтверждено", color: "bg-emerald-100 text-emerald-700" },
    pending: { label: "Ожидание", color: "bg-amber-100 text-amber-700" },
    completed: { label: "Завершено", color: "bg-neutral-100 text-neutral-600" },
    cancelled: { label: "Отменено", color: "bg-red-100 text-red-700" },
  }[status];
}

/**
 * Экран календаря (Task 4b): вкладки «Предстоящие / Прошлые», карточки
 * бронирований с QR, временем, гостями, статусом, возможностью отмены;
 * пустое состояние с CTA на карту.
 */
export function CalendarScreen({ onNavigateToMap }: { onNavigateToMap?: () => void }) {
  const [active, setActive] = useState<"upcoming" | "past">("upcoming");
  const [list, setList] = useState<Booking[]>(bookings);
  const [showQrId, setShowQrId] = useState<string | null>(null);

  const upcoming = list.filter((b) => b.status === "confirmed" || b.status === "pending");
  const past = list.filter((b) => b.status === "completed" || b.status === "cancelled");
  const shown = active === "upcoming" ? upcoming : past;

  const cancel = (id: string) => {
    setList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
    );
  };

  return (
    <div className="h-full overflow-y-auto overscroll-none bg-gray-50 pb-[calc(80px+env(safe-area-inset-bottom)+16px)]">
      <div className="px-5 pt-14">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">Календарь</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Мои бронирования</h1>
      </div>

      <Tabs
        value={active}
        onValueChange={(v) => setActive(v as "upcoming" | "past")}
        className="mt-5 px-5"
      >
        <TabsList className="w-full rounded-[20px] p-1">
          <TabsTrigger value="upcoming" className="flex-1 rounded-2xl text-sm">
            Предстоящие
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 rounded-2xl text-sm">
            Прошлые
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent key={active} value={active} className="mt-4">
            {shown.length === 0 ? (
              <EmptyState onNavigateToMap={onNavigateToMap} />
            ) : (
              <div className="space-y-3">
                {shown.map((b) => {
                  const status = statusLabel(b.status);
                  const isPast = b.status === "completed" || b.status === "cancelled";
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <BentoCard className="overflow-hidden" padded={false}>
                        <div className="flex">
                          <img
                            src={b.cover}
                            alt=""
                            className="h-24 w-24 shrink-0 object-cover"
                          />
                          <div className="flex flex-1 flex-col justify-center p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold leading-tight">{b.place}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
                              <Clock className="h-3 w-3" strokeWidth={1.5} /> {b.date} · {b.time}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-500">
                              <MapPin className="h-3 w-3" strokeWidth={1.5} /> {b.area}
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-700">
                                <Users className="h-3 w-3" strokeWidth={1.5} /> {b.guests}
                              </span>
                              {!isPast && (
                                <button
                                  onClick={() => setShowQrId(showQrId === b.id ? null : b.id)}
                                  className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700"
                                >
                                  <QrCode className="h-3 w-3" strokeWidth={1.5} />
                                  QR
                                </button>
                              )}
                              {!isPast && b.status !== "cancelled" && (
                                <button
                                  onClick={() => cancel(b.id)}
                                  className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600"
                                >
                                  <Ban className="h-3 w-3" strokeWidth={1.5} />
                                  Отменить
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {showQrId === b.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-border/60 bg-neutral-50"
                            >
                              <div className="p-4 text-center">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                                  QR-код для входа
                                </p>
                                <div className="mt-3 inline-grid grid-cols-6 gap-1 p-3 bg-white rounded-2xl">
                                  {Array.from({ length: 24 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className={`h-3 w-3 rounded-sm ${i % 5 === 0 || i % 7 === 0 ? "bg-neutral-900" : "bg-neutral-200"}`}
                                    />
                                  ))}
                                </div>
                                <p className="mt-2 text-[10px] text-neutral-400">
                                  Покажите на входе в {b.place}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </BentoCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* Mini calendar — дни с событиями */}
      <div className="px-5 pb-8">
        <BentoHeader title="Июль" className="pb-3" />
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
            <span key={d} className="py-2">
              {d}
            </span>
          ))}
          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1;
            const events = calendarEvents[day] ?? [];
            return (
              <div
                key={day}
                className={`grid h-10 place-items-center rounded-2xl text-[11px] ${
                  events.length > 0 ? "bg-neutral-900 font-semibold text-white" : "bg-white text-neutral-700"
                }`}
              >
                <span>{day}</span>
                {events.length > 1 && (
                  <span className="mb-1.5 h-1 w-1 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onNavigateToMap }: { onNavigateToMap?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center px-8 py-12 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-full bg-neutral-100">
        <CalendarX className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-base font-semibold">Нет бронирований</p>
      <p className="mt-1 text-sm text-neutral-500">
        Забронируйте столик, мойку или мероприятие — всё появится здесь.
      </p>
      <button
        onClick={onNavigateToMap}
        className="mt-5 flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-float"
      >
        <Search className="h-4 w-4" strokeWidth={1.5} />
        Найти место
      </button>
    </motion.div>
  );
}
