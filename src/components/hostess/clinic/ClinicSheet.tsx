import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import {
  clinicDirections,
  clinicPriceFrom,
  doctorsOf,
  doctorsText,
  nearestSlots,
  relativeDay,
  symptomsFor,
  toTime,
  type Clinic,
} from "@/data/clinics";
import { money } from "@/data/hostess";
import { Rating } from "../cards";
import { VenueDetailShell } from "../VenueDetail";
import { Button, ICON_STROKE, Tag } from "../system";
import { useAppointments } from "./appointments";
import { useClinicHub } from "./ClinicHub";
import { AppointmentCard, DoctorRow, SymptomGrid, ease, reviewsText } from "./ui";

function hoursToday(c: Clinic, now = new Date()) {
  const h =
    now.getDay() === 0 ? c.hours.sunday : ([c.hours.open, c.hours.close] as [number, number]);
  if (!h) return { open: false, text: "Сегодня выходной" };
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour < h[0]) return { open: false, text: `Откроется в ${String(h[0]).padStart(2, "0")}:00` };
  if (hour >= h[1]) return { open: false, text: "Закрыто до завтра" };
  return { open: true, text: `Открыто до ${h[1]}:00` };
}

/**
 * Клиника: кинематографичный hero с параллаксом → «что беспокоит» →
 * врачи с ближайшими окнами → о клинике. Одно основное действие в доке.
 */
export function ClinicSheet({ clinic, onClose }: { clinic: Clinic; onClose: () => void }) {
  const hub = useClinicHub();
  const appointments = useAppointments().filter((a) => a.clinicId === clinic.id);
  const doctors = useMemo(
    () => [...doctorsOf(clinic.id)].sort((a, b) => b.rating - a.rating),
    [clinic.id],
  );
  const nextByDoctor = useMemo(
    () => Object.fromEntries(doctors.map((d) => [d.id, nearestSlots(d, 1)[0]])),
    [doctors],
  );
  const soonest = Object.values(nextByDoctor)
    .filter(Boolean)
    .sort((a, b) =>
      a.dayKey === b.dayKey ? a.minute - b.minute : a.dayKey < b.dayKey ? -1 : 1,
    )[0];
  const hours = hoursToday(clinic);

  return (
    <VenueDetailShell
      name={clinic.name}
      images={clinic.gallery}
      onClose={onClose}
      dock={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="t-num truncate text-[12.5px] text-ink-3">
              {soonest
                ? `Ближайшее окно · ${relativeDay(soonest.dayKey)}, ${toTime(soonest.minute)}`
                : "Окна уточняются"}
            </p>
            <p className="truncate text-[16px] font-semibold tracking-[-0.015em]">
              {doctorsText(doctors.length)} · от {money(clinicPriceFrom(clinic.id))}
            </p>
          </div>
          <Button
            size="lg"
            className="px-7"
            onClick={() => hub.startBooking({ clinicId: clinic.id })}
          >
            Записаться
          </Button>
        </div>
      }
    >
      {/* Identity */}
      <div className="px-5">
        <p className="t-micro">
          {clinic.kind} · {clinic.district}
        </p>
        <h1 className="t-display mt-2">{clinic.name}</h1>
        <p className="mt-3 flex items-center gap-2 text-[14px] text-ink-2">
          <Rating value={clinic.rating} className="text-[14px]" />
          <span className="t-num text-ink-3">{reviewsText(clinic.reviews)}</span>
          <span className="text-ink-3">·</span>
          <span className="t-num">{clinic.distanceKm} км</span>
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[14px] text-ink-2">
          <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
          <span className={hours.open ? "text-live" : undefined}>{hours.text}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[14px] text-ink-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
          <span className="truncate">{clinic.address}</span>
        </p>
      </div>

      {/* Мои записи сюда */}
      <AnimatePresence initial={false}>
        {appointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-5 pt-6">
              <p className="t-micro">Ваша запись</p>
              <AnimatePresence initial={false}>
                {appointments.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onReschedule={(apt) => hub.startBooking({ rescheduleId: apt.id })}
                    onOpenDoctor={(d) => hub.openDoctor(d.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Что беспокоит */}
      <div className="mt-8 px-5">
        <p className="text-[17px] font-semibold tracking-[-0.02em]">Что беспокоит?</p>
        <p className="t-caption mb-3 mt-0.5">Подскажем врача и с чего начать</p>
        <SymptomGrid
          items={symptomsFor(clinic.id)}
          onPick={(s) => hub.startBooking({ clinicId: clinic.id, symptomId: s.id })}
        />
      </div>

      {/* Врачи */}
      <div className="mt-9 px-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[17px] font-semibold tracking-[-0.02em]">Врачи</p>
          <p className="t-num text-[12.5px] text-ink-3">{doctors.length} специалистов</p>
        </div>
        <div className="divide-hairline mt-1">
          {doctors.map((d, i) => {
            const next = nextByDoctor[d.id];
            return (
              <DoctorRow
                key={d.id}
                doctor={d}
                index={i}
                nextSlot={
                  next
                    ? `${relativeDay(next.dayKey) === "Сегодня" ? "" : relativeDay(next.dayKey).split(",")[0] + " "}${toTime(next.minute)}`
                    : undefined
                }
                onOpen={() => hub.openDoctor(d.id)}
                onBook={() =>
                  next
                    ? hub.startBooking({ doctorId: d.id, slot: next })
                    : hub.startBooking({ doctorId: d.id })
                }
              />
            );
          })}
        </div>
      </div>

      {/* О клинике */}
      <div className="mt-9 px-5">
        <p className="text-[17px] font-semibold tracking-[-0.02em]">О клинике</p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{clinic.about}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {clinicDirections(clinic.id).map((d) => (
            <Tag key={d.id}>{d.label}</Tag>
          ))}
        </div>
        <div className="divide-hairline mt-5 rounded-card bg-surface shadow-hairline">
          {clinic.perks.map((p) => (
            <p key={p} className="px-4 py-3 text-[14.5px]">
              {p}
            </p>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-card bg-surface p-4 shadow-hairline">
          <MapPin
            className="mt-0.5 h-[18px] w-[18px] shrink-0 text-ink-3"
            strokeWidth={ICON_STROKE}
          />
          <div className="min-w-0 flex-1 text-[14.5px]">
            <p>{clinic.address}</p>
            <p className="t-num mt-0.5 text-[12.5px] text-ink-3">
              Пн–Сб {clinic.hours.open}:00–{clinic.hours.close}:00 ·{" "}
              {clinic.hours.sunday
                ? `Вс ${clinic.hours.sunday[0]}:00–${clinic.hours.sunday[1]}:00`
                : "Вс выходной"}
            </p>
          </div>
        </div>
      </div>
    </VenueDetailShell>
  );
}
