import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { hapticAlert, hapticSuccess } from "@/lib/haptics";
import type { JoinWaitlistInput, WaitlistEntry } from "./types";

// Ускоренная симуляция для демо: «человек перед вами» уходит каждые ~15 сек.
const SEC_PER_PERSON = 15;
// Окно на подтверждение освободившегося слота — 5:00.
const CLAIM_WINDOW_MS = 5 * 60 * 1000;

type WaitlistContextValue = {
  queues: WaitlistEntry[];
  /** Запись, для которой освободился слот (драйвер полноэкранного оверлея). */
  readyEntry: WaitlistEntry | null;
  join: (input: JoinWaitlistInput) => WaitlistEntry;
  leave: (id: string) => void;
  /** Подтвердить слот → запись помечается claimed и убирается из активных. */
  claim: (id: string) => void;
  /** Пропустить слот → остаёмся в очереди на следующий свободный. */
  pass: (id: string) => void;
  isQueued: (entityId: string) => boolean;
};

const WaitlistContext = createContext<WaitlistContextValue | null>(null);

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [queues, setQueues] = useState<WaitlistEntry[]>([]);
  const readyFired = useRef<Set<string>>(new Set());

  const join = useCallback((input: JoinWaitlistInput): WaitlistEntry => {
    const position = Math.max(1, input.peopleAhead + 1);
    const entry: WaitlistEntry = {
      id: `wl-${input.entityId}-${Date.now()}`,
      entityId: input.entityId,
      entityName: input.entityName,
      entityKind: input.entityKind,
      cover: input.cover,
      resource: input.resource,
      status: "waiting",
      position,
      initialPosition: position,
      etaSec: Math.max(input.etaMin * 60, position * SEC_PER_PERSON),
      joinedAt: Date.now(),
    };
    setQueues((prev) => [...prev, entry]);
    return entry;
  }, []);

  const leave = useCallback((id: string) => {
    readyFired.current.delete(id);
    setQueues((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const claim = useCallback((id: string) => {
    hapticSuccess();
    readyFired.current.delete(id);
    setQueues((prev) => prev.filter((q) => q.id !== id));
  }, []);

  // Пропустить: возвращаемся в ожидание, следующий слот — через одну «персону».
  const pass = useCallback((id: string) => {
    readyFired.current.delete(id);
    setQueues((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: "waiting",
              claimDeadline: undefined,
              position: Math.max(1, q.position),
              etaSec: SEC_PER_PERSON,
            }
          : q,
      ),
    );
  }, []);

  const isQueued = useCallback(
    (entityId: string) => queues.some((q) => q.entityId === entityId),
    [queues],
  );

  // Тик симуляции — раз в секунду продвигаем очередь и переводим в "ready".
  useEffect(() => {
    if (queues.length === 0) return;
    const t = setInterval(() => {
      setQueues((prev) =>
        prev.map((q) => {
          if (q.status !== "waiting") return q;
          const etaSec = Math.max(0, q.etaSec - 1);
          const position = Math.max(1, Math.ceil(etaSec / SEC_PER_PERSON));
          if (etaSec <= 0) {
            if (!readyFired.current.has(q.id)) {
              readyFired.current.add(q.id);
              hapticAlert();
            }
            return {
              ...q,
              etaSec: 0,
              position: 1,
              status: "ready",
              claimDeadline: Date.now() + CLAIM_WINDOW_MS,
            };
          }
          return { ...q, etaSec, position };
        }),
      );
    }, 1000);
    return () => clearInterval(t);
  }, [queues.length]);

  // Автопропуск, если окно подтверждения истекло.
  useEffect(() => {
    const ready = queues.filter((q) => q.status === "ready" && q.claimDeadline);
    if (ready.length === 0) return;
    const t = setInterval(() => {
      const now = Date.now();
      ready.forEach((q) => {
        if (q.claimDeadline && now > q.claimDeadline) pass(q.id);
      });
    }, 1000);
    return () => clearInterval(t);
  }, [queues, pass]);

  const readyEntry = useMemo(() => queues.find((q) => q.status === "ready") ?? null, [queues]);

  const value = useMemo(
    () => ({ queues, readyEntry, join, leave, claim, pass, isQueued }),
    [queues, readyEntry, join, leave, claim, pass, isQueued],
  );

  return <WaitlistContext.Provider value={value}>{children}</WaitlistContext.Provider>;
}

export function useWaitlist() {
  const ctx = useContext(WaitlistContext);
  if (!ctx) throw new Error("useWaitlist must be used within WaitlistProvider");
  return ctx;
}
