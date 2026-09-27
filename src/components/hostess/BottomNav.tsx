import { motion } from "framer-motion";
import { CalendarDays, Compass, ConciergeBell, Map, UserRound } from "lucide-react";
import { hapticTick } from "@/lib/haptics";
import { spring } from "./system";
import type { Screen } from "./types";

const items: { key: Screen; label: string; Icon: typeof Map }[] = [
  { key: "map", label: "Карта", Icon: Map },
  { key: "catalog", label: "Места", Icon: Compass },
  { key: "ai", label: "Консьерж", Icon: ConciergeBell },
  { key: "calendar", label: "Брони", Icon: CalendarDays },
  { key: "profile", label: "Профиль", Icon: UserRound },
];

/**
 * Docked tab bar — a first-party-feeling white surface with a single
 * hairline, no glass slab. Selection = stronger icon + label weight and a
 * short ink indicator that slides along the top edge.
 */
export function BottomNav({
  active,
  onChange,
  hidden = false,
}: {
  active: Screen;
  onChange: (s: Screen) => void;
  hidden?: boolean;
}) {
  return (
    <motion.nav
      initial={false}
      animate={{ y: hidden ? "110%" : "0%" }}
      transition={spring}
      aria-label="Навигация"
      className="absolute inset-x-0 bottom-0 z-50 border-t border-line bg-white/[0.97] pb-[var(--sab)] backdrop-blur-sm"
    >
      <div className="mx-auto grid h-[var(--nav-h)] max-w-[480px] grid-cols-5">
        {items.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 700, damping: 32 }}
              onClick={() => {
                if (!isActive) hapticTick();
                onChange(key);
              }}
              className="relative flex flex-col items-center justify-center gap-1 outline-none"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute -top-px h-[2px] w-6 rounded-full bg-ink"
                  transition={spring}
                />
              )}
              <Icon
                className={`h-[22px] w-[22px] transition-colors duration-200 ${isActive ? "text-ink" : "text-ink-3"}`}
                strokeWidth={isActive ? 2 : 1.6}
              />
              <span
                className={`text-[10.5px] leading-none tracking-[-0.005em] transition-colors duration-200 ${
                  isActive ? "font-semibold text-ink" : "font-medium text-ink-3"
                }`}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
