import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Flame } from "lucide-react";
import { BentoCard, BentoHeader } from "../Bento";
import { restaurants, money } from "@/data/hostess";

const restaurant = restaurants.find((r) => r.id === "kinza") ?? restaurants[0];

export function BusinessMenuScreen() {
  const [availability, setAvailability] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setAvailability((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="h-full overflow-y-auto overscroll-none bg-gray-50 pb-[calc(80px+env(safe-area-inset-bottom)+16px)] pt-14">
      <div className="px-5">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">Управление едой</p>
        <h1 className="text-2xl tracking-tight">Меню · {restaurant.name}</h1>
      </div>

      <div className="mt-5 px-5">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Добавить блюдо
        </button>
      </div>

      <div className="mt-5 space-y-6 px-5">
        {restaurant.menu.map((section) => (
          <div key={section.section}>
            <BentoHeader title={section.section} className="pb-3" />
            <div className="space-y-2">
              {section.items.map((dish) => {
                const on = availability[dish.id] ?? true;
                return (
                  <motion.div
                    key={dish.id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggle(dish.id)}
                  >
                    <BentoCard className={`flex items-center gap-3 ${!on ? "opacity-50" : ""}`}>
                      <img src={dish.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 text-sm font-semibold">
                          {dish.name}
                          {dish.tags.some((t) => /хит|🔥/.test(t)) && (
                            <Flame className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                          )}
                        </p>
                        <p className="text-[11px] text-neutral-500">{money(dish.price)}</p>
                      </div>
                      <div
                        className={`h-6 w-10 rounded-full p-1 transition-colors ${
                          on ? "bg-primary" : "bg-neutral-200"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white transition-transform ${
                            on ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </BentoCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
