import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { bayStatus, hhmm, money, washAvailability, type CarWash, type WashBox } from "@/data/hostess";
import { useNow } from "@/hooks/useNow";
import { hapticSelect, hapticSuccess } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { BayLegend, WashBoxGrid } from "./WashBoxGrid";
import { WaitlistButton } from "./waitlist/WaitlistButton";
import { Rating } from "./cards";
import { BottomSheet, Button, Chip, OccupancyRing, Photo, SuccessMark } from "./system";

const savedCar = { id: "car1", label: "Toyota Camry", plate: "777 ABA 01" };

const durationText = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} ч${m % 60 ? ` ${m % 60} мин` : ""}` : `${m} мин`);

/**
 * Car wash as realtime bay allocation: live capacity → pick a bay →
 * services → vehicle (saved, not a form) → reserve. Every bay taken →
 * "notify me when a bay frees up" via the shared waitlist.
 */
export function CarWashSheet({ wash, onClose }: { wash: CarWash; onClose: () => void }) {
  const now = useNow(15_000);
  const avail = washAvailability(wash, now);
  const firstFree = wash.boxes.find((b) => bayStatus(b, now).state === "free") ?? null;

  const [selectedServices, setSelectedServices] = useState<string[]>([wash.services[0].id]);
  const [box, setBox] = useState<WashBox | null>(firstFree);
  const [customCar, setCustomCar] = useState(false);
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [booked, setBooked] = useState(false);

  // A bay can be taken while the sheet is open — drop a stale selection.
  useEffect(() => {
    if (box && bayStatus(box, now).state !== "free") setBox(firstFree);
  }, [now, box, firstFree]);

  const chosen = wash.services.filter((s) => selectedServices.includes(s.id));
  const total = useMemo(() => chosen.reduce((sum, s) => sum + s.price, 0), [chosen]);
  const minutes = chosen.reduce((sum, s) => sum + s.minutes, 0);
  const boxIndex = box ? wash.boxes.indexOf(box) + 1 : 0;

  const toggle = (id: string) => {
    hapticSelect();
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const onSelectBox = (b: WashBox) => {
    if (bayStatus(b, now).state !== "free") return;
    hapticSelect();
    setBox(b);
  };

  const carReady = !customCar || plate.trim().length > 0;
  const canSubmit = carReady && chosen.length > 0 && box != null;

  return (
    <BottomSheet
      onClose={onClose}
      maxHeight="94%"
      footer={
        booked ? (
          <Button block size="lg" onClick={onClose}>
            Готово
          </Button>
        ) : avail.free === 0 ? (
          <WaitlistButton
            label="Сообщить, когда освободится бокс"
            input={{
              entityId: wash.id,
              entityName: wash.name,
              entityKind: "Автомойка",
              cover: wash.cover,
              resource: "Любой свободный бокс",
              peopleAhead: 2,
              etaMin: avail.nextFreeMin ?? 20,
            }}
          />
        ) : (
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="t-num truncate text-[12.5px] text-ink-3">
                {chosen.length ? `${durationText(minutes)} · ${money(total)}` : "Выберите услугу"}
              </p>
              <p className="truncate text-[16px] font-semibold tracking-[-0.015em]">
                {box ? `Бокс ${String(boxIndex).padStart(2, "0")} · сейчас` : "Выберите бокс"}
              </p>
            </div>
            <Button
              size="lg"
              className="px-7"
              disabled={!canSubmit}
              onClick={() => {
                hapticSuccess();
                setBooked(true);
              }}
            >
              Забронировать
            </Button>
          </div>
        )
      }
    >
      <Photo src={wash.cover} className="aspect-[16/8] w-full" eager />
      <div className="px-5 pb-6 pt-5">
        <p className="t-micro">{wash.address}</p>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h2 className="t-title">{wash.name}</h2>
          <Rating value={wash.rating} className="shrink-0 pt-2" />
        </div>

        {booked ? (
          <div className="flex flex-col items-center py-10 text-center">
            <SuccessMark />
            <p className="t-headline mt-5">Бокс {String(boxIndex).padStart(2, "0")} ваш</p>
            <p className="t-caption mt-1.5">
              Подъезжайте к {hhmm(now + 10 * 60000)} · {customCar ? plate : savedCar.plate} · {money(total)}
            </p>
          </div>
        ) : (
          <>
            {/* Live capacity — one precise line, Flighty-style */}
            <div className="mt-5 flex items-center gap-3.5 border-y border-line py-4">
              <OccupancyRing value={avail.occupancy} size={44} stroke={3}>
                <span className="t-num text-[12px] font-semibold">
                  {avail.free}/{avail.total}
                </span>
              </OccupancyRing>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold tracking-[-0.01em]">
                  {avail.free > 0
                    ? `${avail.free} из ${avail.total} боксов свободно`
                    : "Все боксы заняты"}
                </p>
                <p className="t-num mt-0.5 text-[12.5px] text-ink-3">
                  {avail.free > 0
                    ? "Датчики боксов · обновлено только что"
                    : `Ближайший освободится ≈ ${avail.nextFreeMin} мин · ${hhmm(now + (avail.nextFreeMin ?? 0) * 60000)}`}
                </p>
              </div>
            </div>

            <div className="mb-3 mt-7 flex items-baseline justify-between">
              <p className="t-micro">Боксы</p>
              <BayLegend />
            </div>
            <WashBoxGrid boxes={wash.boxes} now={now} selected={box?.id ?? null} onSelect={onSelectBox} />

            <div className="mb-1 mt-8 flex items-baseline justify-between">
              <p className="t-micro">Услуги</p>
              {chosen.length > 0 && (
                <p className="t-num text-[12px] text-ink-3">≈ {durationText(minutes)}</p>
              )}
            </div>
            <div className="divide-hairline">
              {wash.services.map((s) => {
                const on = selectedServices.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className="press-soft flex w-full items-center gap-3.5 py-3.5 text-left"
                  >
                    <span
                      className={cn(
                        "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full transition-colors",
                        on ? "bg-ink text-white" : "shadow-[inset_0_0_0_1.5px_var(--hs-line-strong)]",
                      )}
                    >
                      {on && <Check className="h-3 w-3" strokeWidth={2.6} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] tracking-[-0.01em]">{s.name}</span>
                      <span className="block text-[12.5px] text-ink-3">{s.duration}</span>
                    </span>
                    <span className="t-num text-[15px] font-medium">{money(s.price)}</span>
                  </button>
                );
              })}
            </div>

            <p className="t-micro mb-3 mt-8">Автомобиль</p>
            <div className="flex flex-wrap gap-2">
              <Chip selected={!customCar} tone="outline" onClick={() => setCustomCar(false)}>
                {savedCar.label} · <span className="t-num">{savedCar.plate}</span>
              </Chip>
              <Chip selected={customCar} tone="outline" icon={Plus} onClick={() => setCustomCar(true)}>
                Другой
              </Chip>
            </div>
            <AnimatePresence initial={false}>
              {customCar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="divide-hairline mt-3 border-y border-line">
                    <input
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      placeholder="Гос-номер, напр. 123 ABC 01"
                      className="t-num h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-3"
                    />
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Марка и модель"
                      className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-3"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
