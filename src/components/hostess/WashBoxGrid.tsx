import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { occupancyColor, occupancyLabel, type WashBox } from "@/data/hostess";

/**
 * Сетка боксов автомойки (замена «плана зала» для ресторанов).
 * Цветовая кодировка: зелёный — свободно, оранжевый — скоро освободится,
 * красный — занято надолго. У занятых боксов — анимированный прогресс-бар
 * и подпись «Освободится в …».
 */
export function WashBoxGrid({
  boxes,
  selected,
  onSelect,
}: {
  boxes: WashBox[];
  selected: string | null;
  onSelect: (box: WashBox) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-neutral-900">Боксы мойки</span>
        <span className="flex items-center gap-3 text-[10px] text-neutral-500">
          {(["available", "moderate", "busy"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: occupancyColor[s] }}
              />
              {occupancyLabel[s]}
            </span>
          ))}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {boxes.map((b) => {
          const color = occupancyColor[b.status];
          const free = b.status === "available";
          const isSelected = selected === b.id;
          return (
            <motion.button
              key={b.id}
              type="button"
              whileTap={{ scale: free ? 0.96 : 1 }}
              onClick={() => onSelect(b)}
              className="relative h-24 overflow-hidden rounded-[20px] border p-3 text-left transition-all"
              style={{
                borderColor: isSelected ? color : "transparent",
                background: `color-mix(in oklab, ${color} ${free ? 14 : 12}%, white)`,
                boxShadow: isSelected ? `0 0 0 2px ${color}` : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">{b.label}</span>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                />
              </div>

              {free ? (
                <span className="mt-1 inline-block text-[11px] font-medium text-emerald-600">
                  Свободен сейчас
                </span>
              ) : (
                <>
                  <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-neutral-600">
                    <Lock className="h-3 w-3" /> Освободится в {b.freeAt}
                  </span>
                  {/* Анимированный прогресс-бар текущей мойки */}
                  <div className="absolute inset-x-3 bottom-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/70">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((b.progress ?? 0) * 100)}%` }}
                        transition={{ type: "spring", stiffness: 80, damping: 18 }}
                      />
                    </div>
                  </div>
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
