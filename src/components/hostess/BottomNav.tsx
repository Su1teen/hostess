import { motion } from "framer-motion";
import { CalendarDays, Compass, ConciergeBell, Map, UserRound } from "lucide-react";
import { hapticTick } from "@/lib/haptics";
import { ICON_STROKE, spring } from "./system";
import type { Screen } from "./types";

const items: { key: Screen; label: string; Icon: typeof Map }[] = [
  { key: "map", label: "Карта", Icon: Map },
  { key: "catalog", label: "Места", Icon: Compass },
  { key: "ai", label: "Консьерж", Icon: ConciergeBell },
  { key: "calendar", label: "Брони", Icon: CalendarDays },
  { key: "profile", label: "Профиль", Icon: UserRound },
];

/**
 * Floating tab bar — one quiet frosted material, labelled tabs,
 * a soft stone "lens" slides to the selected tab.
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
    <motion.div
      initial={false}
      animate={{ y: hidden ? 140 : 0, opacity: hidden ? 0 : 1 }}
      transition={spring}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(var(--sab)+var(--nav-gap))]"
    >
      <nav
        className="frost pointer-events-auto grid h-[var(--nav-h)] w-full max-w-[400px] grid-cols-5 rounded-[26px] p-1.5 shadow-[0_0_0_1px_rgb(23_21_15/0.06),0_18px_40px_-18px_rgb(23_21_15/0.35)]"
        aria-label="Навигация"
      >
        {items.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
              onClick={() => {
                if (!isActive) hapticTick();
                onChange(key);
              }}
              className="relative flex flex-col items-center justify-center gap-[3px] rounded-[20px] outline-none"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-lens"
                  className="absolute inset-0 rounded-[20px] bg-[rgb(23_21_15/0.06)]"
                  transition={spring}
                />
              )}
              <Icon
                className={`relative h-[21px] w-[21px] transition-colors duration-200 ${
                  isActive ? "text-ink" : "text-ink-3"
                }`}
                strokeWidth={isActive ? 1.9 : ICON_STROKE}
              />
              <span
                className={`relative text-[10.5px] leading-none tracking-[-0.005em] transition-colors duration-200 ${
                  isActive ? "font-semibold text-ink" : "font-medium text-ink-3"
                }`}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </motion.div>
  );
}
