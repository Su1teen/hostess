import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListChecks, X } from "lucide-react";
import { BentoCard, BentoHeader } from "../Bento";
import { useWaitlist } from "./WaitlistProvider";
import { ProgressRing } from "./ProgressRing";
import type { WaitlistEntry } from "./types";

const fmtEta = (sec: number) => {
  if (sec <= 0) return "ожидает подтверждения";
  if (sec < 60) return "меньше минуты";
  const m = Math.round(sec / 60);
  return `~${m} мин`;
};

const positionText = (n: number) => {
  const suffix = n === 1 ? "-й" : n === 2 ? "-й" : n === 3 ? "-й" : n === 4 ? "-й" : "-й";
  return `Вы ${n}${suffix} в очереди`;
};

/* ── Моковые активные очереди (Task 4b): показываются в профиле, когда
 *   у пользователя ещё нет реальных записей, чтобы секция не была пустой. ── */
const MOCK_QUEUES: WaitlistEntry[] = [
  {
    id: "mock-kinza",
    entityId: "kinza",
    entityName: "Кинза",
    entityKind: "Ресторан",
    cover:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
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
    cover:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80",
    resource: "Стрижка + укладка",
    status: "waiting",
    position: 1,
    initialPosition: 3,
    etaSec: 45,
    joinedAt: Date.now() - 90000,
  },
  {
    id: "mock-details",
    entityId: "v3",
    entityName: "Details Detailing",
    entityKind: "Автомойка",
    cover:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80",
    resource: "Комплекс мойка · Бокс 2",
    status: "waiting",
    position: 3,
    initialPosition: 6,
    etaSec: 240,
    joinedAt: Date.now() - 60000,
  },
  {
    id: "mock-auyl",
    entityId: "auyl",
    entityName: "Ауыл",
    entityKind: "Ресторан",
    cover:
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80",
    resource: "Столик у окна · 21:00",
    status: "waiting",
    position: 4,
    initialPosition: 7,
    etaSec: 300,
    joinedAt: Date.now() - 200000,
  },
];

/**
 * Раздел «Мои очереди» в профиле (Task 6.4 / 4b): список всех активных
 * очередей с живым статусом, позицией и оставшимся временем. Если реальных
 * очередей нет — показываем моковые, чтобы секция всегда была наполнена.
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
    <div className="mt-6 px-5">
      <BentoHeader
        title="Мои очереди"
        icon={<ListChecks className="h-4 w-4 text-primary" strokeWidth={1.5} />}
        className="pb-3"
        action={
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {list.length}
          </span>
        }
      />
      <div className="space-y-2">
        <AnimatePresence>
          {list.map((q) => {
            const ready = q.status === "ready";
            const progress = ready ? 1 : 1 - q.position / q.initialPosition + 0.001;
            return (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
              >
                <BentoCard className="flex items-center gap-3" padded={false}>
                  {q.cover ? (
                    <img
                      src={q.cover}
                      alt=""
                      className="h-[70px] w-[70px] shrink-0 rounded-l-[24px] object-cover"
                    />
                  ) : null}
                  <div className="flex flex-1 items-center gap-3 py-3 pr-2">
                    <ProgressRing
                      progress={progress}
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
                        {ready
                          ? "Место готово — подтвердите!"
                          : `${positionText(q.position)} · ${fmtEta(q.etaSec)}`}
                      </p>
                      {/* Прогресс-бар позиции в очереди */}
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                        <motion.div
                          className={`h-full rounded-full ${
                            ready ? "bg-emerald-500" : "bg-primary"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(progress * 100)}%` }}
                          transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLeave(q.id)}
                    className="mr-3 flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-500"
                    aria-label="Покинуть очередь"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Отменить
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
