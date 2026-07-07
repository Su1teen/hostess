import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loyaltyCards } from "@/data/hostess";

/* ── Constants ────────────────────────────────────────────────────── */

const CARD_OFFSET = 24;   // px visible per stacked card
const BASE_SCALE = 0.94;  // scale decrement per depth level

/* ── Component ────────────────────────────────────────────────────── */

export function WalletCards() {
  // Order array controls stacking — first element is on top
  const [order, setOrder] = useState(() => loyaltyCards.map((_, i) => i));

  // Bring the tapped card to the front
  const bringToFront = useCallback((tappedIndex: number) => {
    setOrder((prev) => {
      if (prev[0] === tappedIndex) return prev; // already on top
      return [tappedIndex, ...prev.filter((i) => i !== tappedIndex)];
    });
  }, []);

  return (
    <div
      className="relative mx-auto w-full"
      // Dynamic height: top card full height + offsets for stacked cards
      style={{ height: `${176 + (order.length - 1) * CARD_OFFSET}px` }}
    >
      <AnimatePresence>
        {order.map((cardIdx, stackPos) => {
          const card = loyaltyCards[cardIdx];

          // Depth-based transforms
          const yOffset = stackPos * CARD_OFFSET;
          const scale = 1 - stackPos * (1 - BASE_SCALE);
          const zIndex = order.length - stackPos;

          return (
            <motion.button
              key={card.id}
              layout
              onClick={() => bringToFront(cardIdx)}
              className={`absolute inset-x-0 top-0 h-44 w-full overflow-hidden rounded-3xl bg-gradient-to-br ${card.gradient} p-5 text-left text-white shadow-xl`}
              style={{ zIndex }}
              initial={false}
              animate={{
                y: yOffset,
                scale,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 28,
              }}
              whileTap={{ scale: scale * 0.97 }}
            >
              {/* Decorative radial glows */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2), transparent 40%)",
                }}
              />

              {/* Card content */}
              <div className="relative flex h-full flex-col justify-between">
                {/* Top row: tier + brand badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest opacity-70">
                      {card.tier}
                    </p>
                    <p className="text-lg font-semibold">{card.name}</p>
                  </div>
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
                    Hostess
                  </span>
                </div>

                {/* Bottom row: bonus points + masked card number */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] opacity-70">Бонусы</p>
                    <p className="text-2xl font-semibold tracking-tight">
                      {card.points.toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <p className="text-xs font-medium tracking-widest opacity-50">
                    •••• •••• •••• 4242
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
