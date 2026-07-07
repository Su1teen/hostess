import { useState } from "react";
import { motion } from "framer-motion";
import { hapticSelect, hapticTick } from "@/lib/haptics";
import { loyaltyCards } from "@/data/hostess";

const CARD_H = 184;
const PEEK = 34; // видимая «шапка» карты в свёрнутой колоде
const SPREAD = CARD_H + 12; // расстояние между картами в раскрытом виде

/**
 * Вертикальная колода карт (Task 4) в стиле Apple Wallet.
 * Свёрнуто: карты перекрывают друг друга, видна только «шапка».
 * Тап по колоде — раскрывает; тап по карте — выносит её наверх и сворачивает.
 * Тактильная отдача при раскрытии/выборе и при прокрутке фокуса.
 */
export function WalletStack() {
  const [order, setOrder] = useState<string[]>(loyaltyCards.map((c) => c.id));
  const [expanded, setExpanded] = useState(false);

  const cards = order
    .map((id) => loyaltyCards.find((c) => c.id === id))
    .filter((c): c is (typeof loyaltyCards)[number] => Boolean(c));

  const n = cards.length;
  const collapsedH = CARD_H + (n - 1) * PEEK;
  const expandedH = n * SPREAD - (SPREAD - CARD_H) + 8;

  const handleCard = (id: string, idx: number) => {
    if (!expanded) {
      hapticSelect();
      setExpanded(true);
      return;
    }
    // Раскрыто: выносим выбранную карту наверх, сворачиваем колоду.
    hapticTick();
    setOrder((prev) => [id, ...prev.filter((x) => x !== id)]);
    setExpanded(false);
    void idx;
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
          layout
          onClick={() => handleCard(c.id, i)}
          animate={{
            y: expanded ? i * SPREAD : i * PEEK,
            scale: expanded ? 1 : 1 - i * 0.02,
          }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className={`absolute inset-x-0 h-[184px] overflow-hidden rounded-[24px] bg-gradient-to-br ${c.gradient} p-5 text-left text-white shadow-xl`}
          style={{ zIndex: n - i }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2), transparent 40%)",
            }}
          />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest opacity-70">{c.tier}</p>
                <p className="text-lg font-semibold">{c.name}</p>
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
                Hostess
              </span>
            </div>
            <div>
              <p className="text-[11px] opacity-70">Бонусы</p>
              <p className="text-2xl font-semibold tracking-tight">
                {c.points.toLocaleString("ru-RU")}
              </p>
            </div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
