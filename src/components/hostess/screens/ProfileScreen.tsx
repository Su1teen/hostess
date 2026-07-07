import { Settings, ChevronRight, Split, Wallet, Heart, Clock, Users, BarChart3 } from "lucide-react";
import { friends, money } from "@/data/hostess";
import { motion } from "framer-motion";
import { WalletCards } from "../WalletCards";
import { VisitHistory } from "../VisitHistory";

export function ProfileScreen({ onSplitBill }: { onSplitBill: () => void }) {
  return (
    <div className="h-full overflow-y-auto bg-white pb-[140px]">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-14">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">Профиль</p>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* ── Ваш профиль ────────────────────────────────────────── */}
      <div className="px-5 pt-4">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
          <Heart className="h-4 w-4 text-primary" /> Ваш профиль
        </h2>
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
            className="h-16 w-16 rounded-full object-cover ring-4 ring-neutral-100"
            alt=""
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Айгерим К.</h1>
            <p className="text-xs text-neutral-500">Hostess Gold · с 2023</p>
          </div>
        </div>
      </div>

      {/* ── Статистика ─────────────────────────────────────────── */}
      <div className="px-5 pt-5">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" /> Статистика
        </h2>
        <div className="grid grid-cols-3 overflow-hidden rounded-3xl bg-neutral-50">
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
        </div>
      </div>

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

      {/* ── Кошелёк ────────────────────────────────────────────── */}
      <div className="mt-6">
        <div className="flex items-center justify-between px-5 pb-3">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <Wallet className="h-4 w-4 text-primary" /> Кошелёк
          </h3>
          <button className="text-xs text-neutral-500">Все</button>
        </div>
        <div className="px-5">
          <WalletCards />
        </div>
      </div>

      {/* ── Друзья ─────────────────────────────────────────────── */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between pb-3">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <Users className="h-4 w-4 text-primary" /> Друзья
          </h3>
          <button className="text-xs text-neutral-500">Управлять</button>
        </div>
        <div className="space-y-2">
          {friends.slice(0, 4).map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 hairline">
              <img src={f.avatar} className="h-11 w-11 rounded-full object-cover" alt="" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{f.name}</p>
                <p className="text-xs text-neutral-500">{f.lastSeen}</p>
              </div>
              <button className="rounded-full bg-neutral-100 p-2">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Split bill */}
      <div className="mt-6 px-5">
        <button
          onClick={onSplitBill}
          className="flex w-full items-center gap-3 rounded-2xl bg-neutral-900 p-4 text-left text-white"
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

      {/* ── История посещений ──────────────────────────────────── */}
      <div className="mt-6 px-5">
        <h3 className="flex items-center gap-2 pb-3 text-[15px] font-semibold">
          <Clock className="h-4 w-4 text-primary" /> История посещений
        </h3>
        <VisitHistory />
      </div>
    </div>
  );
}
