import { motion } from "framer-motion";
import { Map, UtensilsCrossed, Sparkles, Calendar, User } from "lucide-react";
import type { Screen } from "./types";

const items: { key: Screen; label: string; Icon: typeof Map }[] = [
  { key: "map", label: "Карта", Icon: Map },
  { key: "catalog", label: "Места", Icon: UtensilsCrossed },
  { key: "ai", label: "AI", Icon: Sparkles },
  { key: "calendar", label: "Календарь", Icon: Calendar },
  { key: "profile", label: "Профиль", Icon: User },
];

/**
 * iOS-style bottom navigation с 5 вкладками.
 * Активная вкладка подсвечивается pill-анимацией (shared layout).
 * AI-кнопка по центру — выделена акцентным цветом.
 * Теперь с текстовыми подписями для лучшей навигации.
 */
export function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center pb-5">
      <motion.nav
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="glass-frosted pointer-events-auto flex items-center gap-0.5 rounded-full px-2 py-2"
      >
        {items.map(({ key, label, Icon }) => {
          const isActive = active === key;
          const isCenter = key === "ai";
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="relative flex flex-col items-center justify-center px-3 py-1"
              aria-label={label}
            >
              {isActive && !isCenter && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-neutral-200"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {isCenter ? (
                <span className="relative -my-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg shadow-neutral-900/30">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
              ) : (
                <span
                  className={`relative flex flex-col items-center gap-0.5 transition-colors ${
                    isActive ? "text-neutral-900" : "text-neutral-500"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.6} />
                  <span className="text-[9px] font-medium leading-tight">{label}</span>
                </span>
              )}
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}
