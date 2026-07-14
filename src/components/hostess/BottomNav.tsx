import { motion } from "framer-motion";
import { CalendarDays, Map, Sparkles, Store, UserRound } from "lucide-react";
import type { Screen } from "./types";

const items: { key: Screen; label: string; Icon: typeof Map }[] = [
  { key: "map", label: "Карта", Icon: Map },
  { key: "catalog", label: "Места", Icon: Store },
  { key: "ai", label: "AI", Icon: Sparkles },
  { key: "calendar", label: "Календарь", Icon: CalendarDays },
  { key: "profile", label: "Профиль", Icon: UserRound },
];

export function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-5">
      <motion.nav
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="glass-frosted pointer-events-auto grid w-full max-w-[360px] grid-cols-5 rounded-[28px] p-1.5 backdrop-blur-xl"
      >
        {items.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className="relative grid min-h-12 min-w-12 place-items-center rounded-[22px] text-neutral-500 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-selection"
                  className="absolute inset-0 rounded-[22px] bg-neutral-900 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.7)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon
                className={`relative h-[21px] w-[21px] transition-colors ${
                  isActive ? "text-white" : "text-neutral-500"
                }`}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}
