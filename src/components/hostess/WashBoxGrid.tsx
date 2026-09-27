import { motion } from "framer-motion";
import { type WashBox } from "@/data/hostess";
import { LiveDot, tapSpring, type LiveTone } from "./system";

const tone: Record<WashBox["status"], LiveTone> = { available: "live", moderate: "warn", busy: "busy" };

/**
 * Car-wash bays as a live board: status dot, one line of state,
 * a thin progress line for bays in use. Selection = ink tile.
 */
export function WashBoxGrid({
  boxes,
  selected,
  onSelect,
}: {
  boxes: WashBox[];
  selected: string | null;
  onSelect: (box: WashBox) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {boxes.map((b) => {
        const free = b.status === "available";
        const on = selected === b.id;
        return (
          <motion.button
            key={b.id}
            type="button"
            disabled={!free}
            whileTap={free ? { scale: 0.96 } : undefined}
            transition={tapSpring}
            onClick={() => onSelect(b)}
            className={`relative h-[88px] overflow-hidden rounded-row p-3.5 text-left transition-colors ${
              on ? "bg-ink text-white" : free ? "bg-surface shadow-hairline" : "bg-stone/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold tracking-[-0.01em]">{b.label}</span>
              <LiveDot tone={tone[b.status]} pulse={free && !on} />
            </div>
            <span className={`t-num mt-1 block text-[12.5px] ${on ? "text-white/70" : "text-ink-3"}`}>
              {free ? "Свободен сейчас" : `Освободится в ${b.freeAt}`}
            </span>
            {!free && (
              <div className="absolute inset-x-3.5 bottom-3.5 h-[3px] overflow-hidden rounded-full bg-[rgb(23_21_15/0.08)]">
                <motion.div
                  className="h-full rounded-full bg-ink/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((b.progress ?? 0) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 18 }}
                />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
