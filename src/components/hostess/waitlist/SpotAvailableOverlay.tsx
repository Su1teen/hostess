import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { hapticSelect } from "@/lib/haptics";
import { Button, LiveDot, Photo, softSpring } from "../system";
import { useWaitlist } from "./WaitlistProvider";
import type { WaitlistEntry } from "./types";

const fmt = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * High-priority "your table is ready" moment. Light, calm, unmistakable:
 * a large countdown, one primary action.
 */
export function SpotAvailableOverlay({
  entry,
  onClaim,
}: {
  entry: WaitlistEntry;
  onClaim: (entry: WaitlistEntry) => void;
}) {
  const { claim, pass, leave } = useWaitlist();
  const [remaining, setRemaining] = useState(() => (entry.claimDeadline ?? Date.now()) - Date.now());

  useEffect(() => {
    const t = setInterval(() => setRemaining((entry.claimDeadline ?? Date.now()) - Date.now()), 250);
    return () => clearInterval(t);
  }, [entry.claimDeadline]);

  const ratio = Math.max(0, Math.min(1, remaining / (5 * 60 * 1000)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[130] flex flex-col bg-canvas px-6 pb-safe pt-safe"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...softSpring, delay: 0.05 }}
        className="flex flex-1 flex-col items-center justify-center text-center"
      >
        {entry.cover && (
          <Photo src={entry.cover} className="h-24 w-24 rounded-hero shadow-float" eager />
        )}
        <p className="mt-6 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-live">
          <LiveDot tone="live" pulse /> Место освободилось
        </p>
        <h1 className="t-display mt-3">{entry.entityName}</h1>
        {entry.resource && <p className="t-body mt-1.5 text-ink-2">{entry.resource}</p>}

        <p className="t-micro mt-10">Подтвердите в течение</p>
        <p className="t-num mt-2 text-[64px] font-semibold leading-none tracking-[-0.04em]">{fmt(remaining)}</p>
        <div className="mt-5 h-[3px] w-48 overflow-hidden rounded-full bg-stone-2">
          <motion.div
            className="h-full rounded-full bg-ink"
            animate={{ width: `${ratio * 100}%` }}
            transition={{ ease: "linear", duration: 0.25 }}
          />
        </div>
      </motion.div>

      <div className="space-y-2 pb-4">
        <Button
          block
          size="lg"
          onClick={() => {
            hapticSelect();
            claim(entry.id);
            onClaim(entry);
          }}
        >
          Занять место
        </Button>
        <Button block size="lg" variant="secondary" onClick={() => pass(entry.id)}>
          Пропустить — ждать следующее
        </Button>
        <button
          type="button"
          onClick={() => leave(entry.id)}
          className="press w-full py-3 text-[14px] font-medium text-ink-3"
        >
          Покинуть очередь
        </button>
      </div>
    </motion.div>
  );
}
