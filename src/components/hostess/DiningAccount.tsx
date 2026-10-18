import { useCallback, useEffect, useRef, useState } from "react";
import {
  diningApi,
  cartKey,
  kzt,
  type DiningOrder,
  type DiningProfile,
  type LoyaltyTransaction,
  type Wallet,
} from "@/lib/dine-in-api";
import { guestApi, GuestApiError, venueDate } from "@/lib/guest-api";
import { clearDiningSession } from "@/lib/dining-session";

export function DiningReceipt({ order }: { order: DiningOrder }) {
  return (
    <article className="space-y-4 rounded-[24px] border border-line bg-surface p-5">
      <p className="t-micro">XOXO · Стол №{order.tableCode}</p>
      <h2 className="t-headline">
        Заказ #{order.orderNumber} {order.status === "cancelled" ? "отменён" : "принят"}
      </h2>
      <p className="text-sm text-ink-2">{venueDate(order.createdAt)}</p>
      <ul className="divide-y divide-line">
        {order.lines.map((line) => (
          <li
            key={cartKey(line.productId, line.itemType)}
            className="flex justify-between gap-3 py-3 text-sm"
          >
            <span className="min-w-0 break-words">
              {line.productName}
              <span className="mt-1 block text-ink-2">
                {line.quantity} × {kzt(line.unitPrice)} ·{" "}
                {line.itemType === "REGULAR_MENU" ? "Меню" : "Биржа"}
              </span>
            </span>
            <span className="shrink-0">{kzt(line.total)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between text-sm">
        <span>Сумма</span>
        <span>{kzt(order.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Списано бонусов</span>
        <span>{order.discount}</span>
      </div>
      <div className="flex justify-between gap-3 border-t border-line pt-4 font-semibold">
        <span>К оплате официанту</span>
        <span className="shrink-0">{kzt(order.payable)}</span>
      </div>
      <p className="text-xs leading-relaxed text-ink-2">
        Оплата принимается официантом через терминал. Банковское подтверждение в Hostess не
        поступает.
      </p>
      {order.cashback > 0 && (
        <p className="text-sm text-brass">
          +{order.cashback} бонусов
          {order.cashbackExpiresAt ? ` · до ${venueDate(order.cashbackExpiresAt)}` : ""}
        </p>
      )}
    </article>
  );
}

export function GuestIdentity({
  onChanged,
  disabled = false,
}: {
  onChanged: () => void;
  disabled?: boolean;
}) {
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="space-y-3 rounded-[24px] border border-line p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || disabled) return;
        setBusy(true);
        setError("");
        try {
          await guestApi("/bootstrap", {
            name: name.trim(),
            phone: phone.replace(/[\s()-]/g, ""),
            consent,
          });
          onChanged();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Не удалось открыть профиль");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3 className="font-semibold">Сохранить бонусы</h3>
      <p className="text-sm leading-relaxed text-ink-2">
        Создадим новый гостевой профиль. Ввод телефона не открывает чужой кошелёк. Для существующего
        аккаунта откройте персональную ссылку из WhatsApp, затем вернитесь к этому столу.
      </p>
      <fieldset disabled={busy || disabled} className="space-y-3">
        <label className="block text-sm">
          Имя
          <input
            required
            maxLength={100}
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 min-h-12 w-full rounded-xl border border-line bg-canvas px-3"
          />
        </label>
        <label className="block text-sm">
          Телефон
          <input
            required
            type="tel"
            pattern="[+0-9 ()-]{10,20}"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 7XX XXX XX XX"
            className="mt-1 min-h-12 w-full rounded-xl border border-line bg-canvas px-3"
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-xs">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="size-5 shrink-0"
          />
          Согласен на обработку данных для гостевого профиля
        </label>
        <button className="min-h-12 w-full rounded-xl bg-ink px-4 text-white disabled:opacity-50">
          {busy ? "Создаём профиль…" : "Продолжить с бонусами"}
        </button>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-busy">
          {error}
        </p>
      )}
    </form>
  );
}

const transactionNames = {
  earn: "Начисление",
  redeem: "Списание",
  expire: "Истечение",
  reversal: "Возврат / отмена",
  adjustment: "Корректировка",
};
export function DiningAccount({
  onSessionChanged,
  showIdentity = true,
}: {
  onSessionChanged?: () => void;
  showIdentity?: boolean;
}) {
  const [profile, setProfile] = useState<DiningProfile | null>(null),
    [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]),
    [orders, setOrders] = useState<DiningOrder[]>([]);
  const [cursor, setCursor] = useState<string | null>(),
    [orderCursor, setOrderCursor] = useState<string | null>();
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [claim, setClaim] = useState(""),
    [selected, setSelected] = useState<DiningOrder | null>(null);
  const generation = useRef(0),
    identity = useRef<string | null>(null);
  const load = useCallback(async () => {
    const current = ++generation.current;
    setError("");
    try {
      const next = await diningApi.profile();
      if (current !== generation.current) return;
      if (identity.current !== next.guest.id) {
        setWallet(null);
        setTransactions([]);
        setOrders([]);
        setSelected(null);
        setClaim("");
        setCursor(null);
        setOrderCursor(null);
      }
      identity.current = next.guest.id;
      setProfile(next);
      const [w, t, o] = await Promise.allSettled([
        diningApi.wallet(),
        diningApi.transactions(),
        diningApi.orders(),
      ]);
      if (current !== generation.current) return;
      if (w.status === "fulfilled") setWallet(w.value);
      else setWallet(null);
      if (t.status === "fulfilled") {
        setTransactions(t.value.transactions);
        setCursor(t.value.nextCursor);
      } else {
        setTransactions([]);
        setCursor(null);
      }
      if (o.status === "fulfilled") {
        setOrders(o.value.orders);
        setOrderCursor(o.value.nextCursor);
      } else {
        setOrders([]);
        setOrderCursor(null);
      }
      if ([w, t, o].some((r) => r.status === "rejected"))
        setError("Часть данных пока недоступна. Обновите кабинет позже.");
    } catch (e) {
      if (current !== generation.current) return;
      identity.current = null;
      setProfile(null);
      setWallet(null);
      setTransactions([]);
      setOrders([]);
      setSelected(null);
      setClaim("");
      if (!(e instanceof GuestApiError && e.status === 401))
        setError("Не удалось проверить сессию. Попробуйте снова.");
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => {
      generation.current++;
      window.removeEventListener("focus", focus);
    };
  }, [load]);
  if (loading)
    return (
      <p role="status" className="p-5">
        Загружаем кабинет…
      </p>
    );
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="t-headline">{profile?.guest.name ?? "Мой кабинет"}</h2>
        <button className="min-h-11 px-2 text-sm" onClick={() => void load()}>
          Обновить
        </button>
      </div>
      {profile && (
        <p className="text-sm text-ink-2">
          {profile.guest.phone}
          {profile.guest.provisional
            ? " · Новый профиль · WhatsApp не подтверждён"
            : " · Подтверждённый гость"}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-busy">
          {error}
        </p>
      )}
      {!profile ? (
        showIdentity && (
          <GuestIdentity
            onChanged={() => {
              void load();
              onSessionChanged?.();
            }}
          />
        )
      ) : (
        <>
          <div className="rounded-[24px] bg-ink p-6 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">XOXO · Cashback 3%</p>
            <p className="mt-6 text-4xl font-semibold">
              {wallet ? wallet.balance.toLocaleString("ru-RU") : "—"}
            </p>
            <p className="mt-2 text-sm text-white/70">доступных бонусов · 1 бонус = 1 ₸</p>
            {wallet?.nextExpiresAt && (
              <p className="mt-4 text-sm">
                {wallet.expiringAmount} бонусов истекают {venueDate(wallet.nextExpiresAt)}
              </p>
            )}
          </div>
          {wallet && wallet.lots.length > 0 && (
            <details className="rounded-2xl border border-line p-4">
              <summary className="cursor-pointer text-sm">Сроки отдельных начислений</summary>
              {wallet.lots.map((lot) => (
                <p key={lot.id} className="mt-3 text-sm">
                  {lot.remaining} · до {venueDate(lot.expiresAt)}
                </p>
              ))}
            </details>
          )}
          {profile.guest.provisional && (
            <div className="rounded-2xl bg-stone p-4 text-sm">
              <p>
                Чтобы связать этот профиль с WhatsApp, отправьте код боту со своего номера. Код
                действует 12 минут.
              </p>
              {claim ? (
                <p className="mt-3 break-all select-all font-mono">{claim}</p>
              ) : (
                <button
                  className="mt-2 min-h-11 underline"
                  onClick={() =>
                    void guestApi<{ claimCode: string }>("/ownership", {})
                      .then((r) => {
                        if (profile.guest.id === identity.current) setClaim(r.claimCode);
                      })
                      .catch(() => setError("Не удалось получить код"))
                  }
                >
                  Получить код подтверждения
                </button>
              )}
            </div>
          )}
          <section>
            <h3 className="mb-3 font-semibold">Мои заказы</h3>
            {!orders.length && <p className="text-sm text-ink-2">Заказов пока нет</p>}
            <div className="divide-y divide-line">
              {orders.map((order) => (
                <button
                  key={order.id}
                  className="flex min-h-16 w-full items-center justify-between gap-3 py-3 text-left"
                  onClick={() =>
                    void diningApi
                      .receipt(order.id)
                      .then((r) => {
                        if (profile.guest.id === identity.current) setSelected(r.order);
                      })
                      .catch(() => setError("Не удалось открыть заказ"))
                  }
                >
                  <span className="text-sm">
                    #{order.orderNumber} · Стол {order.tableCode}
                    <span className="mt-1 block text-xs text-ink-2">
                      {venueDate(order.createdAt)}
                    </span>
                  </span>
                  <span className="text-sm">{kzt(order.payable)}</span>
                </button>
              ))}
            </div>
            {orderCursor && (
              <button
                className="min-h-11 text-sm underline"
                onClick={() =>
                  void diningApi
                    .orders(orderCursor)
                    .then((r) => {
                      if (profile.guest.id !== identity.current) return;
                      setOrders((old) => [
                        ...old,
                        ...r.orders.filter((o) => !old.some((x) => x.id === o.id)),
                      ]);
                      setOrderCursor(r.nextCursor);
                    })
                    .catch(() => setError("Не удалось загрузить заказы"))
                }
              >
                Ещё заказы
              </button>
            )}
          </section>
          {selected && (
            <div>
              <button className="min-h-11 text-sm" onClick={() => setSelected(null)}>
                Закрыть детали
              </button>
              <DiningReceipt order={selected} />
            </div>
          )}
          <section>
            <h3 className="mb-3 font-semibold">История бонусов</h3>
            {!transactions.length && <p className="text-sm text-ink-2">Операций пока нет</p>}
            <ul className="divide-y divide-line">
              {transactions.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 py-3 text-sm">
                  <span>
                    {transactionNames[t.type]}
                    <span className="mt-1 block text-xs text-ink-2">
                      {venueDate(t.createdAt)}
                      {t.expiresAt ? ` · до ${venueDate(t.expiresAt)}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0">{t.amount.toLocaleString("ru-RU")}</span>
                </li>
              ))}
            </ul>
            {cursor && (
              <button
                className="min-h-11 text-sm underline"
                onClick={() =>
                  void diningApi
                    .transactions(cursor)
                    .then((r) => {
                      if (profile.guest.id !== identity.current) return;
                      setTransactions((old) => [
                        ...old,
                        ...r.transactions.filter((t) => !old.some((x) => x.id === t.id)),
                      ]);
                      setCursor(r.nextCursor);
                    })
                    .catch(() => setError("Не удалось загрузить операции"))
                }
              >
                Ещё операции
              </button>
            )}
          </section>
          <button
            className="min-h-12 text-sm text-busy"
            onClick={() =>
              void guestApi("/logout", {})
                .then(() => {
                  generation.current++;
                  clearDiningSession();
                  identity.current = null;
                  setProfile(null);
                  setWallet(null);
                  setTransactions([]);
                  setOrders([]);
                  setSelected(null);
                  setClaim("");
                  setCursor(null);
                  setOrderCursor(null);
                  onSessionChanged?.();
                })
                .catch(() => setError("Не удалось выйти. Повторите попытку."))
            }
          >
            Выйти из гостевого аккаунта
          </button>
        </>
      )}
    </div>
  );
}
