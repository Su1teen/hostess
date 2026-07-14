import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Minus, Plus, Check } from "lucide-react";
import type { Dish } from "@/data/hostess";
import { money } from "@/data/hostess";

export type OrderItem = { dish: Dish; qty: number };

export function MenuOrderSheet({
  open,
  onOpenChange,
  menu,
  orders,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: { section: string; items: Dish[] }[];
  orders: OrderItem[];
  onUpdate: (dish: Dish, qty: number) => void;
}) {
  const qty = (dish: Dish) => orders.find((o) => o.dish.id === dish.id)?.qty ?? 0;

  const total = orders.reduce((sum, o) => sum + o.dish.price * o.qty, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85%] rounded-t-[32px] p-0">
        <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
          <SheetTitle className="text-base">Меню · добавить заказ</SheetTitle>
          <SheetDescription className="sr-only">Меню ресторана</SheetDescription>
        </SheetHeader>

        <div className="h-[calc(100%-140px)] overflow-y-auto p-5">
          {menu.map((section) => (
            <div key={section.section} className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                {section.section}
              </p>
              <div className="space-y-2">
                {section.items.map((dish) => {
                  const q = qty(dish);
                  return (
                    <div
                      key={dish.id}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white p-3"
                    >
                      <img src={dish.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{dish.name}</p>
                        <p className="text-[11px] text-neutral-500">{money(dish.price)}</p>
                      </div>
                      {q === 0 ? (
                        <button
                          type="button"
                          onClick={() => onUpdate(dish, 1)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-white"
                          aria-label="Добавить"
                        >
                          <Plus className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 rounded-full bg-neutral-100 p-1">
                          <button
                            type="button"
                            onClick={() => onUpdate(dish, q - 1)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white"
                          >
                            <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                          <span className="w-5 text-center text-sm font-semibold">{q}</span>
                          <button
                            type="button"
                            onClick={() => onUpdate(dish, q + 1)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white"
                          >
                            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {orders.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 border-t border-border/60 bg-white p-4">
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm text-neutral-500">{orders.length} позиций</span>
              <span className="text-lg font-semibold">{money(total)}</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white"
            >
              <Check className="h-4 w-4" strokeWidth={1.5} />
              Готово
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
