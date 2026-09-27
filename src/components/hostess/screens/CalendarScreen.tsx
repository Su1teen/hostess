import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarX, MapPin, QrCode, Search, Users } from "lucide-react";
import { bookings, calendarEvents, money, type Booking } from "@/data/hostess";
import { Button, EmptyState, LiveDot, Photo, SectionHeader, spring, type LiveTone } from "../system";

function statusOf(status: Booking["status"]): { label: string; tone: LiveTone | "muted" } {
  return {
    confirmed: { label: "Подтверждено", tone: "live" as const },
    pending: { label: "Ожидает подтверждения", tone: "warn" as const },
    completed: { label: "Завершено", tone: "muted" as const },
    cancelled: { label: "Отменено", tone: "busy" as const },
  }[status];
}

function StatusLabel({ status }: { status: Booking["status"] }) {
  const s = statusOf(status);
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2">
      {s.tone === "muted" ? (
        <span className="h-[7px] w-[7px] rounded-full bg-ink-3" />
      ) : (
        <LiveDot tone={s.tone} pulse={s.tone === "live"} />
      )}
      {s.label}
    </span>
  );
}

/** Booking timeline — Flighty discipline: the next reservation leads, the rest line up. */
export function CalendarScreen({ onNavigateToMap }: { onNavigateToMap?: () => void }) {
  const [active, setActive] = useState<"upcoming" | "past">("upcoming");
  const [list, setList] = useState<Booking[]>(bookings);
  const [qrOpen, setQrOpen] = useState(false);

  const upcoming = list.filter((b) => b.status === "confirmed" || b.status === "pending");
  const past = list.filter((b) => b.status === "completed" || b.status === "cancelled");
  const shown = active === "upcoming" ? upcoming : past;
  const [next, ...rest] = shown;

  const cancel = (id: string) =>
    setList((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-none bg-canvas pb-nav">
      <div className="px-5 pt-safe">
        <p className="t-micro pt-2">Брони</p>
        <h1 className="t-title mt-1.5">Мои вечера</h1>
      </div>

      {/* Segmented control */}
      <div className="mx-5 mt-5 grid grid-cols-2 rounded-[14px] bg-stone p-1">
        {(["upcoming", "past"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setActive(k)}
            className={`relative h-9 rounded-[11px] text-[14px] font-medium transition-colors ${active === k ? "text-ink" : "text-ink-3"}`}
          >
            {active === k && (
              <motion.span layoutId="cal-seg" transition={spring} className="absolute inset-0 rounded-[11px] bg-surface shadow-soft" />
            )}
            <span className="relative">
              {k === "upcoming" ? "Предстоящие" : "Прошедшие"}
              <span className="t-num ml-1.5 text-ink-3">{k === "upcoming" ? upcoming.length : past.length}</span>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="pt-6"
        >
          {shown.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="Пока пусто"
              text="Забронируйте стол, мойку или событие — всё появится здесь."
              action={
                <Button onClick={onNavigateToMap}>
                  <Search className="h-4 w-4" strokeWidth={1.6} /> Найти место
                </Button>
              }
            />
          ) : (
            <>
              {/* Lead reservation */}
              {next && (
                <div className="mx-5 overflow-hidden rounded-hero bg-surface shadow-soft">
                  <div className="relative">
                    <Photo src={next.cover} className="aspect-[16/8] w-full" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute inset-x-4 bottom-3 text-white">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
                        {active === "upcoming" ? "Следующая бронь" : "Последний визит"}
                      </p>
                      <p className="mt-1 truncate text-[22px] font-semibold tracking-[-0.025em]">{next.place}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 divide-x divide-line">
                      <div className="pr-3">
                        <p className="t-micro">Когда</p>
                        <p className="mt-1.5 truncate text-[15px] font-semibold">{next.date}</p>
                      </div>
                      <div className="px-3">
                        <p className="t-micro">Время</p>
                        <p className="t-num mt-1.5 text-[15px] font-semibold">{next.time}</p>
                      </div>
                      <div className="pl-3">
                        <p className="t-micro">Гости</p>
                        <p className="t-num mt-1.5 text-[15px] font-semibold">{next.guests}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
                      <StatusLabel status={next.status} />
                      {next.area && (
                        <span className="flex items-center gap-1 truncate text-[12.5px] text-ink-3">
                          <MapPin className="h-3 w-3" strokeWidth={1.6} /> {next.area}
                        </span>
                      )}
                    </div>
                    {active === "upcoming" && (
                      <>
                        <div className="mt-4 flex gap-2">
                          <Button variant="secondary" className="flex-1" onClick={() => setQrOpen((v) => !v)}>
                            <QrCode className="h-4 w-4" strokeWidth={1.6} /> {qrOpen ? "Скрыть код" : "Код для входа"}
                          </Button>
                          <Button variant="outline" onClick={() => cancel(next.id)}>
                            Отменить
                          </Button>
                        </div>
                        <AnimatePresence>
                          {qrOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={spring}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col items-center pt-5">
                                <div className="grid grid-cols-8 gap-[3px] rounded-[18px] bg-canvas p-4">
                                  {Array.from({ length: 64 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className={`h-3 w-3 rounded-[2px] ${(i * 7 + (i % 5) * 3) % 3 === 0 || i % 9 === 0 ? "bg-ink" : "bg-transparent"}`}
                                    />
                                  ))}
                                </div>
                                <p className="t-caption mt-2">Покажите хостес на входе</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {rest.length > 0 && (
                <div className="mt-8">
                  <p className="t-micro px-5 pb-3">{active === "upcoming" ? "Дальше" : "Ранее"}</p>
                  <div className="relative mx-5">
                    <span className="absolute bottom-6 left-[27px] top-6 w-px bg-line-strong" />
                    {rest.map((b) => (
                      <div key={b.id} className="relative flex gap-4 py-3">
                        <div className="w-[56px] shrink-0 pt-1 text-center">
                          <p className="t-num relative z-[1] inline-block bg-canvas px-1 text-[15px] font-semibold">{b.time}</p>
                        </div>
                        <div className="min-w-0 flex-1 rounded-card bg-surface p-3.5 shadow-hairline">
                          <div className="flex items-start gap-3">
                            <Photo src={b.cover} className="h-12 w-12 shrink-0 rounded-[12px]" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-medium">{b.place}</p>
                              <p className="mt-0.5 flex items-center gap-2 truncate text-[12.5px] text-ink-3">
                                {b.date}
                                <span className="flex items-center gap-0.5">
                                  <Users className="h-3 w-3" strokeWidth={1.6} /> {b.guests}
                                </span>
                                {b.amount ? <span className="t-num">· {money(b.amount)}</span> : null}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <StatusLabel status={b.status} />
                            {active === "upcoming" && (
                              <button type="button" onClick={() => cancel(b.id)} className="press text-[12.5px] font-medium text-ink-3">
                                Отменить
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Month overview */}
      <section className="mt-10 space-y-4">
        <SectionHeader eyebrow="2026" title="Июль" />
        <div className="mx-5 rounded-card bg-surface p-4 shadow-hairline">
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-ink-3">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <span key={d} className="pb-2">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const events = calendarEvents[day] ?? [];
              const today = day === 4;
              return (
                <div key={day} className="flex h-10 flex-col items-center justify-center">
                  <span
                    className={`t-num grid h-8 w-8 place-items-center rounded-full text-[13.5px] ${
                      today ? "bg-ink font-semibold text-white" : events.length ? "font-semibold text-ink" : "text-ink-2"
                    }`}
                  >
                    {day}
                  </span>
                  <span className="mt-0.5 flex h-1 gap-0.5">
                    {events.slice(0, 2).map((e) => (
                      <span key={e.title} className="h-1 w-1 rounded-full bg-brass" />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
