import { Settings, ChevronRight, Split, Wallet, Heart, Clock } from "lucide-react";
import { friends, history, money } from "@/data/hostess";
import { BentoCard, BentoHeader } from "../Bento";
import { WalletStack } from "../WalletStack";
import { MyQueuesSection } from "../waitlist/MyQueuesSection";

export function ProfileScreen({ onSplitBill }: { onSplitBill: () => void }) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-[140px]">
      <div className="flex items-center justify-between px-5 pt-14">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">Профиль</p>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-soft">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
            className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-soft"
            alt=""
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Айгерим К.</h1>
            <p className="text-xs text-neutral-500">Hostess Gold · с 2023</p>
          </div>
        </div>

        {/* Статистика — Bento */}
        <BentoCard className="mt-5 grid grid-cols-3 divide-x divide-border/60" padded={false}>
          {[
            { v: "42", l: "Места" },
            { v: "186k", l: "Потрачено ₸" },
            { v: "17.5k", l: "Бонусы" },
          ].map((s) => (
            <div key={s.l} className="p-4 text-center">
              <p className="text-xl font-semibold">{s.v}</p>
              <p className="text-[11px] text-neutral-500">{s.l}</p>
            </div>
          ))}
        </BentoCard>
      </div>

      {/* Активные очереди (Task 6.4) */}
      <MyQueuesSection />

      {/* Stories */}
      <div className="mt-6">
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5">
          {[{ name: "Вы", add: true }, ...friends].map((f, i) => (
            <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1">
              <div
                className={`rounded-full p-[2px] ${"add" in f && f.add ? "bg-neutral-200" : "bg-gradient-to-tr from-primary via-pink-400 to-purple-500"}`}
              >
                <div className="rounded-full bg-white p-[2px]">
                  <img
                    src={
                      "avatar" in f && f.avatar
                        ? f.avatar
                        : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"
                    }
                    className="h-12 w-12 rounded-full object-cover"
                    alt=""
                  />
                </div>
              </div>
              <span className="truncate text-[10px] text-neutral-600">{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Кошелёк — вертикальная колода карт (Task 4) */}
      <div className="mt-6">
        <BentoHeader
          title="Кошелёк"
          icon={<Wallet className="h-4 w-4" />}
          className="px-5 pb-3"
          action={<span className="text-xs text-neutral-500">Нажмите, чтобы раскрыть</span>}
        />
        <WalletStack />
      </div>

      {/* Friends */}
      <div className="mt-6 px-5">
        <BentoHeader
          title="Друзья"
          className="pb-3"
          action={<span className="text-xs text-neutral-500">Управлять</span>}
        />
        <div className="space-y-2">
          {friends.slice(0, 4).map((f) => (
            <BentoCard key={f.id} className="flex items-center gap-3" padded={false}>
              <div className="flex flex-1 items-center gap-3 p-2.5">
                <img src={f.avatar} className="h-11 w-11 rounded-full object-cover" alt="" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{f.name}</p>
                  <p className="text-xs text-neutral-500">{f.lastSeen}</p>
                </div>
                <span className="mr-2.5 grid h-8 w-8 place-items-center rounded-full bg-neutral-100">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>

      {/* Split bill */}
      <div className="mt-6 px-5">
        <button
          onClick={onSplitBill}
          className="flex w-full items-center gap-3 rounded-[24px] bg-neutral-900 p-4 text-left text-white shadow-float"
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary">
            <Split className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Разделить счёт</p>
            <p className="text-xs opacity-70">Ауыл · сегодня · 4 гостя</p>
          </div>
          <ChevronRight className="h-5 w-5 opacity-60" />
        </button>
      </div>

      {/* History */}
      <div className="mt-6 px-5">
        <BentoHeader
          title="История посещений"
          icon={<Clock className="h-4 w-4" />}
          className="pb-3"
        />
        <BentoCard className="divide-y divide-border/60" padded={false}>
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100">
                <Heart className="h-4 w-4 text-neutral-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{h.place}</p>
                <p className="text-xs text-neutral-500">{h.when}</p>
              </div>
              <p className="text-sm font-semibold">{money(h.sum)}</p>
            </div>
          ))}
        </BentoCard>
      </div>
    </div>
  );
}
