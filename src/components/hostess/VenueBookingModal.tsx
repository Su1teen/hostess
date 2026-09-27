import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { money, type Venue } from "@/data/hostess";
import { hapticSelect, hapticSuccess } from "@/lib/haptics";
import { useWaitlist } from "./waitlist/WaitlistProvider";
import { JoinWaitlistSheet } from "./waitlist/JoinWaitlistSheet";
import type { JoinWaitlistInput } from "./waitlist/types";
import { Rating } from "./cards";
import { BottomSheet, Button, LiveStatus, Photo, SuccessMark, tapSpring } from "./system";

/**
 * Appointment booking for lifestyle venues (barber, clinic, salon…):
 * service → time → confirm. Full slots route to the waitlist.
 */
export function VenueBookingModal({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const [service, setService] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [waitInput, setWaitInput] = useState<JoinWaitlistInput | null>(null);
  const { join, isQueued } = useWaitlist();
  const slots = ["10:00", "11:30", "13:00", "15:30", "17:00", "19:30"];
  const fullSlots = new Set(["13:00", "17:00"]);

  return (
    <>
      <BottomSheet
        onClose={onClose}
        footer={
          booked ? (
            <Button block size="lg" onClick={onClose}>
              Готово
            </Button>
          ) : (
            <Button
              block
              size="lg"
              disabled={!slot}
              onClick={() => {
                hapticSuccess();
                setBooked(true);
              }}
            >
              {slot ? `Записаться на ${slot} · ${money(venue.services[service].price)}` : "Выберите время"}
            </Button>
          )
        }
      >
        <Photo src={venue.cover} className="aspect-[16/9] w-full" eager />
        <div className="px-5 pb-6 pt-6">
          <p className="t-micro">{venue.kind}</p>
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <h2 className="t-title">{venue.name}</h2>
            <Rating value={venue.rating} className="shrink-0 pt-2" />
          </div>
          <LiveStatus occupancy={venue.occupancy} className="mt-2.5" />

          {booked ? (
            <div className="flex flex-col items-center py-10 text-center">
              <SuccessMark />
              <p className="t-headline mt-5">Вы записаны</p>
              <p className="t-caption mt-1.5">
                {venue.services[service].name} · завтра в {slot}
              </p>
            </div>
          ) : (
            <>
              <p className="t-micro mb-2 mt-8">Услуга</p>
              <div className="divide-hairline rounded-card bg-surface shadow-hairline">
                {venue.services.map((s, i) => {
                  const on = service === i;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => {
                        hapticSelect();
                        setService(i);
                      }}
                      className="press-soft flex w-full items-center gap-3.5 px-4 py-3.5 text-left"
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors ${
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
                <p className="t-micro">Завтра</p>
                <p className="text-[12px] text-ink-3">Занятые — в лист ожидания</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => {
                  const full = fullSlots.has(s);
                  const queued = isQueued(`${venue.id}-${s}`);
                  const on = slot === s;
                  return (
                    <motion.button
                      key={s}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      transition={tapSpring}
                      onClick={() => {
                        if (full) {
                          setWaitInput({
                            entityId: `${venue.id}-${s}`,
                            entityName: venue.name,
                            entityKind: venue.kind,
                            cover: venue.cover,
                            resource: `${venue.services[service].name} · ${s}`,
                            peopleAhead: 3 + (s.length % 3),
                            etaMin: 18 + (s.length % 12),
                          });
                          return;
                        }
                        hapticSelect();
                        setSlot(s);
                      }}
                      className={`t-num relative h-12 rounded-[14px] text-[14.5px] font-medium transition-colors ${
                        on
                          ? "bg-ink text-white"
                          : full
                            ? "bg-stone text-ink-3"
                            : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--hs-line-strong)]"
                      }`}
                    >
                      {s}
                      {full && (
                        <span className="absolute inset-x-0 bottom-1.5 text-center text-[9.5px] font-medium uppercase tracking-[0.08em] text-ink-3">
                          {queued ? "в очереди" : "занято"}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </BottomSheet>

      <AnimatePresence>
        {waitInput && (
          <JoinWaitlistSheet
            input={waitInput}
            onClose={() => setWaitInput(null)}
            onConfirm={(inp) => {
              join(inp);
              setWaitInput(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
