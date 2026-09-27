import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { LiveDot, spring } from "../system";
import { useWaitlist } from "./WaitlistProvider";
import { ProgressRing } from "./ProgressRing";

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * Live Activity–style pill: always visible while the guest is queued.
 * One line of status, one number, one ring.
 */
export function ActiveWaitlistWidget({ onOpen }: { onOpen?: () => void }) {
  const { queues } = useWaitlist();
  const waiting = queues.filter((q) => q.status === "waiting").sort((a, b) => a.etaSec - b.etaSec);
  const entry = waiting[0];

  return (
    <AnimatePresence>
      {entry && (
        <motion.button
          key={entry.id}
          type="button"
          initial={{ y: -80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.96 }}
          transition={spring}
          whileTap={{ scale: 0.98 }}
          onClick={onOpen}
          className="absolute inset-x-3 top-safe z-[60] flex items-center gap-3 rounded-[24px] bg-ink py-2 pl-2 pr-3.5 text-left text-white shadow-float"
        >
          <ProgressRing
            progress={1 - entry.position / entry.initialPosition + 0.001}
            size={42}
            stroke={3}
            color="#ffffff"
            track="rgb(255 255 255 / 0.15)"
          >
            <span className="t-num text-[13px] font-semibold">#{entry.position}</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold tracking-[-0.01em]">{entry.entityName}</p>
            <p className="flex items-center gap-1.5 truncate text-[12px] text-white/60">
              <LiveDot tone="live" pulse size={6} />
              Лист ожидания · ~<span className="t-num">{fmt(entry.etaSec)}</span>
            </p>
          </div>
          {queues.length > 1 && (
            <span className="t-num rounded-full bg-white/12 px-2 py-0.5 text-[11px] font-medium">
              {queues.length}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-white/50" strokeWidth={1.6} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
