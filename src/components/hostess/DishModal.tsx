import { useState } from "react";
import { Check } from "lucide-react";
import { money, type Dish } from "@/data/hostess";
import { hapticSuccess } from "@/lib/haptics";
import { dishHighlight } from "./menu";
import { BottomSheet, Button, Photo, Stepper, Ticker } from "./system";

/**
 * Dish detail — editorial photo, story, composition, quiet nutrition line,
 * quantity + add in the docked bar.
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
  const hl = dishHighlight(dish);
  const hasNutrition = dish.protein != null || dish.fat != null || dish.carbs != null;

  const add = () => {
    if (added) return;
    hapticSuccess();
    setAdded(true);
    onAdd(dish, qty);
    setTimeout(onClose, 600);
  };

  return (
    <BottomSheet
      onClose={onClose}
      z="z-[130]"
      footer={
        <div className="flex items-center gap-3">
          <Stepper value={qty} onChange={setQty} min={1} max={9} />
          <Button size="lg" block onClick={add} className="flex-1">
            {added ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2} /> Добавлено
              </>
            ) : (
              <>
                Добавить · <Ticker value={money(dish.price * qty)} />
              </>
            )}
          </Button>
        </div>
      }
    >
      <Photo src={dish.image} alt={dish.name} className="aspect-[4/3] w-full" eager />
      <div className="px-5 pb-6 pt-6">
        {hl && <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-brass">{hl}</p>}
        <h2 className="t-title mt-1.5">{dish.name}</h2>
        <p className="t-body mt-3 text-ink-2">{dish.desc}</p>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="t-num text-[20px] font-semibold tracking-[-0.02em]">{money(dish.price)}</span>
          {dish.weight > 0 && <span className="t-num text-[13px] text-ink-3">{dish.weight} г</span>}
        </div>

        {hasNutrition && (
          <div className="mt-6 grid grid-cols-4 divide-x divide-line border-y border-line py-3.5 text-center">
            {[
              { l: "ккал", v: dish.kcal },
              { l: "белки", v: `${dish.protein ?? 0} г` },
              { l: "жиры", v: `${dish.fat ?? 0} г` },
              { l: "углеводы", v: `${dish.carbs ?? 0} г` },
            ].map((n) => (
              <div key={n.l}>
                <p className="t-num text-[15px] font-semibold">{n.v}</p>
                <p className="mt-0.5 text-[11px] text-ink-3">{n.l}</p>
              </div>
            ))}
          </div>
        )}

        {dish.ingredients && dish.ingredients.length > 0 && (
          <div className="mt-6">
            <p className="t-micro">Состав</p>
            <p className="t-callout mt-2 text-ink-2">
              {dish.ingredients.map((s, i) => (i === 0 ? s[0].toUpperCase() + s.slice(1) : s)).join(", ")}
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
