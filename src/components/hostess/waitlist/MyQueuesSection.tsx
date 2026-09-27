import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { IconButton, LiveDot, Photo, SectionHeader } from "../system";
import { useWaitlist } from "./WaitlistProvider";
import type { WaitlistEntry } from "./types";

const fmtEta = (sec: number) => {
  if (sec <= 0) return "ждёт подтверждения";
  if (sec < 60) return "меньше минуты";
  return `~${Math.round(sec / 60)} мин`;
};

/* Моковые активные очереди: показываются, пока у пользователя нет реальных записей. */
const MOCK_QUEUES: WaitlistEntry[] = [
  {
    id: "mock-kinza",
    entityId: "kinza",
    entityName: "Lou Lou",
    entityKind: "Ресторан",
    cover: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=400&q=80",
    resource: "Столик на 4 · 20:30",
    status: "waiting",
    position: 2,
    initialPosition: 5,
    etaSec: 180,
    joinedAt: Date.now() - 120000,
  },
  {
    id: "mock-tomb",
    entityId: "v1",
    entityName: "Barbershop TOMB",
    entityKind: "Барбершоп",
    cover: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80",
    resource: "Стрижка + укладка",
    status: "waiting",
    position: 1,
    initialPosition: 3,
    etaSec: 45,
    joinedAt: Date.now() - 90000,
  },
  {
    id: "mock-auyl",
    entityId: "auyl",
    entityName: "Qazaq Gourmet",
    entityKind: "Ресторан",
    cover: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=400&q=80",
    resource: "Столик у окна · 21:00",
    status: "waiting",
    position: 4,
    initialPosition: 7,
    etaSec: 300,
    joinedAt: Date.now() - 200000,
  },
];

/**
 * Live queues (Flighty-style rows): position, ETA and a single progress line.
 */
export function MyQueuesSection() {
  const { queues, leave } = useWaitlist();
  const [mocks, setMocks] = useState<WaitlistEntry[]>(MOCK_QUEUES);

  const useMock = queues.length === 0;
  const list = useMock ? mocks : queues;
  if (list.length === 0) return null;

  const handleLeave = (id: string) => {
    if (useMock) setMocks((prev) => prev.filter((q) => q.id !== id));
    else leave(id);
  };

  return (
    <section className="space-y-4">
      <SectionHeader eyebrow="В реальном времени" title="Листы ожидания" />
      <div className="divide-hairline mx-5 overflow-hidden rounded-card bg-surface shadow-hairline">
        <AnimatePresence initial={false}>
          {list.map((q) => {
            const ready = q.status === "ready";
            const progress = ready ? 1 : 1 - q.position / q.initialPosition + 0.04;
            return (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3.5 px-4 py-3.5"
              >
                {q.cover && <Photo src={q.cover} className="h-12 w-12 shrink-0 rounded-[14px]" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[15px] font-medium">{q.entityName}</p>
                    <p className="t-num shrink-0 text-[15px] font-semibold">#{q.position}</p>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-ink-3">
                    <LiveDot tone={ready ? "live" : "warn"} pulse={ready} size={6} />
                    {ready ? "Место готово — подтвердите" : `${q.resource ?? q.entityKind} · ${fmtEta(q.etaSec)}`}
                  </p>
                  <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-stone">
                    <motion.div
                      className={`h-full rounded-full ${ready ? "bg-live" : "bg-ink"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(Math.min(1, progress) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    />
                  </div>
                </div>
                <IconButton
                  icon={X}
                  label="Покинуть очередь"
                  variant="plain"
                  size={32}
                  iconSize={15}
                  className="-mr-1 text-ink-3"
                  onClick={() => handleLeave(q.id)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
