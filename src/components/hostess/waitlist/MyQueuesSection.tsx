import { AnimatePresence, motion } from "framer-motion";
import { ListChecks, X } from "lucide-react";
import { BentoCard, BentoHeader } from "../Bento";
import { useWaitlist } from "./WaitlistProvider";
import { ProgressRing } from "./ProgressRing";

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * Раздел «Мои очереди» в профиле (Task 6.4): список всех активных
 * очередей с живым статусом и возможностью отменить.
 */
export function MyQueuesSection() {
  const { queues, leave } = useWaitlist();
  if (queues.length === 0) return null;

  return (
    <div className="mt-6 px-5">
      <BentoHeader
        title="Мои очереди"
        icon={<ListChecks className="h-4 w-4 text-primary" />}
        className="pb-3"
        action={
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {queues.length}
          </span>
        }
      />
      <div className="space-y-2">
        <AnimatePresence>
          {queues.map((q) => {
            const ready = q.status === "ready";
            return (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
              >
                <BentoCard className="flex items-center gap-3" padded={false}>
                  <div className="flex flex-1 items-center gap-3 p-3">
                    <ProgressRing
                      progress={ready ? 1 : 1 - q.position / q.initialPosition + 0.001}
                      size={46}
                      color={ready ? "#22C55E" : "var(--primary)"}
                    >
                      <span className="text-[13px] font-bold text-neutral-900">#{q.position}</span>
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{q.entityName}</p>
                      <p className="truncate text-[11px] text-neutral-500">
                        {q.entityKind}
                        {q.resource ? ` · ${q.resource}` : ""}
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] font-semibold ${
                          ready ? "text-emerald-600" : "text-primary"
                        }`}
                      >
                        {ready ? "Место готово — подтвердите!" : `Осталось ~${fmt(q.etaSec)}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => leave(q.id)}
                    className="mr-3 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500"
                    aria-label="Покинуть очередь"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </BentoCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
