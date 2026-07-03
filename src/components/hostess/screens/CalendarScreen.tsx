import { useState } from "react";
import { Plus, Search, Settings, ChevronLeft, ChevronRight, Users, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calendarEvents, upcomingActivities } from "@/data/hostess";

const modes = ["День", "Неделя", "Месяц"] as const;

export function CalendarScreen() {
  const [mode, setMode] = useState<(typeof modes)[number]>("Месяц");
  const [selected, setSelected] = useState<number | null>(16);

  const daysInMonth = 31;
  const startWeekday = 3; // Thu = 3 for May 1
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="relative h-full overflow-y-auto bg-white pb-32">
      <div className="flex items-center justify-between px-5 pt-14">
        <button className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100">
          <Search className="h-4 w-4" />
        </button>
        <div className="flex rounded-full bg-neutral-100 p-1">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative rounded-full px-4 py-1.5 text-xs font-medium ${
                mode === m ? "text-white" : "text-neutral-600"
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId="cal-mode"
                  className="absolute inset-0 rounded-full bg-neutral-900"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">{m}</span>
            </button>
          ))}
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex items-end justify-between px-5">
        <h1
          className="text-5xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
        >
          Май
        </h1>
        <div className="flex items-center gap-2">
          <button className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-3 px-3 text-center text-[11px] font-medium uppercase text-neutral-400">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 px-3 pt-2">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="h-14" />;
          const events = calendarEvents[d] ?? [];
          const isSelected = selected === d;
          return (
            <button
              key={i}
              onClick={() => setSelected(d)}
              className="flex h-14 flex-col items-center justify-start gap-1 pt-1"
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-sm ${
                  isSelected ? "bg-neutral-900 text-white font-semibold" : "text-neutral-800"
                }`}
              >
                {d}
              </span>
              <div className="flex gap-0.5">
                {events.slice(0, 3).map((e, j) => (
                  <span key={j} className="h-1 w-3 rounded-full" style={{ background: e.color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Upcoming */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-[15px] font-semibold">Предстоящие активности</h3>
          <button className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2.5">
          {upcomingActivities.map((a) => (
            <div key={a.id} className="rounded-2xl bg-white p-4 hairline">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{a.when}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  Подтверждено
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-neutral-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {a.place}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {a.guests} гостей
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day bottom sheet */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected}
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute inset-x-0 bottom-0 z-30 rounded-t-[28px] bg-white p-5 pb-32 shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.25)]"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-neutral-300" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  {selected} мая · четверг
                </p>
                <h3 className="text-xl font-semibold">
                  {calendarEvents[selected]?.length ?? 0} событий
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs"
              >
                Закрыть
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {(calendarEvents[selected] ?? []).map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3">
                  <span className="h-10 w-1.5 rounded-full" style={{ background: e.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{e.title}</p>
                    <p className="text-xs text-neutral-500">19:30 · Ауыл · 4 гостя</p>
                  </div>
                  <button className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white">
                    Открыть
                  </button>
                </div>
              ))}
              {(!calendarEvents[selected] || calendarEvents[selected]!.length === 0) && (
                <p className="py-6 text-center text-sm text-neutral-500">Свободный день ✨</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
