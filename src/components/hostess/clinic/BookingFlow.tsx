import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarOff,
  ChevronLeft,
  CircleCheck,
  Clock,
  CreditCard,
  MapPin,
  Stethoscope,
} from "lucide-react";
import {
  clinicById,
  clinicDays,
  dayLong,
  directions,
  doctorById,
  doctors as allDoctors,
  doctorServices,
  firstService,
  slotsText,
  freeCount,
  nearestSlots,
  relativeDay,
  symptomById,
  symptomsFor,
  toTime,
  type ClinicDay,
  type DirectionId,
  type Doctor,
  type FreeSlot,
} from "@/data/clinics";
import { money } from "@/data/hostess";
import { hapticSelect, hapticSuccess } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Rating } from "../cards";
import { BottomSheet, Button, EmptyState, ICON_STROKE, SuccessMark, tapSpring } from "../system";
import { appointmentsStore, useAppointments, type Appointment } from "./appointments";
import { SlotGrid, hasFree, type GridColumn } from "./SlotGrid";
import { Avatar, SymptomGlyph, SymptomGrid, ease, experienceText } from "./ui";

export type BookingInit = {
  clinicId?: string;
  doctorId?: string;
  symptomId?: string;
  serviceId?: string;
  slot?: FreeSlot;
  rescheduleId?: string;
};

type Step = "symptom" | "plan" | "grid" | "confirm" | "done" | "cancelled";

const STEP_ORDER: Step[] = ["symptom", "plan", "grid", "confirm", "done"];
const stepTitle: Record<Step, string> = {
  symptom: "Что беспокоит?",
  plan: "Куда записаться",
  grid: "Выберите время",
  confirm: "Проверьте запись",
  done: "Готово",
  cancelled: "Запись отменена",
};

const durationText = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)} ч${m % 60 ? ` ${m % 60} мин` : ""}` : `${m} мин`;

const shortName = (name: string) => {
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}.` : first;
};

/**
 * Запись в клинику: симптом → направление и первичный приём → шахматка
 * (дни × врачи) → подтверждение → итог с переносом и отменой.
 * Открывается с любого шага: из карточки врача, по слоту, для переноса.
 */
