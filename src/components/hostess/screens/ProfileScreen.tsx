import { useState } from "react";
import {
  Settings,
  ChevronRight,
  Split,
  Wallet,
  Heart,
  Clock,
  User,
  Phone,
  Mail,
  Utensils,
  SlidersHorizontal,
  Bell,
  Globe,
  HelpCircle,
  Shield,
  LogOut,
} from "lucide-react";
import { friends, history, money } from "@/data/hostess";
import { Switch } from "@/components/ui/switch";
import { BentoCard, BentoHeader } from "../Bento";
import { WalletStack } from "../WalletStack";
import { MyQueuesSection } from "../waitlist/MyQueuesSection";
import { BusinessProfileScreen } from "./BusinessProfileScreen";

const CUISINES = [
  "Казахская",
  "Грузинская",
  "Итальянская",
  "Азиатская",
  "Стейк-хаус",
  "Веган",
  "Авторская",
  "Французская",
];

export function ProfileScreen({
  onSplitBill,
  onLogout,
  variant = "guest",
}: {
  onSplitBill?: () => void;
  onLogout: () => void;
  variant?: "guest" | "business";
}) {
  if (variant === "business") {
    return <BusinessProfileScreen onLogout={onLogout} />;
  }

  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(["Казахская", "Грузинская"]);
  const [language, setLanguage] = useState("Русский");

  const toggleCuisine = (c: string) =>
    setSelectedCuisines((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="h-full overflow-y-auto overscroll-none bg-gray-50 pb-[calc(80px+env(safe-area-inset-bottom)+16px)]">
      <div className="flex items-center justify-between px-5 pt-14">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">Профиль</p>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-soft">
          <Settings className="h-4 w-4" strokeWidth={1.5} />
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

      {/* Активные очереди (Task 4b) */}
      <MyQueuesSection />

      {/* Account */}
      <div className="mt-6 px-5">
        <BentoHeader
          title="Аккаунт"
          icon={<User className="h-4 w-4 text-primary" strokeWidth={1.5} />}
          className="pb-3"
        />
        <BentoCard className="divide-y divide-border/60" padded={false}>
          {[
            { icon: User, label: "Имя", value: "Айгерим Куатова" },
            { icon: Phone, label: "Телефон", value: "+7 701 234 56 78" },
            { icon: Mail, label: "Email", value: "aigerim@hostess.kz" },
          ].map((row) => (
            <button
              key={row.label}
              className="flex w-full items-center gap-3 p-3 text-left transition-colors active:bg-neutral-50"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100">
                <row.icon className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-neutral-500">{row.label}</p>
                <p className="text-sm font-semibold">{row.value}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
            </button>
          ))}
        </BentoCard>
      </div>

      {/* Preferences */}
      <div className="mt-6 px-5">
        <BentoHeader
          title="Предпочтения"
          icon={<Utensils className="h-4 w-4 text-primary" strokeWidth={1.5} />}
          className="pb-3"
        />
        <BentoCard>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
            Избранные кухни
          </p>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => {
              const on = selectedCuisines.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    on
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-neutral-50 p-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
              <p className="text-sm font-semibold">Фильтры поиска</p>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          </div>
        </BentoCard>
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

      {/* Кошелёк — вертикальная колода карт (Task 4) */}
      <div className="mt-6">
        <BentoHeader
          title="Кошелёк"
          icon={<Wallet className="h-4 w-4" strokeWidth={1.5} />}
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
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
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
            <Split className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Разделить счёт</p>
            <p className="text-xs opacity-70">Ауыл · сегодня · 4 гостя</p>
          </div>
          <ChevronRight className="h-5 w-5 opacity-60" strokeWidth={1.5} />
        </button>
      </div>

      {/* Settings */}
      <div className="mt-6 px-5">
        <BentoHeader
          title="Настройки"
          icon={<Settings className="h-4 w-4 text-primary" strokeWidth={1.5} />}
          className="pb-3"
        />
        <BentoCard className="divide-y divide-border/60" padded={false}>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100">
                <Bell className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold">Уведомления</p>
                <p className="text-[11px] text-neutral-500">Бронирования, акции, напоминания</p>
              </div>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100">
                <Mail className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold">Маркетинг</p>
                <p className="text-[11px] text-neutral-500">Советы и персональные предложения</p>
              </div>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} />
          </div>
          <button className="flex w-full items-center justify-between p-3 text-left transition-colors active:bg-neutral-50">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100">
                <Globe className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold">Язык</p>
                <p className="text-[11px] text-neutral-500">{language}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          </button>
          <button className="flex w-full items-center justify-between p-3 text-left transition-colors active:bg-neutral-50">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100">
                <Shield className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold">Безопасность</p>
                <p className="text-[11px] text-neutral-500">Пароль, Face ID</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          </button>
          <button className="flex w-full items-center justify-between p-3 text-left transition-colors active:bg-neutral-50">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100">
                <HelpCircle className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold">Помощь</p>
                <p className="text-[11px] text-neutral-500">FAQ и поддержка</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          </button>
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-between p-3 text-left text-red-600 transition-colors active:bg-red-50"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50">
                <LogOut className="h-4 w-4 text-red-500" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold">Выйти</p>
            </div>
          </button>
        </BentoCard>
      </div>

      {/* History */}
      <div className="mt-6 px-5">
        <BentoHeader
          title="История посещений"
          icon={<Clock className="h-4 w-4" strokeWidth={1.5} />}
          className="pb-3"
        />
        <BentoCard className="divide-y divide-border/60" padded={false}>
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100">
                <Heart className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
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
