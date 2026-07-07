import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useWaitlist } from "./WaitlistProvider";
import { ProgressRing } from "./ProgressRing";

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * Плавающий виджет активной очереди — всегда виден поверх экранов,
 * пока пользователь стоит в очереди (и слот ещё не освободился).
 * Прогресс-кольцо заполняется по мере продвижения к началу очереди.
 */
export function ActiveWaitlistWidget({ onOpen }: { onOpen?: () => void }) {
  const { queues } = useWaitlist();
  // Показываем самую «близкую» к выдаче запись в статусе ожидания.
  const waiting = queues.filter((q) => q.status === "waiting").sort((a, b) => a.etaSec - b.etaSec);
  const entry = waiting[0];

  return (
    <AnimatePresence>
      {entry && (
        <motion.button
          key={entry.id}
          layout
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={onOpen}
          className="glass-frosted pointer-events-auto absolute inset-x-4 top-4 z-[60] flex items-center gap-3 rounded-[22px] px-3 py-2.5 text-left"
        >
          <ProgressRing
            progress={1 - entry.position / entry.initialPosition + 0.001}
            size={46}
            stroke={4}
          >
            <span className="text-[13px] font-bold text-neutral-900">#{entry.position}</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-neutral-900">
              {entry.entityName}
            </p>
            <p className="truncate text-[11px] text-neutral-600">
              В очереди · осталось ~{fmt(entry.etaSec)}
            </p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold text-white">
            {queues.length > 1 ? `${queues.length} очереди` : "Очередь"}
            <ChevronRight className="h-3 w-3" />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
