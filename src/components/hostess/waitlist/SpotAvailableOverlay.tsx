import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PartyPopper, Timer } from "lucide-react";
import { hapticSelect } from "@/lib/haptics";
import { useWaitlist } from "./WaitlistProvider";
import type { WaitlistEntry } from "./types";

const fmt = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * Высокоприоритетный полноэкранный оверлей «освободился слот» (Task 6.3).
 * Живой обратный отсчёт 5:00 + три действия: подтвердить / пропустить / выйти.
 */
export function SpotAvailableOverlay({
  entry,
  onClaim,
}: {
  entry: WaitlistEntry;
  onClaim: (entry: WaitlistEntry) => void;
}) {
  const { claim, pass, leave } = useWaitlist();
  const [remaining, setRemaining] = useState(
    () => (entry.claimDeadline ?? Date.now()) - Date.now(),
  );

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining((entry.claimDeadline ?? Date.now()) - Date.now());
    }, 250);
    return () => clearInterval(t);
  }, [entry.claimDeadline]);

  const total = 5 * 60 * 1000;
  const ratio = Math.max(0, Math.min(1, remaining / total));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[130] flex flex-col items-center justify-center bg-neutral-950/95 px-6 text-center backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="grid h-20 w-20 place-items-center rounded-full bg-primary text-white shadow-[0_0_60px_rgba(249,115,22,0.6)]"
      >
        <PartyPopper className="h-9 w-9" />
      </motion.div>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        Место освободилось
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{entry.entityName}</h1>
      {entry.resource && <p className="mt-1 text-sm text-white/60">{entry.resource}</p>}

      {/* Обратный отсчёт */}
      <div className="mt-8 flex flex-col items-center">
        <span className="flex items-center gap-2 text-white/50">
          <Timer className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Осталось подтвердить</span>
        </span>
        <motion.p
          key={fmt(remaining)}
          initial={{ scale: 0.96, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-1 text-5xl font-semibold tabular-nums text-white"
        >
          {fmt(remaining)}
        </motion.p>
        <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${ratio * 100}%` }}
            transition={{ ease: "linear", duration: 0.25 }}
          />
        </div>
      </div>

      {/* Действия */}
      <div className="mt-10 w-full max-w-xs space-y-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            hapticSelect();
            claim(entry.id);
            onClaim(entry);
          }}
          className="w-full rounded-full bg-primary py-4 text-sm font-semibold text-white shadow-float"
        >
          Занять место
        </motion.button>
        <button
          onClick={() => pass(entry.id)}
          className="w-full rounded-full bg-white/10 py-3.5 text-sm font-semibold text-white"
        >
          Подождать / пропустить
        </button>
        <button
          onClick={() => leave(entry.id)}
          className="w-full py-2 text-xs font-medium text-white/50"
        >
          Покинуть очередь
        </button>
      </div>
    </motion.div>
  );
}
