import { useEffect, useRef, useState } from "react";
import {
  guestApi,
  statusLabel,
  venueDate,
  type Availability,
  type GuestReservation,
  type Quote,
} from "@/lib/guest-api";
import { GuestFloor } from "./GuestFloor";

const dateKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function GuestBooking({
  items = [],
  onBooked,
  rescheduleId,
}: {
  items?: { productId: string; quantity: number }[];
  onBooked?: (r: GuestReservation) => void;
  rescheduleId?: string;
}) {
  const [date, setDate] = useState(dateKey),
    [time, setTime] = useState("19:00"),
    [guests, setGuests] = useState(2);
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [consent, setConsent] = useState(false);
  const [hall, setHall] = useState<Availability | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null),
    [result, setResult] = useState<GuestReservation | null>(null),
    [authenticated, setAuthenticated] = useState(false);
  const attempt = useRef<{ holdId: string; quoteId?: string; idempotencyKey: string } | null>(null);
  const startsAt = new Date(`${date}T${time}:00+05:00`).toISOString();
  const endsAt = new Date(Date.parse(startsAt) + 2 * 3600_000).toISOString();
  const itemKey = JSON.stringify(items);
  useEffect(() => {
    let active = true;
    void guestApi<{ guest: { name: string } }>("/profile")
      .then((p) => {
        if (active) {
          setAuthenticated(true);
          setName(p.guest.name);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!attempt.current) setQuote(null);
  }, [startsAt, endsAt, guests, selected, itemKey]);
  useEffect(() => {
    let active = true,
      controller: AbortController | undefined;
    setSelected([]);
    setHall(null);
    setLoading(true);
    setError("");
    const refresh = async () => {
      controller = new AbortController();
      try {
        const response = await guestApi<Availability>(
          `/availability?startsAt=${encodeURIComponent(startsAt)}&endsAt=${encodeURIComponent(endsAt)}`,
          undefined,
          "GET",
          controller.signal,
        );
        if (active) {
          setHall(response);
          setError("");
          setSelected((prev) => {
            if (attempt.current) return prev;
            const next = prev.filter((id) =>
              response.tables.some((t) => t.id === id && t.available),
            );
            return next.length === prev.length ? prev : next;
          });
        }
      } catch (e) {
        if (active && !controller.signal.aborted) {
          setHall(null);
          setError(e instanceof Error ? e.message : "Доступность неизвестна");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 15000);
    return () => {
      active = false;
      controller?.abort();
      clearInterval(timer);
    };
  }, [startsAt, endsAt]);
  const capacity = selected.reduce(
    (n, id) => n + (hall?.tables.find((t) => t.id === id)?.seats ?? 0),
    0,
  );
  async function submit() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      if (!authenticated) {
        await guestApi("/bootstrap", {
          name: name.trim(),
          phone: phone.replace(/[\s()-]/g, ""),
          consent,
        });
        setAuthenticated(true);
      }
      if (items.length && !quote && !attempt.current) {
        setQuote(await guestApi<Quote>("/quotes", { items }));
        return;
      }
      if (quote && !attempt.current && Date.parse(quote.expiresAt) <= Date.now()) {
        setQuote(null);
        throw new Error("Цена изменилась. Получите и подтвердите новую цену");
      }
      if (!attempt.current) {
        const hold = await guestApi<{ id: string }>("/holds", {
          startsAt,
          endsAt,
          guests,
          tableIds: selected,
        });
        attempt.current = {
          holdId: hold.id,
          quoteId: quote?.id,
          idempotencyKey: crypto.randomUUID(),
        };
      }
      const response = rescheduleId
        ? await guestApi<{ reservation: GuestReservation }>(
            `/reservations/${rescheduleId}`,
            { action: "reschedule", holdId: attempt.current.holdId },
            "PATCH",
          )
        : await guestApi<{ reservation: GuestReservation }>("/reservations", attempt.current);
      if (!response.reservation)
        throw new Error("Нет подтверждения сервера. Проверьте кабинет перед повтором");
      setResult(response.reservation);
      onBooked?.(response.reservation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать бронь");
      if ((e as { code?: string }).code === "QUOTE_EXPIRED") {
        attempt.current = null;
        setQuote(null);
      }
      if (
        (e as { code?: string }).code === "HOLD_EXPIRED" ||
        (e as { code?: string }).code === "CONFLICT"
      )
        attempt.current = null;
    } finally {
      setPending(false);
    }
  }
  if (result)
    return (
      <div className="rounded-[24px] bg-surface p-6">
        <p className="t-micro">XOXO · {statusLabel[result.status] ?? result.status}</p>
        <h2 className="t-title mt-3">{venueDate(result.startsAt)}</h2>
        <p className="mt-3 text-sm text-ink-2">
          {result.guests} гостей · {result.tableIds.join(" + ")}
        </p>
        <p className="mt-4 text-sm text-ink-3">
          Заявка сохранена в системе заведения. Подтверждение менеджера будет отражено в кабинете.
        </p>
        <a
          href="/guest"
          className="mt-5 flex min-h-12 items-center justify-center rounded-xl bg-ink text-white"
        >
          Моя бронь и история
        </a>
      </div>
    );
  const inputClass =
    "mt-2 min-h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-base";
  return (
    <form
      className="space-y-5 pb-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <p className="t-micro">Бронь · время Астаны</p>
        <h2 className="t-title mt-2">Ваш вечер в XOXO</h2>
        <p className="mt-2 text-sm text-ink-3">
          Стол на 2 часа. Заявка требует подтверждения заведения.
        </p>
      </div>
      <fieldset disabled={pending || Boolean(attempt.current)} className="contents">
        {!authenticated && (
          <>
            <label className="block text-sm">
              Ваше имя
              <input
                className={inputClass}
                required
                maxLength={100}
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Телефон
              <input
                className={inputClass}
                required
                type="tel"
                autoComplete="tel"
                placeholder="+7…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="min-w-0 text-sm">
            Дата
            <input
              required
              type="date"
              min={dateKey()}
              className={inputClass}
              value={date}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            />
          </label>
          <label className="min-w-0 text-sm">
            Время
            <input
              required
              type="time"
              className={inputClass}
              value={time}
              onChange={(e) => {
                if (e.target.value) setTime(e.target.value);
              }}
            />
          </label>
        </div>
        <label className="block text-sm">
          Гости
          <select
            className={inputClass}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          >
            {Array.from({ length: 20 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        {loading ? (
          <div
            className="h-64 animate-pulse motion-reduce:animate-none rounded-[24px] bg-surface"
            role="status"
          >
            Проверяем свободные столы…
          </div>
        ) : hall ? (
          <GuestFloor
            hall={hall}
            selected={selected}
            onSelect={(id) =>
              setSelected((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
          />
        ) : (
          <p className="text-sm text-ink-3">
            Карта временно недоступна. Свободные места не подтверждены.
          </p>
        )}
        {selected.length > 0 && (
          <p className="text-sm">
            {selected.join(" + ")} · {capacity} мест
            {capacity < guests ? " · выберите больше мест" : ""}
          </p>
        )}
        {!authenticated && (
          <label className="flex min-h-11 items-start gap-3 text-sm leading-relaxed">
            <input
              required
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Согласен на обработку имени и телефона для бронирования. История старого аккаунта
            доступна только после подтверждения в WhatsApp.
          </label>
        )}
      </fieldset>
      {quote && (
        <div className="rounded-2xl bg-surface p-4">
          <p className="font-medium">Подтвердите предзаказ</p>
          {quote.lines.map((l) => (
            <p key={l.productId} className="mt-2 text-sm">
              {l.productName} × {l.quantity} · {Number(l.total).toLocaleString("ru-RU")} ₸
            </p>
          ))}
          <p className="mt-3 text-xs text-ink-3">
            Цена действительна до {venueDate(quote.expiresAt)}. Предзаказ не оплачен; окончательный
            расчёт в заведении.
          </p>
        </div>
      )}
      {error && (
        <p className="text-sm text-busy" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={
          pending ||
          (!attempt.current &&
            (!hall || !selected.length || capacity < guests || (!authenticated && !consent)))
        }
        className="min-h-13 w-full rounded-2xl bg-ink px-4 py-4 text-white disabled:opacity-40"
      >
        {pending
          ? "Сохраняем…"
          : attempt.current
            ? "Повторить тот же запрос"
            : quote
              ? "Подтвердить цену и отправить заявку"
              : items.length
                ? "Уточнить цену предзаказа"
                : rescheduleId
                  ? "Перенести бронь"
                  : "Отправить заявку"}
      </button>
    </form>
  );
}
