import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Star, Check, Car, Droplets } from "lucide-react";
import { money, type CarWash, type WashBox } from "@/data/hostess";
import { Checkbox } from "@/components/ui/checkbox";
import { hapticSelect } from "@/lib/haptics";
import { WashBoxGrid } from "./WashBoxGrid";
import { WaitlistButton } from "./waitlist/WaitlistButton";

/**
 * Экран автомойки (Task 5): мультивыбор услуг через чекбоксы, сетка боксов,
 * модалка бронирования с гос-номером / маркой / выбранными услугами.
 * Если свободных боксов нет — вместо брони показывается «Встать в очередь».
 */
export function CarWashSheet({ wash, onClose }: { wash: CarWash; onClose: () => void }) {
  const [selectedServices, setSelectedServices] = useState<string[]>([wash.services[0].id]);
  const [box, setBox] = useState<WashBox | null>(null);
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [booked, setBooked] = useState(false);

  const hasFreeBox = wash.boxes.some((b) => b.status === "available");
  const total = useMemo(
    () =>
      wash.services
        .filter((s) => selectedServices.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0),
    [selectedServices, wash.services],
  );
  const chosen = wash.services.filter((s) => selectedServices.includes(s.id));

  const toggle = (id: string) => {
    hapticSelect();
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const onSelectBox = (b: WashBox) => {
    if (b.status !== "available") return;
    hapticSelect();
    setBox(b);
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
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[94%] w-full overflow-y-auto rounded-t-[32px] bg-gray-50 pb-8 shadow-float"
      >
        {/* Hero */}
        <div className="relative h-44">
          <img src={wash.cover} alt="" className="h-full w-full rounded-t-[32px] object-cover" />
          <div className="absolute inset-0 rounded-t-[32px] bg-gradient-to-t from-black/50 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute inset-x-4 bottom-3 text-white">
            <h2 className="text-xl font-semibold">{wash.name}</h2>
            <p className="flex items-center gap-2 text-xs opacity-90">
              <Star className="h-3 w-3 fill-white" /> {wash.rating} · {wash.address}
            </p>
          </div>
        </div>

        {booked ? (
          <div className="px-5 py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white"
            >
              <Check className="h-7 w-7" strokeWidth={3} />
            </motion.div>
            <p className="mt-3 text-base font-semibold">Бокс забронирован!</p>
            <p className="mt-1 text-xs text-neutral-500">
              {box?.label} · {plate || "гос-номер не указан"}
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white"
            >
              Отлично
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-4 pt-4">
            {/* Услуги — мультивыбор через чекбоксы */}
            <div className="rounded-[24px] border border-border/60 bg-white p-4 shadow-soft">
              <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
                <Droplets className="h-4 w-4 text-primary" /> Услуги
              </p>
              <div className="space-y-1">
                {wash.services.map((s) => {
                  const on = selectedServices.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                        on ? "bg-primary/8" : "bg-transparent"
                      }`}
                    >
                      <Checkbox checked={on} className="pointer-events-none" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900">{s.name}</p>
                        <p className="text-[11px] text-neutral-500">{s.duration}</p>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900">{money(s.price)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Сетка боксов */}
            <div className="rounded-[24px] border border-border/60 bg-white p-4 shadow-soft">
              <WashBoxGrid boxes={wash.boxes} selected={box?.id ?? null} onSelect={onSelectBox} />
            </div>

            {/* Форма брони или очередь */}
            {hasFreeBox ? (
              <AnimatePresence mode="popLayout">
                {box ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="rounded-[24px] border border-border/60 bg-white p-4 shadow-soft"
                  >
                    <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
                      <Car className="h-4 w-4 text-primary" /> Данные авто · {box.label}
                    </p>
                    <div className="space-y-2">
                      <input
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        placeholder="Гос-номер (напр. 123 ABC 02)"
                        className="w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Марка авто (напр. Toyota Camry)"
                        className="w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    {chosen.length > 0 && (
                      <>
                        <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                          Выбранные услуги
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {chosen.map((s) => (
                            <span
                              key={s.id}
                              className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={!plate || chosen.length === 0}
                      onClick={() => setBooked(true)}
                      className="mt-4 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white shadow-float disabled:opacity-40"
                    >
                      Забронировать · {money(total)}
                    </motion.button>
                  </motion.div>
                ) : (
                  <p key="hint" className="px-2 pb-2 text-center text-xs text-neutral-500">
                    Выберите свободный бокс, чтобы продолжить
                  </p>
                )}
              </AnimatePresence>
            ) : (
              <div className="rounded-[24px] border border-border/60 bg-white p-4 shadow-soft">
                <p className="mb-3 text-center text-xs text-neutral-500">Все боксы сейчас заняты</p>
                <WaitlistButton
                  input={{
                    entityId: wash.id,
                    entityName: wash.name,
                    entityKind: "Автомойка",
                    cover: wash.cover,
                    resource: "Любой свободный бокс",
                    peopleAhead: 3,
                    etaMin: 25,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
