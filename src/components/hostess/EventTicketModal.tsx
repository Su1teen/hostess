import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MapPin } from "lucide-react";
import { money, type CityEvent } from "@/data/hostess";
import { hapticSuccess } from "@/lib/haptics";
import { BottomSheet, Button, ListRow, Photo, RowGroup, Stepper, softSpring } from "./system";

/** Event ticket — cinematic cover, essential facts, quantity, a wallet-style pass on success. */
export function EventTicketModal({ event, onClose }: { event: CityEvent; onClose: () => void }) {
  const [bought, setBought] = useState(false);
  const [qty, setQty] = useState(1);
  const free = event.price === 0;

  return (
    <BottomSheet
      onClose={onClose}
      footer={
        bought ? (
          <Button block size="lg" onClick={onClose}>
            Готово
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Stepper value={qty} onChange={setQty} min={1} max={8} />
            <Button
              block
              size="lg"
              className="flex-1"
              onClick={() => {
                hapticSuccess();
                setBought(true);
              }}
            >
              {free ? "Зарегистрироваться" : `Купить · ${money(event.price * qty)}`}
            </Button>
          </div>
        )
      }
    >
      <div className="relative">
        <Photo src={event.cover} className="aspect-[4/3] w-full" eager />
        <span className="frost-photo absolute left-4 top-6 rounded-full px-2.5 py-1 text-[11px] font-medium text-ink">
          {event.tag}
        </span>
      </div>
      <div className="px-5 pb-6 pt-6">
        {bought ? (
          <motion.div
            initial={{ opacity: 0, y: 16, rotateX: 18 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={softSpring}
            className="mx-auto max-w-[300px] overflow-hidden rounded-hero bg-ink text-white shadow-float"
          >
            <div className="p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">Hostess · билет</p>
              <p className="mt-3 text-[20px] font-semibold leading-tight tracking-[-0.02em]">{event.title}</p>
              <p className="t-num mt-1.5 text-[13px] text-white/65">
                {event.date} · {event.time} · {qty} {qty === 1 ? "билет" : "билета"}
              </p>
            </div>
            <div className="flex items-end justify-center gap-[3px] border-t border-dashed border-white/20 px-5 py-4">
              {Array.from({ length: 34 }).map((_, i) => (
                <span key={i} className="w-[3px] rounded-[1px] bg-white" style={{ height: 14 + ((i * 7) % 18) }} />
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            <h2 className="t-title">{event.title}</h2>
            <div className="mt-6">
              <RowGroup>
                <ListRow icon={CalendarDays} title={`${event.date}, ${event.time}`} subtitle="Дата и время" chevron={false} />
                <ListRow icon={MapPin} title={event.place} subtitle="Место" chevron={false} />
              </RowGroup>
            </div>
            <p className="t-caption mt-4">
              {free ? "Вход свободный по регистрации." : `Билет от ${money(event.price)}.`} Билет появится в разделе
              «Брони» и в Wallet.
            </p>
          </>
        )}
        {bought && <p className="t-caption mt-4 text-center">Билет добавлен в Wallet и раздел «Брони»</p>}
      </div>
    </BottomSheet>
  );
}