export function BookingFlow({
  init,
  onClose,
  onOpenDoctor,
}: {
  init: BookingInit;
  onClose: () => void;
  onOpenDoctor?: (doctorId: string) => void;
}) {
  const appointments = useAppointments();
  const moving = init.rescheduleId
    ? appointments.find((a) => a.id === init.rescheduleId)
    : undefined;
  // Запись, которую переносим: из «Моих записей» или прямо с экрана итога.
  const [origin, setOrigin] = useState<Appointment | undefined>(moving);

  const lockedId = init.doctorId ?? (init.rescheduleId ? moving?.doctorId : undefined);
  const lockedDoctor = lockedId ? doctorById(lockedId) : undefined;
  const clinicId = init.clinicId ?? lockedDoctor?.clinicId;

  const [symptomId, setSymptomId] = useState<string | undefined>(
    init.symptomId ?? origin?.symptomId,
  );
  const symptom = symptomId ? symptomById(symptomId) : undefined;
  const direction: DirectionId | undefined = lockedDoctor?.direction ?? symptom?.direction;

  const candidates = useMemo<Doctor[]>(() => {
    if (lockedDoctor) return [lockedDoctor];
    if (!direction) return [];
    return allDoctors
      .filter((d) => d.direction === direction && (!clinicId || d.clinicId === clinicId))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  }, [lockedDoctor, direction, clinicId]);

  const services = useMemo(() => {
    if (!direction) return [];
    return directions[direction].services.map((s) => {
      const prices = candidates.map(
        (d) => doctorServices(d).find((x) => x.id === s.id)?.price ?? s.price,
      );
      return { ...s, from: Math.min(...prices), same: new Set(prices).size === 1 };
    });
  }, [direction, candidates]);

  const startStep: Step = origin
    ? "grid"
    : init.slot
      ? "confirm"
      : init.doctorId
        ? "grid"
        : init.symptomId
          ? "plan"
          : "symptom";

  const [history, setHistory] = useState<Step[]>([startStep]);
  const step = history[history.length - 1];
  const [dir, setDir] = useState(1);
  const go = (s: Step) => {
    setDir(STEP_ORDER.indexOf(s) >= STEP_ORDER.indexOf(step) ? 1 : -1);
    setHistory((h) => [...h, s]);
  };
  const back = () => {
    setDir(-1);
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  };

  const [serviceId, setServiceId] = useState<string | undefined>(
    init.serviceId ??
      origin?.serviceId ??
      (lockedDoctor ? firstService(lockedDoctor).id : undefined),
  );
  // Выбранный симптом → предлагаем первичный приём направления.
  useEffect(() => {
    if (!direction) return;
    if (!serviceId || !directions[direction].services.some((s) => s.id === serviceId)) {
      setServiceId(directions[direction].services.find((s) => s.first)?.id);
    }
  }, [direction, serviceId]);

  const days = useMemo(() => clinicDays(14), []);
  const [slot, setSlot] = useState<FreeSlot | null>(init.slot ?? null);
  const [dayIdx, setDayIdx] = useState(() => {
    if (init.slot)
      return Math.max(
        0,
        days.findIndex((d) => d.key === init.slot?.dayKey),
      );
    if (origin)
      return Math.max(
        0,
        days.findIndex((d) => d.key === origin.dayKey),
      );
    return 0;
  });
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<Appointment | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Первый день, где есть окна, — открываем шахматку сразу на нём.
  useEffect(() => {
    if (step !== "grid" || init.slot || origin || candidates.length === 0) return;
    if (freeCount(candidates, days[dayIdx]) > 0) return;
    const next = days.findIndex((d) => freeCount(candidates, d) > 0);
    if (next >= 0) setDayIdx(next);
    // только при входе на шаг
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, candidates]);

  const singleDoctor = candidates.length === 1;
  const columns = useMemo<GridColumn[]>(() => {
    if (candidates.length === 0) return [];
    if (singleDoctor) {
      const d = candidates[0];
      return days
        .slice(Math.min(dayIdx, days.length - 3), Math.min(dayIdx, days.length - 3) + 3)
        .map((day) => ({
          key: day.key,
          doctor: d,
          day,
          header: <DayHeader day={day} free={freeCount([d], day)} />,
        }));
    }
    const day = days[dayIdx];
    return candidates.map((d) => ({
      key: d.id,
      doctor: d,
      day,
      header: <DoctorHeader doctor={d} free={freeCount([d], day)} onOpen={onOpenDoctor} />,
    }));
  }, [candidates, singleDoctor, days, dayIdx, onOpenDoctor]);

  const nextFreeDay = useMemo(() => {
    for (let i = dayIdx + 1; i < days.length; i++)
      if (freeCount(candidates, days[i]) > 0) return days[i];
    return undefined;
  }, [candidates, days, dayIdx]);

  const slotDoctor = slot ? doctorById(slot.doctorId) : undefined;
  const slotService =
    slotDoctor && serviceId
      ? doctorServices(slotDoctor).find((s) => s.id === serviceId)
      : undefined;
  const serviceMeta = services.find((s) => s.id === serviceId);
  const slotClinic = slotDoctor ? clinicById(slotDoctor.clinicId) : undefined;
  const bring = symptom?.bring ?? ["Удостоверение личности", "Прошлые обследования, если есть"];

  // Каждый шаг начинается сверху.
  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = topRef.current?.closest(".scroll-y");
    if (scroller) scroller.scrollTop = 0;
  }, [step]);

  const submit = () => {
    if (!slot || !slotDoctor || !serviceId) return;
    hapticSuccess();
    if (origin) {
      appointmentsStore.move(origin.id, {
        doctorId: slot.doctorId,
        dayKey: slot.dayKey,
        minute: slot.minute,
      });
      setResult({ ...origin, doctorId: slot.doctorId, dayKey: slot.dayKey, minute: slot.minute });
    } else {
      setResult(
        appointmentsStore.add({
          doctorId: slot.doctorId,
          clinicId: slotDoctor.clinicId,
          serviceId,
          symptomId,
          dayKey: slot.dayKey,
          minute: slot.minute,
          comment: comment.trim() || undefined,
        }),
      );
    }
    go("done");
  };

  const progress = Math.max(0, STEP_ORDER.indexOf(step === "cancelled" ? "done" : step));
  const canBack = history.length > 1 && step !== "done" && step !== "cancelled";

  /* ── Footer per step ─────────────────────────────────────────── */
  let footer: ReactNode = null;
  if (step === "plan") {
    footer = (
      <Button
        block
        size="lg"
        disabled={!serviceId || candidates.length === 0}
        onClick={() => go("grid")}
      >
        Выбрать время
      </Button>
    );
  } else if (step === "grid") {
    footer = (
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="t-num truncate text-[12.5px] text-ink-3">
            {slot
              ? `${relativeDay(slot.dayKey)} · ${toTime(slot.minute)}`
              : "Свободные окна — белые"}
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={slot ? `${slot.doctorId}${slot.dayKey}${slot.minute}` : "none"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="truncate text-[16px] font-semibold tracking-[-0.015em]"
            >
              {slot && slotDoctor ? shortName(slotDoctor.name) : "Выберите время"}
            </motion.p>
          </AnimatePresence>
        </div>
        <Button size="lg" className="px-7" disabled={!slot} onClick={() => go("confirm")}>
          Далее
        </Button>
      </div>
    );
  } else if (step === "confirm") {
    footer = (
      <Button block size="lg" disabled={!slot || !slotService} onClick={submit}>
        {origin
          ? `Перенести на ${slot ? toTime(slot.minute) : ""}`
          : `Записаться${slotService ? ` · ${money(slotService.price)}` : ""}`}
      </Button>
    );
  } else if (step === "done" || step === "cancelled") {
    footer = (
      <Button block size="lg" onClick={onClose}>
        Готово
      </Button>
    );
  }

  return (
    <BottomSheet
      onClose={onClose}
      maxHeight="94%"
      className="h-[94%]"
      z="z-[115]"
      footer={footer}
      header={
        <div className="px-3 pb-3 pt-6">
          <div className="flex h-10 items-center gap-1">
            <AnimatePresence initial={false}>
              {canBack && (
                <motion.button
                  key="back"
                  type="button"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  whileTap={{ scale: 0.92 }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={back}
                  aria-label="Назад"
                  className="grid h-10 w-10 place-items-center rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={ICON_STROKE} />
                </motion.button>
              )}
            </AnimatePresence>
            <div className={cn("min-w-0 flex-1", !canBack && "pl-2")}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={step}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="truncate text-[17px] font-semibold tracking-[-0.02em]"
                >
                  {origin && step === "grid" ? "Перенос записи" : stepTitle[step]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1 px-2">
            {STEP_ORDER.map((s, i) => (
              <span key={s} className="h-[3px] overflow-hidden rounded-full bg-stone">
                <motion.span
                  className="block h-full rounded-full bg-ink"
                  initial={false}
                  animate={{ width: i <= progress ? "100%" : "0%" }}
                  transition={{ duration: 0.45, ease }}
                />
              </span>
            ))}
          </div>
        </div>
      }
    >
      <div ref={topRef} />
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 28 }),
            center: { opacity: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: d * -20 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.32, ease }}
          className="px-5 pb-8 pt-2"
        >
          {/* ── 1. Симптом ─────────────────────────────────────── */}
          {step === "symptom" && (
            <>
              <p className="t-caption mb-4">
                Выберите, что беспокоит, — подскажем врача и с какой услуги начать.
                {clinicId && ` Показываем то, с чем работает ${clinicById(clinicId)?.name}.`}
              </p>
              <SymptomGrid
                items={symptomsFor(clinicId)}
                selected={symptomId}
                onPick={(s) => {
                  setSymptomId(s.id);
                  setSlot(null);
                  setServiceId(directions[s.direction].services.find((x) => x.first)?.id);
                  window.setTimeout(() => go("plan"), 160);
                }}
              />
            </>
          )}

          {/* ── 2. Рекомендация: направление + первичный приём ────── */}
          {step === "plan" && direction && (
            <>
              {symptom && !lockedDoctor && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease }}
                  className="relative overflow-hidden rounded-card bg-ink p-5 text-white"
                >
                  <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
                  <p className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                    <SymptomGlyph icon={symptom.icon} className="h-4 w-4" />
                    {symptom.label}
                  </p>
                  <p className="mt-3 text-[13px] text-white/70">Вам к врачу</p>
                  <p className="text-[24px] font-semibold leading-tight tracking-[-0.025em]">
                    {directions[direction].specialist}
                  </p>
                  <p className="mt-2.5 text-[13.5px] leading-snug text-white/80">{symptom.hint}</p>
                  {symptom.urgent && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11.5px] font-medium">
                      <Clock className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                      Лучше не откладывать — ищем ближайшие окна
                    </p>
                  )}
                </motion.div>
              )}
              {lockedDoctor && <LockedDoctorCard doctor={lockedDoctor} onOpen={onOpenDoctor} />}

              <div className="mb-2 mt-7 flex items-baseline justify-between">
                <p className="t-micro">Начнём с</p>
                {!lockedDoctor && candidates.length > 1 && (
                  <p className="text-[12px] text-ink-3">цена зависит от врача</p>
                )}
              </div>
              <div className="divide-hairline rounded-card bg-surface shadow-hairline">
                {services.map((s, i) => {
                  const on = serviceId === s.id;
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.05, duration: 0.35, ease }}
                      onClick={() => {
                        hapticSelect();
                        setServiceId(s.id);
                      }}
                      className="press-soft flex w-full items-center gap-3.5 px-4 py-3.5 text-left"
                    >
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors",
                          on
                            ? "bg-ink text-white"
                            : "shadow-[inset_0_0_0_1.5px_var(--hs-line-strong)]",
                        )}
                      >
                        <AnimatePresence>
                          {on && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="h-2 w-2 rounded-full bg-white"
                            />
                          )}
                        </AnimatePresence>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] leading-snug">{s.name}</span>
                        <span className="block text-[12.5px] text-ink-3">
                          {durationText(s.minutes)}
                          {s.first && (
                            <span className="font-medium text-live"> · начать с этого</span>
                          )}
                        </span>
                      </span>
                      <span className="t-num shrink-0 text-[15px] font-medium">
                        {s.same ? "" : "от "}
                        {money(s.from)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {!lockedDoctor && (
                <>
                  <p className="t-micro mb-2 mt-7">
                    {candidates.length > 1 ? `${candidates.length} врача принимают` : "Принимает"}
                  </p>
                  {candidates.length === 0 ? (
                    <EmptyState
                      icon={Stethoscope}
                      title="Нет врача этого профиля"
                      text="Попробуйте другую клинику или выберите другой симптом."
                      className="py-6"
                    />
                  ) : (
                    <div className="space-y-2">
                      {candidates.map((d, i) => {
                        const next = nearestSlots(d, 1)[0];
                        const c = clinicById(d.clinicId);
                        return (
                          <motion.button
                            key={d.id}
                            type="button"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease }}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => onOpenDoctor?.(d.id)}
                            className="flex w-full items-center gap-3 rounded-[16px] bg-surface p-3 text-left shadow-hairline"
                          >
                            <Avatar doctor={d} size={44} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14.5px] font-semibold tracking-[-0.01em]">
                                {d.name}
                              </span>
                              <span className="block truncate text-[12px] text-ink-3">
                                {clinicId ? d.focus : `${c?.name} · ${c?.distanceKm} км`}
                              </span>
                            </span>
                            <span className="shrink-0 text-right">
                              <Rating value={d.rating} className="justify-end" />
                              {next && (
                                <span className="t-num block text-[11.5px] text-live">
                                  {relativeDay(next.dayKey).replace(/,.*/, "")}{" "}
                                  {toTime(next.minute)}
                                </span>
                              )}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── 3. Шахматка ─────────────────────────────────────── */}
          {step === "grid" && (
            <>
              {serviceMeta && (
                <button
                  type="button"
                  onClick={() => (history.includes("plan") ? back() : go("plan"))}
                  className="press-soft mb-4 flex w-full items-center gap-3 rounded-[16px] bg-surface px-4 py-3 text-left shadow-hairline"
                  disabled={Boolean(origin)}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone">
                    <Stethoscope className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium">
                      {serviceMeta.name}
                    </span>
                    <span className="t-num block text-[12px] text-ink-3">
                      {durationText(serviceMeta.minutes)} · {serviceMeta.same ? "" : "от "}
                      {money(serviceMeta.from)}
                    </span>
                  </span>
                  {!origin && <span className="text-[13px] font-medium text-ink-2">Изменить</span>}
                </button>
              )}

              <DayStrip
                days={days}
                selected={dayIdx}
                counts={days.map((d) => freeCount(candidates, d))}
                onSelect={(i) => {
                  hapticSelect();
                  setDayIdx(i);
                }}
              />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${dayIdx}-${candidates.map((c) => c.id).join()}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease }}
                >
                  {hasFree(columns) ? (
                    <SlotGrid
                      columns={columns}
                      appointments={appointments}
                      selected={slot}
                      onSelect={setSlot}
                      movingId={origin?.id}
                    />
                  ) : (
                    <EmptyState
                      icon={CalendarOff}
                      title={
                        days[dayIdx].weekday === 0 && candidates.every((d) => d.daysOff.includes(0))
                          ? "В воскресенье не принимают"
                          : "Свободных окон нет"
                      }
                      text={
                        singleDoctor
                          ? "У врача всё занято в эти дни. Посмотрите следующие даты."
                          : "Все врачи заняты в этот день — ближайшее окно чуть позже."
                      }
                      action={
                        nextFreeDay && (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              hapticSelect();
                              setDayIdx(nextFreeDay.index);
                            }}
                          >
                            Ближайший день · {dayLong(nextFreeDay.key)}
                          </Button>
                        )
                      }
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-ink-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-[4px] bg-surface shadow-[inset_0_0_0_1px_var(--hs-line-strong)]" />
                  Свободно
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="slot-taken h-3 w-3 rounded-[4px]" />
                  Занято
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-[4px] bg-ink" />
                  Выбрано
                </span>
                {appointments.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-[4px] bg-live-soft shadow-[inset_0_0_0_1px_var(--hs-live)]" />
                    Ваша запись
                  </span>
                )}
              </div>
            </>
          )}

          {/* ── 4. Подтверждение ─────────────────────────────────── */}
          {step === "confirm" && slot && slotDoctor && slotClinic && (
            <>
              <div className="flex items-center gap-4">
                <Avatar doctor={slotDoctor} size={68} eager />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[18px] font-semibold tracking-[-0.02em]">
                    {slotDoctor.name}
                  </p>
                  <p className="truncate text-[13px] text-ink-2">
                    {directions[slotDoctor.direction].specialist} ·{" "}
                    {experienceText(slotDoctor.experienceYears)}
                  </p>
                  <Rating value={slotDoctor.rating} className="mt-1" />
                </div>
              </div>

              {origin && (
                <p className="mt-5 rounded-[14px] bg-stone px-4 py-3 text-[13px] text-ink-2">
                  Было:{" "}
                  <span className="t-num">
                    {relativeDay(origin.dayKey)} · {toTime(origin.minute)}
                  </span>
                  {origin.doctorId !== slotDoctor.id && ` · ${doctorById(origin.doctorId)?.name}`}
                </p>
              )}

              <div className="divide-hairline mt-5 rounded-card bg-surface shadow-hairline">
                <SummaryRow icon={Clock} label="Когда">
                  <span className="t-num">
                    {relativeDay(slot.dayKey)}
                    {relativeDay(slot.dayKey).length < 9 &&
                      `, ${dayLong(slot.dayKey).split(", ")[1]}`}{" "}
                    · {toTime(slot.minute)}
                  </span>
                  {slotService && (
                    <span className="block text-[12.5px] text-ink-3">
                      {durationText(slotService.minutes)}, до{" "}
                      {toTime(slot.minute + slotService.minutes)}
                    </span>
                  )}
                </SummaryRow>
                <SummaryRow icon={Stethoscope} label="Услуга">
                  {slotService?.name}
                  {slotService && (
                    <span className="t-num block text-[12.5px] text-ink-3">
                      {money(slotService.price)}
                    </span>
                  )}
                </SummaryRow>
                <SummaryRow icon={MapPin} label="Адрес">
                  {slotClinic.name}
                  <span className="block text-[12.5px] text-ink-3">{slotClinic.address}</span>
                </SummaryRow>
                <SummaryRow icon={CreditCard} label="Оплата">
                  В клинике после приёма
                  <span className="block text-[12.5px] text-ink-3">
                    Бесплатная отмена за 2 часа
                  </span>
                </SummaryRow>
              </div>

              <BringList items={bring} className="mt-6" />

              {!origin && (
                <>
                  <p className="t-micro mb-2 mt-6">Комментарий врачу</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Что беспокоит и как давно — врач прочитает до приёма"
                    className="w-full resize-none rounded-[16px] bg-surface px-4 py-3 text-[15px] shadow-hairline outline-none placeholder:text-ink-3 focus:shadow-[inset_0_0_0_1.5px_var(--hs-ink)]"
                  />
                </>
              )}
            </>
          )}

          {/* ── 5. Итог ─────────────────────────────────────────── */}
          {step === "done" && result && (
            <DoneView
              appointment={appointments.find((a) => a.id === result.id) ?? result}
              moved={Boolean(origin)}
              bring={bring}
              confirmCancel={confirmCancel}
              setConfirmCancel={setConfirmCancel}
              onReschedule={() => {
                setOrigin(appointments.find((a) => a.id === result.id) ?? result);
                setSlot(null);
                go("grid");
              }}
              onCancel={() => {
                hapticSelect();
                appointmentsStore.cancel(result.id);
                setDir(1);
                setHistory(["cancelled"]);
              }}
            />
          )}

          {step === "cancelled" && (
            <div className="flex flex-col items-center py-10 text-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="grid h-14 w-14 place-items-center rounded-full bg-stone"
              >
                <CalendarOff className="h-6 w-6" strokeWidth={ICON_STROKE} />
              </motion.span>
              <p className="t-headline mt-5">Запись отменена</p>
              <p className="t-caption mt-1.5 max-w-[260px]">
                Клиника получила отмену. Время снова свободно для других гостей.
              </p>
              <Button
                variant="secondary"
                className="mt-6"
                onClick={() => {
                  setOrigin(undefined);
                  setSlot(null);
                  setResult(null);
                  setConfirmCancel(false);
                  setDir(1);
                  setHistory(["grid"]);
                }}
              >
                Выбрать другое время
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </BottomSheet>
  );
}

/* ── Части шагов ─────────────────────────────────────────────────── */

function DayStrip({
  days,
  selected,
  counts,
  onSelect,
}: {
  days: ClinicDay[];
  selected: number;
  counts: number[];
  onSelect: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);
  return (
    <div ref={ref} className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
      {days.map((d, i) => {
        const on = i === selected;
        const n = counts[i];
        return (
          <motion.button
            key={d.key}
            data-day={i}
            type="button"
            whileTap={{ scale: 0.93 }}
            transition={tapSpring}
            onClick={() => onSelect(i)}
            className={cn(
              "relative flex h-[68px] w-[50px] shrink-0 flex-col items-center justify-center rounded-[16px]",
              !on && "bg-surface shadow-hairline",
              n === 0 && !on && "opacity-45",
            )}
          >
            {on && (
              <motion.span
                layoutId="clinic-day-pill"
                transition={{ type: "spring", stiffness: 480, damping: 38 }}
                className="absolute inset-0 rounded-[16px] bg-ink"
              />
            )}
            <span
              className={cn(
                "relative text-[11px] font-medium",
                on ? "text-white/70" : "text-ink-3",
              )}
            >
              {i === 0 ? "Сег" : d.short}
            </span>
            <span
              className={cn(
                "t-num relative text-[18px] font-semibold leading-tight",
                on ? "text-white" : "text-ink",
              )}
            >
              {d.dayNum}
            </span>
            <span
              className={cn(
                "t-num relative text-[10px] font-medium",
                on ? "text-white/70" : n > 0 ? "text-live" : "text-ink-3",
              )}
            >
              {n > 0 ? n : "—"}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function DoctorHeader({
  doctor,
  free,
  onOpen,
}: {
  doctor: Doctor;
  free: number;
  onOpen?: (doctorId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(doctor.id)}
      className="press-soft flex w-full min-w-0 flex-col items-center text-center"
    >
      <Avatar doctor={doctor} size={40} />
      <span className="mt-1.5 w-full truncate text-[13px] font-semibold tracking-[-0.01em]">
        {shortName(doctor.name)}
      </span>
      <span className="t-num flex items-center gap-1 text-[11px] text-ink-3">
        <Rating value={doctor.rating} className="text-[11px]" />· {slotsText(free)}
      </span>
    </button>
  );
}

function DayHeader({ day, free }: { day: ClinicDay; free: number }) {
  return (
    <div className="text-center">
      <p className="truncate text-[13px] font-semibold tracking-[-0.01em]">
        {day.index <= 1 ? day.label : `${day.short}, ${day.dayNum}`}
      </p>
      <p className={cn("t-num text-[11px]", free > 0 ? "text-live" : "text-ink-3")}>
        {free > 0 ? slotsText(free) : "нет окон"}
      </p>
    </div>
  );
}

function LockedDoctorCard({ doctor, onOpen }: { doctor: Doctor; onOpen?: (id: string) => void }) {
  const c = clinicById(doctor.clinicId);
  return (
    <button
      type="button"
      onClick={() => onOpen?.(doctor.id)}
      className="press-soft flex w-full items-center gap-4 rounded-card bg-surface p-4 text-left shadow-hairline"
    >
      <Avatar doctor={doctor} size={60} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-semibold tracking-[-0.015em]">
          {doctor.name}
        </span>
        <span className="block truncate text-[12.5px] text-ink-2">
          {directions[doctor.direction].specialist}
        </span>
        <span className="block truncate text-[12px] text-ink-3">{c?.name}</span>
      </span>
      <Rating value={doctor.rating} />
    </button>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5 px-4 py-3.5">
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-ink-3" strokeWidth={ICON_STROKE} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">{label}</p>
        <div className="mt-0.5 text-[15px] tracking-[-0.01em]">{children}</div>
      </div>
    </div>
  );
}

function BringList({ items, className }: { items: string[]; className?: string }) {
  return (
    <div className={className}>
      <p className="t-micro mb-2">Что взять с собой</p>
      <ul className="space-y-2">
        {items.map((b, i) => (
          <motion.li
            key={b}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease }}
            className="flex items-start gap-2.5 text-[14px] text-ink-2"
          >
            <CircleCheck
              className="mt-[1px] h-4 w-4 shrink-0 text-live"
              strokeWidth={ICON_STROKE}
            />
            {b}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function DoneView({
  appointment,
  moved,
  bring,
  confirmCancel,
  setConfirmCancel,
  onReschedule,
  onCancel,
}: {
  appointment: Appointment;
  moved: boolean;
  bring: string[];
  confirmCancel: boolean;
  setConfirmCancel: (v: boolean) => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const doctor = doctorById(appointment.doctorId);
  const clinic = clinicById(appointment.clinicId);
  if (!doctor || !clinic) return null;
  const service = doctorServices(doctor).find((s) => s.id === appointment.serviceId);
  return (
    <>
      <div className="flex flex-col items-center pb-2 pt-4 text-center">
        <SuccessMark />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease }}
          className="t-headline mt-5"
        >
          {moved ? "Запись перенесена" : "Вы записаны"}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4, ease }}
          className="t-num mt-1 text-[28px] font-semibold tracking-[-0.03em]"
        >
          {relativeDay(appointment.dayKey)} · {toTime(appointment.minute)}
        </motion.p>
        <p className="t-caption mt-1">Напомним за день и за 2 часа до приёма</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease }}
        className="mt-6 overflow-hidden rounded-card bg-surface shadow-hairline"
      >
        <div className="flex items-center gap-3.5 p-4">
          <Avatar doctor={doctor} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15.5px] font-semibold tracking-[-0.015em]">
              {doctor.name}
            </p>
            <p className="truncate text-[12.5px] text-ink-2">{service?.name}</p>
          </div>
          {service && (
            <p className="t-num shrink-0 text-[15px] font-medium">{money(service.price)}</p>
          )}
        </div>
        <p className="flex items-start gap-2 border-t border-line px-4 py-3 text-[13px] text-ink-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={ICON_STROKE} />
          <span>
            {clinic.name} · {clinic.address}
            {dayLong(appointment.dayKey) && (
              <span className="block text-[12px] text-ink-3">
                Приходите за 10 минут · {dayLong(appointment.dayKey)}
              </span>
            )}
          </span>
        </p>
      </motion.div>

      <BringList items={bring} className="mt-6" />

      <div className="mt-7">
        <AnimatePresence mode="wait" initial={false}>
          {confirmCancel ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="rounded-card bg-busy-soft p-4"
            >
              <p className="text-[14.5px] font-medium text-busy">Отменить запись?</p>
              <p className="mt-0.5 text-[12.5px] text-ink-2">
                Время освободится для других гостей.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="md" variant="light" onClick={() => setConfirmCancel(false)}>
                  Оставить
                </Button>
                <Button size="md" className="bg-busy text-white" onClick={onCancel}>
                  Отменить
                </Button>
              </div>
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
              <Button variant="secondary" onClick={onReschedule}>
                Перенести
              </Button>
              <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                Отменить запись
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
