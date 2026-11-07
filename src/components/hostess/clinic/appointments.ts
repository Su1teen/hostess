import { useSyncExternalStore } from "react";
import { dayKey } from "@/data/clinics";

/** Запись гостя к врачу. Демо: живёт в памяти и в localStorage этого браузера. */
export type Appointment = {
  id: string;
  doctorId: string;
  clinicId: string;
  serviceId: string;
  symptomId?: string;
  dayKey: string;
  minute: number;
  comment?: string;
  createdAt: number;
};

const KEY = "hostess.clinic.appointments.v1";
let items: Appointment[] = load();
const listeners = new Set<() => void>();

function load(): Appointment[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Appointment[]) : [];
    const today = dayKey(new Date());
    // Прошедшие записи в демо не храним.
    return Array.isArray(parsed) ? parsed.filter((a) => a.dayKey >= today) : [];
  } catch {
    return [];
  }
}

function commit(next: Appointment[]) {
  items = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* приватный режим — живём только в памяти */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const byTime = (a: Appointment, b: Appointment) =>
  a.dayKey === b.dayKey ? a.minute - b.minute : a.dayKey < b.dayKey ? -1 : 1;

export const appointmentsStore = {
  add(a: Omit<Appointment, "id" | "createdAt">): Appointment {
    const created: Appointment = {
      ...a,
      id: `apt-${Date.now().toString(36)}`,
      createdAt: Date.now(),
    };
    commit([...items, created].sort(byTime));
    return created;
  },
  move(id: string, patch: Pick<Appointment, "doctorId" | "dayKey" | "minute">) {
    commit(items.map((a) => (a.id === id ? { ...a, ...patch } : a)).sort(byTime));
  },
  cancel(id: string) {
    commit(items.filter((a) => a.id !== id));
  },
};

const getSnapshot = () => items;
const getServerSnapshot = (): Appointment[] => [];

export function useAppointments() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Слот уже занят записью самого гостя — показываем его в шахматке как «ваша запись». */
export const isMine = (list: Appointment[], doctorId: string, day: string, minute: number) =>
  list.find((a) => a.doctorId === doctorId && a.dayKey === day && a.minute === minute);
