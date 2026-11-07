import { useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Baby,
  Brain,
  CalendarClock,
  ClipboardList,
  Droplet,
  Ear,
  HeartPulse,
  MapPin,
  ShieldPlus,
  Smile,
  Sparkles,
  Stethoscope,
  Thermometer,
  type LucideProps,
} from "lucide-react";
import {
  clinicById,
  directions,
  doctorById,
  doctorServices,
  plural,
  relativeDay,
  toTime,
  type Doctor,
  type Symptom,
  type SymptomIcon,
} from "@/data/clinics";
import { money } from "@/data/hostess";
import { hapticSelect } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Rating } from "../cards";
import { Button, ICON_STROKE, Photo, tapSpring } from "../system";
import { appointmentsStore, type Appointment } from "./appointments";

export const ease = [0.22, 1, 0.36, 1] as const;

const symptomIcons: Record<SymptomIcon, ComponentType<LucideProps>> = {
  tooth: Stethoscope,
  sparkles: Sparkles,
  droplet: Droplet,
  smile: Smile,
  shield: ShieldPlus,
  thermometer: Thermometer,
  ear: Ear,
  spine: Activity,
  brain: Brain,
  heart: HeartPulse,
  baby: Baby,
  clipboard: ClipboardList,
};

export const SymptomGlyph = ({ icon, className }: { icon: SymptomIcon; className?: string }) => {
  const Icon = symptomIcons[icon];
  return <Icon className={cn("h-[18px] w-[18px]", className)} strokeWidth={ICON_STROKE} />;
};

/** Плитки «Что беспокоит?» — 3 в ряд, с мягким каскадом появления. */
export function SymptomGrid({
  items,
  selected,
  onPick,
  className,
}: {
  items: Symptom[];
  selected?: string | null;
  onPick: (s: Symptom) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {items.map((s, i) => {
        const on = selected === s.id;
        return (
          <motion.button
            key={s.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 11) * 0.025, duration: 0.4, ease }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              hapticSelect();
              onPick(s);
            }}
            className={cn(
              "flex min-h-[84px] flex-col items-start justify-between rounded-[18px] p-3 text-left transition-colors duration-200",
              on ? "bg-ink text-white" : "bg-surface text-ink shadow-hairline",
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full transition-colors",
                on ? "bg-white/15" : "bg-stone",
              )}
            >
              <SymptomGlyph icon={s.icon} className="h-4 w-4" />
            </span>
            <span className="text-[13.5px] font-medium leading-tight tracking-[-0.01em]">
              {s.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Круглое фото врача; лицо в верхней трети кадра. */
export function Avatar({
  doctor,
  size = 56,
  eager,
}: {
  doctor: Doctor;
  size?: number;
  eager?: boolean;
}) {
  return (
    <span className="block shrink-0" style={{ width: size, height: size }}>
      <Photo
        src={doctor.photo}
        alt={doctor.name}
        eager={eager}
        className="h-full w-full rounded-full"
        imgClassName="object-[50%_22%]"
      />
    </span>
  );
}

export const experienceText = (n: number) => `${n} ${plural(n, ["год", "года", "лет"])} стажа`;
export const reviewsText = (n: number) => `${n} ${plural(n, ["отзыв", "отзыва", "отзывов"])}`;

/** Ряд врача в списке клиники: фото, имя, специализация, ближайшее окно. */
export function DoctorRow({
  doctor,
  nextSlot,
  onOpen,
  onBook,
  index = 0,
}: {
  doctor: Doctor;
  nextSlot?: string;
  onOpen: () => void;
  onBook: () => void;
  index?: number;
}) {
  const from = Math.min(...doctorServices(doctor).map((s) => s.price));
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease }}
      className="flex items-center gap-3.5 py-3.5"
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        transition={tapSpring}
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
      >
        <Avatar doctor={doctor} size={58} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15.5px] font-semibold tracking-[-0.015em]">
            {doctor.name}
          </span>
          <span className="block truncate text-[12.5px] text-ink-2">
            {directions[doctor.direction].specialist} · {experienceText(doctor.experienceYears)}
          </span>
          <span className="mt-1 flex items-center gap-2 whitespace-nowrap text-[12px] text-ink-3">
            <Rating value={doctor.rating} className="text-[12px]" />
            <span>·</span>
            <span className="t-num">от {money(from)}</span>
          </span>
        </span>
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        transition={tapSpring}
        onClick={onBook}
        className="flex h-12 shrink-0 flex-col items-center justify-center rounded-[14px] bg-live-soft px-3 text-live"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] opacity-80">
          {nextSlot ? "Окно" : "Запись"}
        </span>
        <span className="t-num text-[13px] font-semibold leading-tight">{nextSlot ?? "—"}</span>
      </motion.button>
    </motion.div>
  );
}

/** Карточка записи: врач, время, адрес; перенос и двухшаговая отмена. */
export function AppointmentCard({
  appointment,
  onReschedule,
  onOpenDoctor,
  className,
}: {
  appointment: Appointment;
  onReschedule: (a: Appointment) => void;
  onOpenDoctor?: (d: Doctor) => void;
  className?: string;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const doctor = doctorById(appointment.doctorId);
  const clinic = clinicById(appointment.clinicId);
  if (!doctor || !clinic) return null;
  const service = doctorServices(doctor).find((s) => s.id === appointment.serviceId);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ duration: 0.45, ease }}
      className={cn("overflow-hidden rounded-card bg-surface shadow-hairline", className)}
    >
      <div className="flex items-center gap-3.5 p-4">
        <button
          type="button"
          onClick={() => onOpenDoctor?.(doctor)}
          className="press-soft shrink-0 rounded-full"
          aria-label={doctor.name}
        >
          <Avatar doctor={doctor} size={52} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-live">
            <CalendarClock className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            {relativeDay(appointment.dayKey)} · {toTime(appointment.minute)}
          </p>
          <p className="mt-1 truncate text-[15.5px] font-semibold tracking-[-0.015em]">
            {service?.name ?? "Приём"}
          </p>
          <p className="truncate text-[12.5px] text-ink-2">
            {doctor.name} · {directions[doctor.direction].specialist.toLowerCase()}
          </p>
        </div>
      </div>
      <p className="flex items-center gap-1.5 border-t border-line px-4 py-2.5 text-[12.5px] text-ink-2">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={ICON_STROKE} />
        <span className="truncate">
          {clinic.name} · {clinic.address}
        </span>
      </p>
      <div className="border-t border-line p-2">
        <AnimatePresence mode="wait" initial={false}>
          {confirmCancel ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <p className="min-w-0 flex-1 px-2 text-[13px] text-ink-2">Отменить запись?</p>
              <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)}>
                Нет
              </Button>
              <Button
                size="sm"
                className="bg-busy text-white"
                onClick={() => {
                  hapticSelect();
                  appointmentsStore.cancel(appointment.id);
                }}
              >
                Да, отменить
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-2"
            >
              <Button size="sm" variant="secondary" onClick={() => onReschedule(appointment)}>
                Перенести
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(true)}>
                Отменить
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
