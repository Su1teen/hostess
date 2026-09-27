import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { bayStatus, type BayStatus, type WashBox } from "@/data/hostess";
import { cn } from "@/lib/utils";
import { tapSpring } from "./system";

const stateMeta: Record<BayStatus["state"], { label: string; dot: string }> = {
  free: { label: "Свободен", dot: "var(--hs-live)" },
  reserved: { label: "Бронь", dot: "var(--hs-reserved)" },
  in_use: { label: "Идёт мойка", dot: "var(--hs-ink-3)" },
};

/**
 * Realtime bay board (Supercharger-stall logic): each tile is a physical
 * bay — number, state, the next relevant time, and nothing else.
 * In-use bays carry a hairline progress bar and an estimate, never a loud
 * countdown.
 */
export function WashBoxGrid({
  boxes,
  now,
  selected,
  onSelect,
}: {
  boxes: WashBox[];
  now: number;
  selected: string | null;
  onSelect: (box: WashBox) => void;
}) {
  const cols = boxes.length % 3 === 0 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={cn("grid gap-2", cols)}>
      {boxes.map((b, i) => {
        const s = bayStatus(b, now);
        const free = s.state === "free";
        const on = selected === b.id && free;
        const meta = stateMeta[s.state];
        const title =
          s.state === "in_use" ? (s.service ?? meta.label) : s.state === "reserved" ? `Бронь · ${s.at}` : meta.label;
        const sub =
          s.state === "in_use"
            ? `≈ ${s.minutes} мин`
            : s.state === "reserved"
              ? `через ${s.minutes} мин`
              : s.at
                ? `до ${s.at}`
                : "Сейчас";
        return (
          <motion.button
            key={b.id}
            type="button"
            disabled={!free}
            whileTap={free ? { scale: 0.95 } : undefined}
            transition={tapSpring}
            onClick={() => onSelect(b)}
            aria-pressed={on}
            aria-label={`${b.label}: ${title}, ${sub}`}
            className={cn(
              "relative flex h-[108px] flex-col overflow-hidden rounded-[16px] px-3 pb-3 pt-2.5 text-left transition-colors duration-200",
              on
                ? "bg-ink text-white"
                : free
                  ? "bg-white shadow-[inset_0_0_0_1px_var(--hs-line-strong)]"
                  : "bg-stone text-ink",
            )}
          >
            <span className="flex items-start justify-between">
              <span
                className={cn(
                  "t-num text-[24px] font-semibold leading-none tracking-[-0.03em]",
                  !free && !on && "text-ink-3",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {on ? (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-ink">
                  <Check className="h-3 w-3" strokeWidth={2.6} />
                </span>
              ) : (
                <span className="mt-1 h-[7px] w-[7px] rounded-full" style={{ background: meta.dot }} />
              )}
            </span>
            <span className="mt-auto">
              <span
                className={cn(
                  "block truncate text-[13px] font-medium tracking-[-0.01em]",
                  s.state === "reserved" && "text-reserved",
                )}
              >
                {title}
              </span>
              <span className={cn("t-num mt-0.5 block truncate text-[11.5px]", on ? "text-white/65" : "text-ink-3")}>
                {sub}
              </span>
            </span>
            {s.state === "in_use" && (
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[rgb(17_18_20/0.06)]">
                <motion.span
                  className="block h-full bg-ink/60"
                  initial={false}
                  animate={{ width: `${Math.round(s.progress * 100)}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 20 }}
                />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export function BayLegend() {
  return (
    <span className="flex items-center gap-3 text-[11.5px] text-ink-3">
      {(Object.keys(stateMeta) as BayStatus["state"][]).map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: stateMeta[k].dot }} />
          {k === "in_use" ? "Мойка" : stateMeta[k].label}
        </span>
      ))}
    </span>
  );
}
