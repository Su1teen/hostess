import { Fragment, useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  gridTimes,
  slotState,
  toTime,
  type ClinicDay,
  type Doctor,
  type FreeSlot,
  type SlotState,
} from "@/data/clinics";
import { hapticSelect } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { tapSpring } from "../system";
import { isMine, type Appointment } from "./appointments";
import { ease } from "./ui";

export type GridColumn = {
  key: string;
  doctor: Doctor;
  day: ClinicDay;
  header: ReactNode;
};

type Cell = { state: SlotState | "mine"; mine?: Appointment };

const part = (m: number) => (m < 12 * 60 ? "Утро" : m < 17 * 60 ? "День" : "Вечер");

/**
 * Шахматка: строки — время, колонки — врачи (или дни одного врача).
 * Пустые строки (обед, прошедшее время, клиника закрыта) скрываются,
 * выбранная ячейка подсвечивается одной «плавающей» плашкой.
 */
export function SlotGrid({
  columns,
  appointments,
  selected,
  onSelect,
  movingId,
}: {
  columns: GridColumn[];
  appointments: Appointment[];
  selected: FreeSlot | null;
  onSelect: (slot: FreeSlot) => void;
  /** Запись, которую переносим: её текущий слот подписан «сейчас». */
  movingId?: string;
}) {
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(() => {
    const minutes = new Set<number>();
    columns.forEach((c) =>
      gridTimes([c.doctor.clinicId], c.day.weekday).forEach((m) => minutes.add(m)),
    );
    return [...minutes]
      .sort((a, b) => a - b)
      .map((minute) => ({
        minute,
        cells: columns.map<Cell>((c) => {
          const mine = isMine(appointments, c.doctor.id, c.day.key, minute);
          if (mine) return { state: "mine", mine };
          return { state: slotState(c.doctor, c.day, minute, now) };
        }),
      }))
      .filter((r) =>
        r.cells.some((c) => c.state === "free" || c.state === "taken" || c.state === "mine"),
      );
  }, [columns, appointments, now]);

  const cols = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` };

  return (
    <div>
      {/* Шапка колонок — прилипает к верху шторки */}
      <div className="sticky top-0 z-10 -mx-5 bg-[color-mix(in_oklab,var(--hs-canvas)_92%,transparent)] px-5 pb-2 pt-3 backdrop-blur-xl">
        <div className="grid gap-2" style={cols}>
          {columns.map((c) => (
            <div key={c.key} className="min-w-0">
              {c.header}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        {rows.map((row, i) => {
          const label = part(row.minute);
          const showLabel = i === 0 || part(rows[i - 1].minute) !== label;
          return (
            <Fragment key={row.minute}>
              {showLabel && <p className="t-micro pb-1 pt-4 first:pt-1">{label}</p>}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 14) * 0.012, duration: 0.3, ease }}
                className="grid gap-2"
                style={cols}
              >
                {row.cells.map((cell, ci) => {
                  const col = columns[ci];
                  const on =
                    selected != null &&
                    selected.doctorId === col.doctor.id &&
                    selected.dayKey === col.day.key &&
                    selected.minute === row.minute;
                  const time = toTime(row.minute);

                  if (cell.state === "closed" || cell.state === "past")
                    return <span key={col.key} className="h-10" aria-hidden />;

                  if (cell.state === "taken")
                    return (
                      <span
                        key={col.key}
                        className="slot-taken t-num grid h-10 place-items-center rounded-[12px] text-[12.5px] text-ink-3/70 line-through decoration-ink-3/40"
                        aria-label={`${time} занято`}
                      >
                        {time}
                      </span>
                    );

                  if (cell.state === "mine")
                    return (
                      <span
                        key={col.key}
                        className="t-num flex h-10 flex-col items-center justify-center rounded-[12px] bg-live-soft text-live shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hs-live)_35%,transparent)]"
                      >
                        <span className="text-[12.5px] font-semibold leading-none">{time}</span>
                        <span className="mt-0.5 text-[9px] font-medium uppercase leading-none tracking-[0.08em]">
                          {cell.mine?.id === movingId ? "сейчас" : "ваша"}
                        </span>
                      </span>
                    );

                  return (
                    <motion.button
                      key={col.key}
                      type="button"
                      whileTap={{ scale: 0.93 }}
                      transition={tapSpring}
                      aria-pressed={on}
                      aria-label={`${time} свободно`}
                      onClick={() => {
                        hapticSelect();
                        onSelect({
                          doctorId: col.doctor.id,
                          dayKey: col.day.key,
                          minute: row.minute,
                        });
                      }}
                      className="t-num relative h-10 rounded-[12px] bg-surface text-[13.5px] font-medium shadow-[inset_0_0_0_1px_var(--hs-line-strong)]"
                    >
                      {on && (
                        <motion.span
                          layoutId="clinic-slot-highlight"
                          transition={{ type: "spring", stiffness: 520, damping: 38 }}
                          className="absolute inset-0 rounded-[12px] bg-ink"
                        />
                      )}
                      <span
                        className={cn("relative transition-colors", on ? "text-white" : "text-ink")}
                      >
                        {time}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** Есть ли в колонках хоть одно свободное окно. */
export function hasFree(columns: GridColumn[], now = new Date()) {
  return columns.some((c) =>
    gridTimes([c.doctor.clinicId], c.day.weekday).some(
      (m) => slotState(c.doctor, c.day, m, now) === "free",
    ),
  );
}
