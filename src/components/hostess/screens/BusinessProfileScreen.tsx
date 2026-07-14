import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogOut, User, Check, X, AlertCircle, ChevronRight } from "lucide-react";
import { BentoCard, BentoHeader } from "../Bento";
import { money } from "@/data/hostess";

type Notification = {
  id: string;
  type: "request" | "alert";
  name?: string;
  time?: string;
  table?: string;
  guests?: number;
  message: string;
  read: boolean;
  status?: "pending" | "confirmed" | "declined";
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "request",
    name: "Айгерим К.",
    time: "20:00",
    table: "T5 · Основной зал",
    guests: 4,
    message: "Новая заявка на бронирование",
    read: false,
    status: "pending",
  },
  {
    id: "n2",
    type: "request",
    name: "Данияр М.",
    time: "21:30",
    table: "T2 · VIP",
    guests: 6,
    message: "Новая заявка на бронирование",
    read: false,
    status: "pending",
  },
  {
    id: "n3",
    type: "alert",
    message: "Осталось 2 свободных стола на пятничний вечер.",
    read: false,
  },
  {
    id: "n4",
    type: "alert",
    message: "Хинкали Калакури заканчивается — проверьте запасы.",
    read: true,
  },
];

export function BusinessProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unread = notifications.filter((n) => !n.read && n.status !== "declined").length;

  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const accept = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "confirmed", read: true } : n)),
    );

  const decline = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "declined", read: true } : n)),
    );

  return (
    <div className="h-full overflow-y-auto overscroll-none bg-gray-50 pb-[calc(80px+env(safe-area-inset-bottom)+16px)]">
      <div className="px-5 pt-14">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">Аккаунт бизнеса</p>
        <div className="mt-4 flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80"
            alt=""
            className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-soft"
          />
          <div>
            <h1 className="text-2xl tracking-tight">Кинза</h1>
            <p className="text-xs text-neutral-500">Хостес-администратор</p>
          </div>
        </div>
      </div>

      <div className="mt-5 px-5">
        <BentoCard className="grid grid-cols-3 divide-x divide-border/60" padded={false}>
          {[
            { v: "4.8", l: "Рейтинг" },
            { v: "142", l: "Гостей сегодня" },
            { v: money(4500000), l: "Выручка" },
          ].map((s) => (
            <div key={s.l} className="p-4 text-center">
              <p className="text-xl font-semibold">{s.v}</p>
              <p className="text-[11px] text-neutral-500">{s.l}</p>
            </div>
          ))}
        </BentoCard>
      </div>

      <div className="mt-6 px-5">
        <BentoHeader
          title="Уведомления"
          icon={<Bell className="h-4 w-4 text-primary" strokeWidth={1.5} />}
          className="pb-3"
          action={
            unread > 0 ? (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                {unread}
              </span>
            ) : (
              <span className="text-xs text-neutral-500">Нет новых</span>
            )
          }
        />
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              >
                <BentoCard
                  className={`text-left ${n.status === "declined" ? "opacity-50" : ""}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-100">
                      {n.type === "request" ? (
                        <User className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {n.type === "request" && (
                        <>
                          <p className="text-sm font-semibold">
                            {n.name} · {n.guests} чел.
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {n.time} · {n.table}
                          </p>
                        </>
                      )}
                      {n.type === "alert" && <p className="text-sm font-semibold">{n.message}</p>}
                      {n.status === "confirmed" && (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                          Подтверждено
                        </p>
                      )}
                      {n.status === "declined" && (
                        <p className="mt-1 text-[11px] font-semibold text-red-500">Отклонено</p>
                      )}
                      {n.type === "request" && n.status === "pending" && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              accept(n.id);
                            }}
                            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-emerald-500 py-1.5 text-[11px] font-semibold text-white"
                          >
                            <Check className="h-3 w-3" strokeWidth={1.5} />
                            Подтвердить
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              decline(n.id);
                            }}
                            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-red-500 py-1.5 text-[11px] font-semibold text-white"
                          >
                            <X className="h-3 w-3" strokeWidth={1.5} />
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </BentoCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 px-5">
        <BentoCard
          as="button"
          type="button"
          className="flex w-full items-center justify-between text-red-600"
          onClick={onLogout}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50">
              <LogOut className="h-4 w-4 text-red-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold">Выйти</p>
          </div>
          <ChevronRight className="h-4 w-4 text-red-400" strokeWidth={1.5} />
        </BentoCard>
      </div>
    </div>
  );
}
