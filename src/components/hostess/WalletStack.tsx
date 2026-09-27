import { useState } from "react";
import { motion } from "framer-motion";
import { hapticSelect, hapticTick } from "@/lib/haptics";
import { loyaltyCards } from "@/data/hostess";

const CARD_H = 176;
const PEEK = 46; // видимая «шапка» карты в свёрнутой колоде
const SPREAD = CARD_H + 12;

/**
 * Wallet-style vertical deck of venue membership cards.
 * Collapsed: only the headers peek. Tap to fan out; tap a card to bring it forward.
 * Cards use muted material tones — no saturated gradients.
 */
export function WalletStack() {
  const [order, setOrder] = useState<string[]>(loyaltyCards.map((c) => c.id));
  const [expanded, setExpanded] = useState(false);

  const cards = order
    .map((id) => loyaltyCards.find((c) => c.id === id))
    .filter((c): c is (typeof loyaltyCards)[number] => Boolean(c));

  const n = cards.length;
  const collapsedH = CARD_H + (n - 1) * PEEK;
  const expandedH = n * SPREAD - (SPREAD - CARD_H);

  const handleCard = (id: string) => {
    if (!expanded) {
      hapticSelect();
      setExpanded(true);
      return;
    }
    hapticTick();
    // Выбранная карта уходит в конец колоды — там она видна целиком.
    setOrder((prev) => [...prev.filter((x) => x !== id), id]);
    setExpanded(false);
  };

  return (
    <motion.div
      className="relative mx-5"
      animate={{ height: expanded ? expandedH : collapsedH }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      style={{ height: collapsedH }}
    >
      {cards.map((c, i) => (
        <motion.button
          key={c.id}
          type="button"
          onClick={() => handleCard(c.id)}
          initial={false}
          animate={{ y: expanded ? i * SPREAD : i * PEEK }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className={`absolute inset-x-0 overflow-hidden rounded-card bg-gradient-to-br ${c.gradient} px-5 py-4 text-left text-white shadow-[0_-1px_0_rgb(255_255_255/0.08)_inset,0_14px_30px_-18px_rgb(23_21_15/0.6)]`}
          style={{ height: CARD_H, zIndex: i + 1 }}
          aria-label={`${c.name}, ${c.tier}`}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[16px] font-semibold tracking-[-0.015em]">{c.name}</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">{c.tier}</p>
              </div>
              <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/55">Hostess</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] text-white/60">Бонусы</p>
                <p className="t-num text-[26px] font-semibold leading-none tracking-[-0.02em]">
                  {c.points.toLocaleString("ru-RU")}
                </p>
              </div>
              <p className="t-num text-[12px] tracking-[0.12em] text-white/50">•• {String(c.points).slice(-4)}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
