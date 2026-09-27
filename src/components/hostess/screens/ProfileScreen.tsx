import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Globe,
  HelpCircle,
  LogOut,
  Mail,
  Phone,
  Settings,
  Shield,
  Split,
  User,
} from "lucide-react";
import { friends, history, money } from "@/data/hostess";
import { Switch } from "@/components/ui/switch";
import { WalletStack } from "../WalletStack";
import { MyQueuesSection } from "../waitlist/MyQueuesSection";
import { BusinessProfileScreen } from "./BusinessProfileScreen";
import { Chip, IconButton, ListRow, RowGroup, SectionHeader } from "../system";

const CUISINES = [
  "Казахская",
  "Европейская",
  "Итальянская",
  "Азиатская",
  "Стейк-хаус",
  "Веган",
  "Авторская",
  "Французская",
];

const TIER = { name: "Gold", next: "Platinum", points: 17480, target: 20000 };

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
  return <GuestProfile onSplitBill={onSplitBill} onLogout={onLogout} />;
}

function GuestProfile({ onSplitBill, onLogout }: { onSplitBill?: () => void; onLogout: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(["Казахская", "Европейская"]);

  const toggleCuisine = (c: string) =>
    setSelectedCuisines((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const progress = TIER.points / TIER.target;

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-none bg-canvas pb-nav">
      <div className="flex items-center justify-between px-5 pt-safe">
        <p className="t-micro pt-2">Профиль</p>
        <IconButton icon={Settings} label="Настройки" variant="stone" />
      </div>

      {/* Member header */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
            className="h-[72px] w-[72px] rounded-full object-cover"
            alt=""
          />
          <div className="min-w-0">
            <h1 className="t-title truncate">Айгерим Куатова</h1>
            <p className="t-caption mt-1">Участник с 2023 · Астана</p>
          </div>
        </div>
      </div>

      {/* Membership card — light, precise, membership-like */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-5 mt-6 overflow-hidden rounded-hero bg-surface p-5 shadow-soft"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brass">Hostess {TIER.name}</p>
          <p className="t-num text-[11px] font-medium tracking-[0.12em] text-ink-3">№ 0427 1983</p>
        </div>
        <p className="t-num mt-7 text-[44px] font-semibold leading-none tracking-[-0.04em]">
          {TIER.points.toLocaleString("ru-RU")}
        </p>
        <p className="t-caption mt-1.5">бонусов · 1 бонус = 1 ₸</p>

        <div className="mt-6">
          <div className="h-[3px] overflow-hidden rounded-full bg-stone">
            <motion.div
              className="h-full rounded-full bg-ink"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="t-num mt-2 text-[12.5px] text-ink-2">
            Ещё {(TIER.target - TIER.points).toLocaleString("ru-RU")} до {TIER.next}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4">
          {[
            { v: "5%", l: "Кэшбэк" },
            { v: "42", l: "Визита" },
            { v: "186k ₸", l: "За год" },
          ].map((s) => (
            <div key={s.l} className="px-3 first:pl-0">
              <p className="t-num text-[17px] font-semibold tracking-[-0.015em]">{s.v}</p>
              <p className="mt-0.5 text-[12px] text-ink-3">{s.l}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mt-10 space-y-10">
        <MyQueuesSection />

        <section className="space-y-4">
          <SectionHeader eyebrow="Клубные карты" title="Кошелёк" action="Все" />
          <WalletStack />
        </section>

        <section className="space-y-4">
          <SectionHeader title="Друзья" action="Управлять" />
          <div className="rail gap-4">
            {friends.map((f) => (
              <div key={f.id} className="w-[72px] shrink-0 snap-start text-center">
                <div className="relative mx-auto h-16 w-16">
                  <img src={f.avatar} className="h-16 w-16 rounded-full object-cover" alt="" />
                  {f.lastSeen.includes("сейчас") && (
                    <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px] border-canvas bg-live" />
                  )}
                </div>
                <p className="mt-2 truncate text-[13px] font-medium">{f.name}</p>
                <p className="truncate text-[11px] text-ink-3">{f.lastSeen.split(" · ")[0]}</p>
              </div>
            ))}
          </div>
          <div className="px-5">
            <RowGroup>
              <ListRow
                icon={Split}
                title="Разделить счёт"
                subtitle="Qazaq Gourmet · сегодня · 4 гостя"
                onClick={onSplitBill}
              />
            </RowGroup>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader eyebrow="История" title="Недавние визиты" action="Все" />
          <div className="px-5">
            <RowGroup>
              {history.slice(0, 5).map((h) => (
                <ListRow
                  key={h.id}
                  leading={
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-stone text-[14px] font-semibold">
                      {h.place[0]}
                    </span>
                  }
                  title={h.place}
                  subtitle={`${h.when} · ${h.companions.length ? `с ${h.companions.slice(0, 2).join(", ")}` : "один"}`}
                  value={money(h.sum)}
                  chevron={false}
                />
              ))}
            </RowGroup>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader eyebrow="Для консьержа" title="Предпочтения" />
          <div className="flex flex-wrap gap-2 px-5">
            {CUISINES.map((c) => (
              <Chip key={c} tone="outline" selected={selectedCuisines.includes(c)} onClick={() => toggleCuisine(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-3 px-5">
          <p className="t-micro px-1">Аккаунт</p>
          <RowGroup>
            <ListRow icon={User} title="Айгерим Куатова" subtitle="Имя" onClick={() => {}} />
            <ListRow icon={Phone} title="+7 701 234 56 78" subtitle="Телефон" onClick={() => {}} />
            <ListRow icon={Mail} title="aigerim@hostess.kz" subtitle="Email" onClick={() => {}} />
          </RowGroup>
        </section>

        <section className="space-y-3 px-5">
          <p className="t-micro px-1">Настройки</p>
          <RowGroup>
            <ListRow
              icon={Bell}
              title="Уведомления"
              subtitle="Брони, листы ожидания, напоминания"
              trailing={<Switch checked={notifications} onCheckedChange={setNotifications} />}
            />
            <ListRow
              icon={Mail}
              title="Персональные предложения"
              trailing={<Switch checked={marketing} onCheckedChange={setMarketing} />}
            />
            <ListRow icon={Globe} title="Язык" value="Русский" onClick={() => {}} />
            <ListRow icon={Shield} title="Безопасность" value="Face ID" onClick={() => {}} />
            <ListRow icon={HelpCircle} title="Помощь и поддержка" onClick={() => {}} />
          </RowGroup>
          <RowGroup>
            <ListRow icon={LogOut} title="Выйти" destructive onClick={onLogout} chevron={false} />
          </RowGroup>
          <p className="t-num pt-2 text-center text-[11.5px] text-ink-3">Hostess · версия 2.0</p>
        </section>
      </div>
    </div>
  );
}
