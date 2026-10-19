import { useEffect, useState } from "react";
import { guestApi, venueDate } from "@/lib/guest-api";
type Request = {
  id: string;
  startsAt: string;
  guests: number;
  status: string;
  reservationId: string | null;
};
export function BookingRequestHistory() {
  const [requests, setRequests] = useState<Request[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await guestApi<{ requests: Request[] }>("/dine-in/booking-requests");
        if (active) {
          setRequests(data.requests);
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    };
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);
  if (!requests.length && !error) return null;
  return (
    <section className="space-y-3">
      <h2 className="t-title">Заявки на бронирование</h2>
      {error && (
        <p role="alert" className="text-sm text-busy">
          {error}
        </p>
      )}
      {requests.map((r) => (
        <article key={r.id} className="rounded-2xl bg-surface p-4 text-sm">
          <strong>
            {{
              pending: "Ожидает подтверждения",
              confirmed: "Бронь подтверждена",
              rejected: "Место не подтверждено — свяжитесь с заведением",
            }[r.status] ?? r.status}
          </strong>
          <p className="mt-2">
            {venueDate(r.startsAt)} · {r.guests} гостей
          </p>
          {r.status === "pending" && (
            <p className="mt-2 text-xs text-ink-3">Стол ещё не забронирован.</p>
          )}
        </article>
      ))}
    </section>
  );
}
