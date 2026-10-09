import { useEffect, useState } from "react";
import { guestApi, statusLabel, venueDate, type GuestProfile } from "@/lib/guest-api";
import { GuestBooking } from "./GuestBooking";
import { restaurants } from "@/data/hostess";
const venue = restaurants.find((r) => r.id === "xoxo")!;

export function GuestPortal() {
  const [data, setData] = useState<GuestProfile | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [reschedule, setReschedule] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [claimCode, setClaimCode] = useState<string | null>(null);
  const load = async () => {
    try {
      setData(await guestApi<GuestProfile>("/profile"));
      setError("");
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Кабинет недоступен");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  if (loading)
    return (
      <p className="p-6" role="status">
        Загружаем вашу бронь…
      </p>
    );
  if (!data)
    return (
      <div className="p-6">
        <h1 className="t-title">Ваш кабинет</h1>
        <p className="mt-4 text-sm" role="status">
          {error}
        </p>
        <p className="mt-3 text-sm text-ink-3">
          Для существующего аккаунта запросите новую ссылку в проверенном чате WhatsApp.
        </p>
        <button className="mt-4 min-h-11 rounded-xl bg-surface px-4" onClick={() => void load()}>
          Повторить
        </button>
      </div>
    );
  const upcoming = data.reservations.filter(
    (r) => Date.parse(r.endsAt) > Date.now() && !["cancelled", "no_show"].includes(r.status),
  );
  const history = data.reservations.filter((r) => !upcoming.includes(r));
  async function cancel(id: string) {
    setBusy(true);
    try {
      await guestApi(`/reservations/${id}`, { action: "cancel" }, "PATCH");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отменить");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6 p-5 pb-[calc(100px+env(safe-area-inset-bottom))]">
      <div>
        <p className="t-micro">HOSTESS × XOXO</p>
        <h1 className="t-title mt-2">{data.guest.name}</h1>
        <p className="mt-2 text-sm text-ink-3">
          {data.guest.provisional
            ? "Новый профиль · телефон ещё не подтверждён"
            : "Защищённый гостевой кабинет"}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-busy">
          {error}
        </p>
      )}
      {data.guest.provisional && (
        <div className="rounded-2xl bg-surface p-4">
          <p className="text-sm">
            Чтобы связать бронь с WhatsApp и прежней историей, отправьте код в чат заведения со
            своего номера. Код действует 12 минут.
          </p>
          {claimCode ? (
            <p className="mt-3 break-all rounded-xl border border-line p-3 font-mono text-sm select-all">
              {claimCode}
            </p>
          ) : (
            <button
              className="mt-3 min-h-11 rounded-xl border border-line px-3 text-sm"
              onClick={() => {
                void guestApi<{ claimCode: string }>("/ownership", {})
                  .then((r) => setClaimCode(r.claimCode))
                  .catch((e) => setError(e.message));
              }}
            >
              Получить код подтверждения
            </button>
          )}
        </div>
      )}
      {reschedule ? (
        <GuestBooking
          rescheduleId={reschedule}
          onBooked={() => {
            setReschedule(null);
            void load();
          }}
        />
      ) : (
        <>
          {[
            { title: "Предстоящие брони", rows: upcoming },
            { title: "История", rows: history },
          ].map((section) => (
            <section key={section.title}>
              <h2 className="t-headline mb-3">{section.title}</h2>
              {!section.rows.length && <p className="text-sm text-ink-3">Пока нет записей</p>}
              <div className="space-y-3">
                {section.rows.map((r) => (
                  <article key={r.id} className="rounded-[24px] bg-surface p-5 shadow-hairline">
                    <p className="t-micro">{statusLabel[r.status] ?? r.status}</p>
                    <h3 className="mt-3 text-lg font-medium">{venueDate(r.startsAt)}</h3>
                    <p className="mt-1 text-sm text-ink-2">
                      {r.guests} гостей · {(r.tableIds ?? [r.tableId]).join(" + ")}
                    </p>
                    <p className="mt-2 text-xs text-ink-3">
                      Бронь {r.id.slice(0, 8)}
                      {r.iikoSyncStatus !== "synced" ? " · подтверждение iiko не получено" : ""}
                    </p>
                    {r.preorders.length > 0 && (
                      <div className="mt-4 border-t border-line pt-3">
                        <p className="text-sm font-medium">Предзаказ · сохранённая заявка</p>
                        {r.preorders.map((l) => (
                          <p key={l.productId} className="mt-2 text-sm text-ink-2">
                            {l.productName} × {l.quantity} ·{" "}
                            {Number(l.total).toLocaleString("ru-RU")} ₸
                          </p>
                        ))}
                      </div>
                    )}
                    {r.depositStatus !== "none" && (
                      <p className="mt-3 text-sm">
                        Депозит: {Number(r.depositAmount).toLocaleString("ru-RU")} ₸ ·{" "}
                        {r.depositStatus}
                      </p>
                    )}
                    {upcoming.includes(r) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          disabled={busy}
                          onClick={() => void cancel(r.id)}
                          className="min-h-11 rounded-xl border border-line px-3 text-sm"
                        >
                          Отменить бронь
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => setReschedule(r.id)}
                          className="min-h-11 rounded-xl border border-line px-3 text-sm"
                        >
                          Перенести
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
      {data.nextCursor && (
        <button
          className="min-h-11 rounded-xl border border-line px-4 text-sm"
          onClick={() => {
            void guestApi<GuestProfile>(`/profile?before=${encodeURIComponent(data.nextCursor!)}`)
              .then((next) =>
                setData({ ...next, reservations: [...data.reservations, ...next.reservations] }),
              )
              .catch((e) => setError(e.message));
          }}
        >
          Показать ещё историю
        </button>
      )}
      <p className="text-sm text-ink-2">
        {venue.name} · {venue.district}, {venue.address}
      </p>
      <a
        href={`https://2gis.kz/astana/search/${encodeURIComponent(venue.name + " " + venue.address)}`}
        rel="noreferrer"
        target="_blank"
        className="flex min-h-11 items-center text-sm"
      >
        Найти XOXO в 2ГИС ↗
      </a>
      <div className="flex gap-4">
        <a href="/" className="flex min-h-11 items-center text-sm">
          К заведениям
        </a>
        <button
          className="min-h-11 text-sm text-ink-3"
          onClick={() => {
            void guestApi("/logout", {}).then(() => {
              setData(null);
              setError("Вы вышли из кабинета");
            });
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
