import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  clinicPriceFrom,
  clinics,
  doctors,
  doctorsOf,
  doctorsText,
  directions,
  nearestSlots,
  relativeDay,
  symptoms,
  toTime,
  type Clinic,
} from "@/data/clinics";
import { money } from "@/data/hostess";
import { Rating } from "../cards";
import { Chip, Photo, SectionHeader, tapSpring } from "../system";
import { useAppointments } from "./appointments";
import { useClinicHub } from "./ClinicHub";
import { AppointmentCard, Avatar, SymptomGrid, ease, reviewsText } from "./ui";

function Section({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease }}
      className="space-y-4"
    >
      {children}
    </motion.section>
  );
}

const filters = [
  { key: "all", label: "Все" },
  { key: "Стоматология", label: "Стоматологии" },
  { key: "Многопрофильная клиника", label: "Клиники" },
] as const;

const soonestOf = (clinicId: string) =>
  doctorsOf(clinicId)
    .map((d) => nearestSlots(d, 1)[0])
    .filter(Boolean)
    .sort((a, b) =>
      a.dayKey === b.dayKey ? a.minute - b.minute : a.dayKey < b.dayKey ? -1 : 1,
    )[0];

/** Раздел «Здоровье» в каталоге: записи гостя → симптомы → клиники → врачи. */
export function ClinicSections() {
  const hub = useClinicHub();
  const appointments = useAppointments();
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [allSymptoms, setAllSymptoms] = useState(false);
  const list = clinics.filter((c) => filter === "all" || c.kind === filter);
  const topDoctors = useMemo(
    () =>
      [...doctors]
        .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount)
        .slice(0, 8),
    [],
  );

  return (
    <>
      <AnimatePresence initial={false}>
        {appointments.length > 0 && (
          <motion.section
            key="mine"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden"
          >
            <SectionHeader
              eyebrow="Скоро"
              title={appointments.length > 1 ? "Ваши записи" : "Ваша запись"}
            />
            <div className="space-y-3 px-5 pt-4">
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
          </motion.section>
        )}
      </AnimatePresence>

      <Section>
        <SectionHeader
          eyebrow="Запись по симптому"
          title="Что беспокоит?"
          action={allSymptoms ? "Свернуть" : "Все"}
          onAction={() => setAllSymptoms((v) => !v)}
        />
        <div className="px-5">
          <SymptomGrid
            items={allSymptoms ? symptoms : symptoms.slice(0, 6)}
            onPick={(s) => hub.startBooking({ symptomId: s.id })}
          />
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Рядом с вами" title="Клиники и стоматологии" />
        <div className="rail gap-2 px-5">
          {filters.map((f) => (
            <Chip key={f.key} selected={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <motion.div layout className="space-y-4 px-5">
          <AnimatePresence initial={false} mode="popLayout">
            {list.map((c, i) => (
              <ClinicCard key={c.id} clinic={c} index={i} onOpen={() => hub.openClinic(c.id)} />
            ))}
          </AnimatePresence>
        </motion.div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Пациенты рекомендуют" title="Лучшие врачи" />
        <div className="rail gap-3">
          {topDoctors.map((d) => (
            <motion.button
              key={d.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={tapSpring}
              onClick={() => hub.openDoctor(d.id)}
              className="w-[150px] shrink-0 snap-start text-left"
            >
              <Photo
                src={d.photo}
                alt={d.name}
                className="aspect-[3/4] w-full rounded-[18px]"
                imgClassName="object-[50%_20%]"
              />
              <p className="mt-2.5 truncate text-[14.5px] font-semibold tracking-[-0.01em]">
                {d.name}
              </p>
              <p className="truncate text-[12px] text-ink-3">
                {directions[d.direction].specialist}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-3">
                <Rating value={d.rating} className="text-[12px]" />
                <span className="t-num">{reviewsText(d.reviewsCount)}</span>
              </p>
            </motion.button>
          ))}
        </div>
      </Section>
    </>
  );
}

function ClinicCard({
  clinic,
  index,
  onOpen,
}: {
  clinic: Clinic;
  index: number;
  onOpen: () => void;
}) {
  const docs = doctorsOf(clinic.id);
  const soonest = soonestOf(clinic.id);
  return (
    <motion.button
      layout
      type="button"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease }}
      whileTap={{ scale: 0.985 }}
      onClick={onOpen}
      className="block w-full overflow-hidden rounded-card bg-surface text-left shadow-hairline"
    >
      <div className="relative">
        <Photo src={clinic.cover} className="aspect-[16/8.5] w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
          {clinic.kind === "Стоматология" ? "Стоматология" : "Клиника"}
        </span>
        <div className="absolute bottom-3 left-3 flex -space-x-2">
          {docs.slice(0, 4).map((d) => (
            <span key={d.id} className="rounded-full ring-2 ring-white">
              <Avatar doctor={d} size={30} />
            </span>
          ))}
        </div>
        {soonest && (
          <span className="t-num absolute bottom-3 right-3 rounded-full bg-live px-2.5 py-1 text-[11.5px] font-semibold text-white">
            {relativeDay(soonest.dayKey).split(",")[0]} {toTime(soonest.minute)}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-[17px] font-semibold tracking-[-0.02em]">{clinic.name}</p>
          <Rating value={clinic.rating} className="shrink-0 pt-1" />
        </div>
        <p className="mt-0.5 truncate text-[13px] text-ink-2">
          {clinic.district} · {clinic.distanceKm} км · {doctorsText(docs.length)}
        </p>
        <p className="t-num mt-1 text-[12.5px] text-ink-3">
          от {money(clinicPriceFrom(clinic.id))}
        </p>
      </div>
    </motion.button>
  );
}
