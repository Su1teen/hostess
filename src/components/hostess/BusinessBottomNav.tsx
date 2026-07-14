import { motion } from "framer-motion";
import { LayoutDashboard, Sofa, Utensils, UserRound } from "lucide-react";

export type BusinessScreen = "dashboard" | "bookings" | "menu" | "profile";

const items: { key: BusinessScreen; Icon: typeof LayoutDashboard; label: string }[] = [
  { key: "dashboard", Icon: LayoutDashboard, label: "Аналитика" },
  { key: "bookings", Icon: Sofa, label: "Управление залом" },
  { key: "menu", Icon: Utensils, label: "Управление едой" },
  { key: "profile", Icon: UserRound, label: "Аккаунт" },
];

export function BusinessBottomNav({
  active,
  onChange,
}: {
  active: BusinessScreen;
  onChange: (s: BusinessScreen) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <motion.nav
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="glass-frosted pointer-events-auto grid w-full max-w-[320px] grid-cols-4 rounded-[28px] p-1.5 backdrop-blur-xl"
      >
        {items.map(({ key, Icon, label }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className="relative grid min-h-14 min-w-14 place-items-center rounded-[22px] text-neutral-500 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="business-nav-selection"
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
