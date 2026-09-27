import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { money, type CarWash, type WashBox } from "@/data/hostess";
import { hapticSelect, hapticSuccess } from "@/lib/haptics";
import { WashBoxGrid } from "./WashBoxGrid";
import { WaitlistButton } from "./waitlist/WaitlistButton";
import { Rating } from "./cards";
import { BottomSheet, Button, Photo, SuccessMark } from "./system";

/**
 * Car wash: multi-select services, live bay board, car details.
 * No free bay → waitlist replaces the booking action.
 */
export function CarWashSheet({ wash, onClose }: { wash: CarWash; onClose: () => void }) {
  const [selectedServices, setSelectedServices] = useState<string[]>([wash.services[0].id]);
  const [box, setBox] = useState<WashBox | null>(null);
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [booked, setBooked] = useState(false);

  const hasFreeBox = wash.boxes.some((b) => b.status === "available");
  const freeCount = wash.boxes.filter((b) => b.status === "available").length;
  const total = useMemo(
    () => wash.services.filter((s) => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.price, 0),
    [selectedServices, wash.services],
  );
  const chosen = wash.services.filter((s) => selectedServices.includes(s.id));

  const toggle = (id: string) => {
    hapticSelect();
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const onSelectBox = (b: WashBox) => {
    if (b.status !== "available") return;
    hapticSelect();
    setBox(b);
  };

  const canSubmit = plate.trim().length > 0 && chosen.length > 0 && box != null;

  return (
    <BottomSheet
      onClose={onClose}
      maxHeight="94%"
      footer={
        booked ? (
          <Button block size="lg" onClick={onClose}>
            Готово
          </Button>
        ) : !hasFreeBox ? (
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
        ) : (
          <Button
            block
            size="lg"
            disabled={!canSubmit}
            onClick={() => {
              hapticSuccess();
              setBooked(true);
            }}
          >
            {box ? `Забронировать ${box.label} · ${money(total)}` : "Выберите свободный бокс"}
          </Button>
        )
      }
    >
      <Photo src={wash.cover} className="aspect-[16/9] w-full" eager />
      <div className="px-5 pb-6 pt-6">
        <p className="t-micro">{wash.address}</p>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h2 className="t-title">{wash.name}</h2>
          <Rating value={wash.rating} className="shrink-0 pt-2" />
        </div>

        {booked ? (
          <div className="flex flex-col items-center py-10 text-center">
            <SuccessMark />
            <p className="t-headline mt-5">Бокс забронирован</p>
            <p className="t-caption mt-1.5">
              {box?.label} · {plate || "гос-номер не указан"} · {money(total)}
            </p>
          </div>
        ) : (
          <>
            <p className="t-micro mb-2 mt-7">Услуги</p>
            <div className="divide-hairline rounded-card bg-surface shadow-hairline">
              {wash.services.map((s) => {
                const on = selectedServices.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className="press-soft flex w-full items-center gap-3.5 px-4 py-3.5 text-left"
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] transition-colors ${
                        on ? "bg-ink text-white" : "shadow-[inset_0_0_0_1.5px_var(--hs-line-strong)]"
                      }`}
                    >
                      {on && <Check className="h-3 w-3" strokeWidth={2.6} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px]">{s.name}</span>
                      <span className="block text-[12.5px] text-ink-3">{s.duration}</span>
                    </span>
                    <span className="t-num text-[15px] font-medium">{money(s.price)}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-2 mt-7 flex items-baseline justify-between">
              <p className="t-micro">Боксы сейчас</p>
              <p className="t-num text-[12px] text-ink-3">
                {freeCount} из {wash.boxes.length} свободно
              </p>
            </div>
            <WashBoxGrid boxes={wash.boxes} selected={box?.id ?? null} onSelect={onSelectBox} />

            <AnimatePresence>
              {hasFreeBox && box && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-7"
                >
                  <p className="t-micro mb-2">Автомобиль · {box.label}</p>
                  <div className="divide-hairline rounded-card bg-surface shadow-hairline">
                    <input
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      placeholder="Гос-номер, напр. 123 ABC 01"
                      className="t-num h-12 w-full bg-transparent px-4 text-[15px] outline-none placeholder:text-ink-3"
                    />
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Марка и модель"
                      className="h-12 w-full bg-transparent px-4 text-[15px] outline-none placeholder:text-ink-3"
                    />
                  </div>
                  {chosen.length > 0 && (
                    <p className="t-caption mt-3">{chosen.map((s) => s.name).join(" · ")}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
