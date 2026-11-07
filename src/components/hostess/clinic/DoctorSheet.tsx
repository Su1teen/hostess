import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, GraduationCap, Languages, MapPin, Star } from "lucide-react";
import {
  clinicById,
  directions,
  doctorServices,
  nearestSlots,
  relativeDay,
  toTime,
  type Doctor,
} from "@/data/clinics";
import { money } from "@/data/hostess";
import { hapticSelect } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Rating } from "../cards";
import { BottomSheet, Button, ICON_STROKE, Photo, tapSpring } from "../system";
import { isMine, useAppointments } from "./appointments";
import { useClinicHub } from "./ClinicHub";
import { ease, experienceText, reviewsText } from "./ui";

const durationText = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)} ч${m % 60 ? ` ${m % 60} мин` : ""}` : `${m} мин`;

/** Распределение оценок для полоски рейтинга — из среднего и числа отзывов. */
function distribution(rating: number) {
  const five = Math.min(0.95, Math.max(0.5, (rating - 4) * 0.9 + 0.08));
  const four = Math.max(0.03, (1 - five) * 0.7);
  const three = Math.max(0.01, (1 - five - four) * 0.7);
  const rest = Math.max(0, 1 - five - four - three);
  return [five, four, three, rest * 0.6, rest * 0.4];
}

/**
 * Карточка врача: портрет, специализация, стаж, описание, ближайшие окна,
 * цены и отзывы. Любой слот или услуга — сразу в запись к этому врачу.
 */
export function DoctorSheet({
  doctor,
  z,
  showClinic = true,
  onClose,
}: {
  doctor: Doctor;
  z?: string;
  showClinic?: boolean;
  onClose: () => void;
}) {
  const hub = useClinicHub();
  const clinic = clinicById(doctor.clinicId);
  const services = doctorServices(doctor);
  const appointments = useAppointments();
  // Свои записи не показываем как свободные окна.
  const slots = useMemo(
    () =>
      nearestSlots(doctor, 12)
        .filter((s) => !isMine(appointments, doctor.id, s.dayKey, s.minute))
        .slice(0, 8),
    [doctor, appointments],
  );
  const [more, setMore] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  const dist = distribution(doctor.rating);
  const next = slots[0];

  return (
    <BottomSheet
      onClose={onClose}
      maxHeight="94%"
      z={z}
      footer={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="t-num truncate text-[12.5px] text-ink-3">
              {next
                ? `Ближайшее: ${relativeDay(next.dayKey)}, ${toTime(next.minute)}`
                : "Нет окон на 2 недели"}
            </p>
            <p className="truncate text-[16px] font-semibold tracking-[-0.015em]">
              Приём · {money(services[0].price)}
            </p>
          </div>
          <Button
            size="lg"
            className="px-7"
            onClick={() => hub.startBooking({ doctorId: doctor.id })}
          >
            Записаться
          </Button>
        </div>
      }
    >
      {/* Портрет */}
      <div className="relative">
        <Photo
          src={doctor.photo}
          alt={doctor.name}
          eager
          className="aspect-[4/3.4] w-full"
          imgClassName="object-[50%_20%]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />
      </div>

      <div className="relative -mt-14 px-5 pb-8">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease }}
          className="t-micro"
        >
          {directions[doctor.direction].specialist} · {doctor.category}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45, ease }}
          className="t-title mt-1.5"
        >
          {doctor.name}
        </motion.h2>
        <p className="mt-1 text-[14px] text-ink-2">{doctor.focus}</p>

        {/* Три факта */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-line border-y border-line py-4">
          {[
            { label: "Стаж", value: experienceText(doctor.experienceYears).replace(" стажа", "") },
            {
              label: "Рейтинг",
              value: (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-ink" strokeWidth={0} />
                  {doctor.rating.toFixed(1)}
                </span>
              ),
            },
            { label: "Отзывы", value: doctor.reviewsCount },
          ].map((f) => (
            <div key={f.label} className="px-3 first:pl-0 last:pr-0">
              <p className="t-micro">{f.label}</p>
              <p className="t-num mt-1.5 text-[17px] font-semibold tracking-[-0.01em]">{f.value}</p>
            </div>
          ))}
        </div>

        {/* О враче */}
        <p className={cn("mt-5 text-[15px] leading-relaxed text-ink-2", !more && "line-clamp-3")}>
          {doctor.about}
        </p>
        {!more && (
          <button
            type="button"
            onClick={() => setMore(true)}
            className="mt-1 text-[14px] font-medium text-ink"
          >
            Подробнее
          </button>
        )}

        {/* Ближайшие окна */}
        <div className="mb-3 mt-8 flex items-baseline justify-between">
          <p className="t-micro">Ближайшие окна</p>
          <button
            type="button"
            onClick={() => hub.startBooking({ doctorId: doctor.id })}
            className="text-[13px] font-medium text-ink-2"
          >
            Вся шахматка
          </button>
        </div>
        {slots.length === 0 ? (
          <p className="rounded-[16px] bg-stone px-4 py-4 text-[14px] text-ink-2">
            На ближайшие две недели всё занято.
          </p>
        ) : (
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {slots.map((s, i) => (
              <motion.button
                key={`${s.dayKey}${s.minute}`}
                type="button"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.04, duration: 0.35, ease }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  hapticSelect();
                  hub.startBooking({ doctorId: doctor.id, slot: s });
                }}
                className="flex h-[58px] shrink-0 flex-col items-start justify-center rounded-[14px] bg-surface px-3.5 shadow-[inset_0_0_0_1px_var(--hs-line-strong)]"
              >
                <span className="text-[11px] text-ink-3">
                  {relativeDay(s.dayKey).split(",")[0]}
                </span>
                <span className="t-num text-[16px] font-semibold tracking-[-0.01em]">
                  {toTime(s.minute)}
                </span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Услуги и цены */}
        <p className="t-micro mb-2 mt-8">Услуги и цены</p>
        <div className="divide-hairline rounded-card bg-surface shadow-hairline">
          {services.map((s) => (
            <motion.button
              key={s.id}
              type="button"
              whileTap={{ scale: 0.985 }}
              transition={tapSpring}
              onClick={() => hub.startBooking({ doctorId: doctor.id, serviceId: s.id })}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] tracking-[-0.01em]">{s.name}</span>
                <span className="block text-[12.5px] text-ink-3">
                  {durationText(s.minutes)}
                  {s.first && " · первичный приём"}
                </span>
              </span>
              <span className="t-num text-[15px] font-medium">{money(s.price)}</span>
              <ChevronRight className="h-4 w-4 text-ink-3" strokeWidth={ICON_STROKE} />
            </motion.button>
          ))}
        </div>

        {/* Отзывы */}
        <div className="mb-3 mt-8 flex items-baseline justify-between">
          <p className="t-micro">Отзывы пациентов</p>
          <p className="t-num text-[12.5px] text-ink-3">{reviewsText(doctor.reviewsCount)}</p>
        </div>
        <div className="flex items-center gap-5 rounded-card bg-surface p-4 shadow-hairline">
          <div className="text-center">
            <p className="t-num text-[40px] font-semibold leading-none tracking-[-0.04em]">
              {doctor.rating.toFixed(1)}
            </p>
            <p className="mt-1.5 text-[11.5px] text-ink-3">из 5</p>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {dist.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="t-num w-2 text-[10.5px] text-ink-3">{5 - i}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone">
                  <motion.span
                    className="block h-full rounded-full bg-ink"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.round(p * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.7, ease }}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-3">
          <AnimatePresence initial={false}>
            {(allReviews ? doctor.reviews : doctor.reviews.slice(0, 2)).map((rv, i) => (
              <motion.div
                key={rv.author + rv.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease }}
                className="rounded-card bg-surface p-4 shadow-hairline"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-stone text-[13px] font-semibold">
                    {rv.author[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium">{rv.author}</span>
                    <span className="block text-[11.5px] text-ink-3">
                      {rv.date} · подтверждённый визит
                    </span>
                  </span>
                  <Rating value={rv.rating} />
                </div>
                <p className="mt-2.5 text-[14px] leading-snug text-ink-2">{rv.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {doctor.reviews.length > 2 && !allReviews && (
            <Button block variant="secondary" onClick={() => setAllReviews(true)}>
              Ещё отзывы
            </Button>
          )}
        </div>

        {/* Образование */}
        <div className="divide-hairline mt-8 rounded-card bg-surface shadow-hairline">
          <div className="flex items-start gap-3.5 px-4 py-3.5">
            <GraduationCap
              className="mt-0.5 h-[18px] w-[18px] shrink-0 text-ink-3"
              strokeWidth={ICON_STROKE}
            />
            <div className="min-w-0 flex-1 space-y-1">
              {doctor.education.map((e) => (
                <p key={e} className="text-[14px] text-ink-2">
                  {e}
                </p>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-3.5 px-4 py-3.5">
            <Languages
              className="mt-0.5 h-[18px] w-[18px] shrink-0 text-ink-3"
              strokeWidth={ICON_STROKE}
            />
            <p className="text-[14px] text-ink-2">{doctor.languages.join(", ")}</p>
          </div>
        </div>

        {/* Клиника */}
        {clinic && showClinic && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.985 }}
            transition={tapSpring}
            onClick={() => hub.openClinic(clinic.id)}
            className="mt-6 flex w-full items-center gap-3.5 rounded-card bg-surface p-3 text-left shadow-hairline"
          >
            <Photo src={clinic.cover} className="h-14 w-14 shrink-0 rounded-[12px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">
                {clinic.name}
              </span>
              <span className="flex items-center gap-1 truncate text-[12.5px] text-ink-3">
                <MapPin className="h-3 w-3 shrink-0" strokeWidth={ICON_STROKE} />
                {clinic.address}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-ink-3" strokeWidth={ICON_STROKE} />
          </motion.button>
        )}
      </div>
    </BottomSheet>
  );
}
