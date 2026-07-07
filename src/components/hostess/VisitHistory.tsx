import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Star, ChevronDown, Users, HandCoins } from "lucide-react";
import { money, history } from "@/data/hostess";

/* ── Star renderer ────────────────────────────────────────────────── */

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < count ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"
          }`}
        />
      ))}
    </span>
  );
}

/* ── Component ────────────────────────────────────────────────────── */

export function VisitHistory() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl bg-white hairline">
      {history.map((entry) => {
        const isOpen = expandedId === entry.id;

        return (
          <div key={entry.id}>
            {/* ── Collapsed row ────────────────────────────────── */}
            <motion.button
              onClick={() => toggle(entry.id)}
              className="flex w-full items-center gap-3 p-3 text-left"
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon circle */}
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${entry.color}`}
              >
                <Heart className="h-4 w-4" />
              </div>

              {/* Venue + date */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{entry.place}</p>
                <p className="text-xs text-neutral-500">{entry.when}</p>
              </div>

              {/* Total + chevron */}
              <p className="text-sm font-semibold">{money(entry.sum)}</p>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </motion.div>
            </motion.button>

            {/* ── Expanded details (accordion) ─────────────────── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 border-t border-neutral-100 px-4 py-3">
                    {/* Ordered items */}
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                        Заказ
                      </p>
                      <div className="space-y-1">
                        {entry.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-neutral-700">
                              {item.name}{" "}
                              {item.qty > 1 && (
                                <span className="text-neutral-400">×{item.qty}</span>
                              )}
                            </span>
                            <span className="font-medium">
                              {money(item.price * item.qty)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Companions */}
                    {entry.companions.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-neutral-400" />
                        <p className="text-xs text-neutral-600">
                          {entry.companions.join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Tips */}
                    {entry.tips > 0 && (
                      <div className="flex items-center gap-2">
                        <HandCoins className="h-3.5 w-3.5 text-neutral-400" />
                        <p className="text-xs text-neutral-600">
                          Чаевые:{" "}
                          <span className="font-medium">{money(entry.tips)}</span>
                        </p>
                      </div>
                    )}

                    {/* Review */}
                    <div className="flex items-start gap-2 rounded-xl bg-neutral-50 p-2.5">
                      <Stars count={entry.review.stars} />
                      <p className="text-xs leading-snug text-neutral-600">
                        {entry.review.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
