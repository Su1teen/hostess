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

export function BottomNav({
  active,
  onChange,
}: {
  active: Screen;
  onChange: (s: Screen) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-4">
      <motion.nav
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="glass pointer-events-auto flex items-center gap-1 rounded-full px-2 py-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)]"
      >
        {items.map(({ key, label, Icon }) => {
          const isActive = active === key;
          const isCenter = key === "ai";
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="relative flex h-11 items-center justify-center px-3"
              aria-label={label}
            >
              {isActive && !isCenter && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-neutral-900"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {isCenter ? (
                <span className="relative -my-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
              ) : (
                <span className={`relative flex items-center gap-1.5 ${isActive ? "text-white" : "text-neutral-700"}`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
              )}
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}
