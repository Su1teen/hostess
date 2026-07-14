import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { X, Flame, Minus, Plus, Check } from "lucide-react";
import { money, type Dish } from "@/data/hostess";

const CTA_BOTTOM = "bottom-[calc(80px+env(safe-area-inset-bottom)+16px)]";
const SCROLL_PB = "pb-[calc(140px+env(safe-area-inset-bottom)+16px)]";

/**
 * Детальная карточка блюда: крупное фото, состав, КБЖУ,
 * количество и добавление к предзаказу.
 * Task 1/2: sticky hero с parallax + floating CTA с отступом от BottomNav.
 */
export function DishModal({
  dish,
  onClose,
  onAdd,
}: {
  dish: Dish;
  onClose: () => void;
  onAdd: (dish: Dish, qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.7]);

  const add = () => {
    setAdded(true);
    onAdd(dish, qty);
    setTimeout(onClose, 650);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-end bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        ref={scrollRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[92%] w-full overflow-y-auto overscroll-none rounded-t-[32px] bg-white shadow-float ${SCROLL_PB}`}
      >
        {/* Фото — sticky + parallax + blending */}
        <div className="sticky top-0 z-0 h-64 w-full overflow-hidden rounded-t-[32px]">
          <motion.img
            src={dish.image}
            alt={dish.name}
            style={{ scale: heroScale, opacity: heroOpacity, originY: 0 }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/95 via-white/80 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="absolute bottom-16 left-4 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {dish.weight} г
          </span>
          <span className="absolute bottom-16 left-24 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 backdrop-blur">
            <Flame className="mr-0.5 -mt-0.5 inline h-3 w-3 text-primary" />
            {dish.kcal} ккал
          </span>
        </div>

        <div className="relative z-10 rounded-t-[32px] bg-white px-5 pt-4">
          <h2 className="text-xl font-semibold tracking-tight">{dish.name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">{dish.desc}</p>

          {/* КБЖУ */}
          {(dish.protein ?? dish.fat ?? dish.carbs) != null && (
            <div className="mt-4 grid grid-cols-4 overflow-hidden rounded-2xl bg-neutral-50 text-center">
              {[
                { l: "Ккал", v: dish.kcal },
                { l: "Белки", v: `${dish.protein}г` },
                { l: "Жиры", v: `${dish.fat}г` },
                { l: "Углев.", v: `${dish.carbs}г` },
              ].map((n) => (
                <div key={n.l} className="p-3">
                  <p className="text-sm font-semibold text-neutral-900">{n.v}</p>
                  <p className="mt-0.5 text-[10px] text-neutral-500">{n.l}</p>
                </div>
              ))}
            </div>
          )}

          {/* Состав */}
          {dish.ingredients && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                Состав
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dish.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Количество — padding-bottom учитывает floating CTA */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full bg-neutral-100 px-2 py-1.5">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-soft"
                aria-label="Меньше"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={() => setQty(Math.min(9, qty + 1))}
                className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-soft"
                aria-label="Больше"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating CTA — над BottomNav */}
        <div className={`pointer-events-none absolute inset-x-0 z-40 px-5 ${CTA_BOTTOM}`}>
          <motion.button
            onClick={add}
            whileTap={{ scale: 0.97 }}
            className={`pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white shadow-float transition-colors ${
              added ? "bg-emerald-500" : "bg-neutral-900"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> Добавлено
              </>
            ) : (
              <>Добавить к предзаказу · {money(dish.price * qty)}</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
