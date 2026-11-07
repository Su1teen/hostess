import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { clinicById, doctorById } from "@/data/clinics";
import { BookingFlow, type BookingInit } from "./BookingFlow";
import { ClinicSheet } from "./ClinicSheet";
import { DoctorSheet } from "./DoctorSheet";

export type ClinicApi = {
  openClinic: (clinicId: string) => void;
  openDoctor: (doctorId: string) => void;
  startBooking: (init?: BookingInit) => void;
};

const noop: ClinicApi = { openClinic: () => {}, openDoctor: () => {}, startBooking: () => {} };
const ClinicHubContext = createContext<ClinicApi>(noop);

export const useClinicHub = () => useContext(ClinicHubContext);

/**
 * Стек медицинских шторок: клиника (z-100) → врач (z-110) → запись (z-115).
 * Врач, открытый из записи, встаёт над ней (z-118), а новая запись из такой
 * карточки заменяет текущую.
 */
export function useClinicHost() {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<{ id: string; above: boolean } | null>(null);
  const [booking, setBooking] = useState<{ key: number; init: BookingInit } | null>(null);
  const bookingOpen = useRef(false);
  bookingOpen.current = Boolean(booking);

  const api = useMemo<ClinicApi>(
    () => ({
      openClinic: (id) => {
        setDoctor(null);
        setBooking(null);
        setClinicId(id);
      },
      openDoctor: (id) => setDoctor({ id, above: bookingOpen.current }),
      startBooking: (init = {}) => {
        setDoctor((d) => (d?.above ? null : d));
        setBooking({ key: Date.now(), init });
      },
    }),
    [],
  );

  const clinic = clinicId ? clinicById(clinicId) : undefined;
  const doc = doctor ? doctorById(doctor.id) : undefined;

  const wrap = (children: ReactNode) => (
    <ClinicHubContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {clinic && (
          <ClinicSheet
            key={`clinic-${clinic.id}`}
            clinic={clinic}
            onClose={() => setClinicId(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {doc && (
          <DoctorSheet
            key={`doctor-${doc.id}`}
            doctor={doc}
            z={doctor?.above ? "z-[118]" : "z-[110]"}
            showClinic={clinic?.id !== doc.clinicId}
            onClose={() => setDoctor(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {booking && (
          <BookingFlow
            key={booking.key}
            init={booking.init}
            onClose={() => setBooking(null)}
            onOpenDoctor={api.openDoctor}
          />
        )}
      </AnimatePresence>
    </ClinicHubContext.Provider>
  );

  return { api, wrap, open: Boolean(clinic || doc || booking) };
}
