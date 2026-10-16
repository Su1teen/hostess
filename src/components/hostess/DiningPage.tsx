import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  diningApi,
  matchesTable,
  menuFresh,
  quoteFresh,
  changeQuantity,
  kzt,
  needsRequote,
  quoteSchema,
  type Cart,
  type DiningMenu,
  type DiningQuote,
  type DiningOrder,
  type DiningProfile,
  type DiningTable,
  type Wallet,
} from "@/lib/dine-in-api";
import { GuestApiError } from "@/lib/guest-api";
import { clearDiningSession, diningSessionChanged } from "@/lib/dining-session";
import { DiningAccount, DiningReceipt, GuestIdentity } from "./DiningAccount";

type Attempt = { quote: DiningQuote; key: string };
const actionClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40";
export function DiningPage({
  venue,
  table,
  token,
}: {
  venue: string;
  table: string;
  token: string;
}) {
  const storageKey = `hostess:dining:${venue}:${table}:${token}`;
  const [context, setContext] = useState<DiningTable | null>(null),
    [menu, setMenu] = useState<DiningMenu | null>(null);
  const [cart, setCart] = useState<Cart>({}),
    [ready, setReady] = useState(false),
    [now, setNow] = useState(Date.now());
  const [quote, setQuote] = useState<DiningQuote | null>(null),
    [order, setOrder] = useState<DiningOrder | null>(null);
  const [profile, setProfile] = useState<DiningProfile | null>(null),
    [wallet, setWallet] = useState<Wallet | null>(null);
  const [sessionKnown, setSessionKnown] = useState(false),
    [redeem, setRedeem] = useState(0);
  const [cartOpen, setCartOpen] = useState(false),
    [accountOpen, setAccountOpen] = useState(false),
    [identityOpen, setIdentityOpen] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [tableError, setTableError] = useState("");
  const [category, setCategory] = useState("Все"),
    [uncertain, setUncertain] = useState(false);
  const attempt = useRef<Attempt | null>(null),
    lock = useRef(false),
    identityEpoch = useRef(0),
    sessionGeneration = useRef(0),
    sessionIdentity = useRef<string | undefined>(undefined);
  const fresh = menuFresh(menu, now),
    validQuote = quoteFresh(quote, menu, now);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const persist = useCallback(
    (next: Cart, pending: Attempt | null, receipt?: { id: string; token?: string }) => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ cart: next, pending, receipt }));
      } catch {
        /* In-memory retry still uses the same key. */
      }
    },
    [storageKey],
  );

  const refreshSession = useCallback(async () => {
    const current = ++sessionGeneration.current;
    try {
      const p = await diningApi.profile();
      if (current !== sessionGeneration.current) return;
      const identity = p.guest.id;
      if (sessionIdentity.current !== undefined && sessionIdentity.current !== identity)
        clearDiningSession();
      if (sessionIdentity.current !== identity && !attempt.current) {
        setWallet(null);
        setQuote(null);
        setRedeem(0);
      }
      sessionIdentity.current = identity;
      setProfile(p);
      setSessionKnown(true);
      try {
        const w = await diningApi.wallet();
        if (current === sessionGeneration.current) setWallet(w);
      } catch {
        if (current === sessionGeneration.current) setWallet(null);
      }
    } catch (e) {
      if (current !== sessionGeneration.current) return;
      if (
        e instanceof GuestApiError &&
        e.status === 401 &&
        sessionIdentity.current &&
        sessionIdentity.current !== "anonymous"
      )
        clearDiningSession();
      setProfile(null);
      setWallet(null);
      setRedeem(0);
      setSessionKnown(e instanceof GuestApiError && e.status === 401);
      if (sessionIdentity.current !== "anonymous" && !attempt.current) setQuote(null);
      sessionIdentity.current = "anonymous";
    }
  }, []);

  useEffect(() => {
    const clear = () => {
      identityEpoch.current++;
      setOrder(null);
      setQuote(null);
      setWallet(null);
      setProfile(null);
      setSessionKnown(false);
      setRedeem(0);
      attempt.current = null;
      setUncertain(false);
    };
    window.addEventListener(diningSessionChanged, clear);
    return () => window.removeEventListener(diningSessionChanged, clear);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
      if (
        saved?.cart &&
        Object.entries(saved.cart).every(
          ([id, n]) =>
            id.length > 0 && typeof n === "number" && Number.isInteger(n) && n > 0 && n <= 20,
        )
      )
        setCart(saved.cart);
      const restored = quoteSchema.safeParse(saved?.pending?.quote);
      if (
        restored.success &&
        typeof saved.pending.key === "string" &&
        /^[a-f0-9-]{36}$/.test(saved.pending.key)
      ) {
        attempt.current = { quote: restored.data, key: saved.pending.key };
        setQuote(restored.data);
        setUncertain(true);
        setCartOpen(true);
      }
      if (typeof saved?.receipt?.id === "string") {
        const epoch = identityEpoch.current;
        void diningApi
          .receipt(saved.receipt.id, saved.receipt.token)
          .then((r) => {
            if (
              active &&
              epoch === identityEpoch.current &&
              r.order.venueCode === venue &&
              r.order.tableCode === table
            )
              setOrder(r.order);
          })
          .catch(() => {});
      }
    } catch {
      /* Missing/invalid drafts never become authoritative prices or receipts. */
    }
    setReady(true);
    try {
      sessionStorage.setItem(
        "hostess:dining:return",
        `/v/${encodeURIComponent(venue)}/t/${encodeURIComponent(table)}/${encodeURIComponent(token)}`,
      );
    } catch {
      /* Optional return hint. */
    }
    const load = async () => {
      try {
        const c = await diningApi.table(token, controller.signal);
        if (!matchesTable(c, venue, table))
          throw new Error("QR не соответствует этому столу. Отсканируйте код ещё раз.");
        if (active) {
          setContext(c);
          setTableError("");
        }
      } catch (e) {
        if (active && !controller.signal.aborted) {
          setContext(null);
          setTableError(
            e instanceof GuestApiError && e.status >= 500
              ? "Сервис временно недоступен. Попробуйте позже."
              : "QR недействителен или отключён. Попросите официанта проверить код.",
          );
        }
      }
    };
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [storageKey, table, token, venue]);

  useEffect(() => {
    if (!context) return;
    let active = true,
      controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort();
      const currentController = new AbortController();
      controller = currentController;
      try {
        const m = await diningApi.menu(venue, currentController.signal);
        if (active && !currentController.signal.aborted) setMenu(m);
      } catch {
        if (active && !currentController.signal.aborted)
          setMenu((previous) => (previous ? { ...previous, status: "no_published_round" } : null));
      }
    };
    void refresh();
    void refreshSession();
    const interval = window.setInterval(() => {
      if (!document.hidden) {
        void refresh();
        void refreshSession();
      }
    }, 20000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const focus = () => {
      if (document.hidden) return;
      void refresh();
      void refreshSession();
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      active = false;
      sessionGeneration.current++;
      controller?.abort();
      clearInterval(interval);
      clearInterval(tick);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [context, refreshSession, venue]);

  function update(id: string, delta: number) {
    if (lock.current || attempt.current) return;
    const next = changeQuantity(cart, id, delta);
    setCart(next);
    setQuote(null);
    setError("");
    persist(next, null);
  }
  async function requestQuote() {
    if (lock.current || attempt.current || !context || !fresh || !count || !sessionKnown) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setQuote(null);
    const epoch = identityEpoch.current;
    try {
      const q = await diningApi.quote(token, cart, profile ? redeem : 0);
      if (epoch !== identityEpoch.current) return;
      setQuote(q);
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось зафиксировать сумму");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function submit() {
    if (lock.current || !context) return;
    // Once a request might have committed, retry the exact request even past expiry.
    // Only an authoritative REQUOTE can release this pending attempt.
    if (!attempt.current && (!quote || !quoteFresh(quote, menu))) {
      setQuote(null);
      setError("Цена обновилась — проверьте новую сумму");
      return;
    }
    if (!attempt.current) attempt.current = { quote: quote!, key: crypto.randomUUID() };
    const current = attempt.current;
    const epoch = identityEpoch.current;
    persist(cart, current);
    lock.current = true;
    setBusy(true);
    setUncertain(true);
    setError("");
    try {
      const r = await diningApi.order(current.quote, current.key);
      if (epoch !== identityEpoch.current) return;
      if (r.order.venueCode !== venue || r.order.tableCode !== table)
        throw new Error("Не удалось проверить стол в ответе. Повторите проверку заказа.");
      setOrder(r.order);
      setCart({});
      setQuote(null);
      setUncertain(false);
      attempt.current = null;
      persist({}, null, { id: r.order.id, token: r.order.receiptToken });
      await refreshSession();
    } catch (e) {
      if (epoch !== identityEpoch.current) return;
      if (needsRequote(e)) {
        attempt.current = null;
        setUncertain(false);
        setQuote(null);
        persist(cart, null);
        setError(
          "Цена или бонусный баланс обновились — проверьте новую сумму и подтвердите её ещё раз.",
        );
      } else
        setError(
          "Ответ не получен. Заказ мог быть принят. Нажмите «Проверить заказ»: повтор безопасен и использует тот же номер запроса.",
        );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  if (tableError)
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-5 bg-canvas p-6">
        <p className="t-micro">HOSTESS · XOXO</p>
        <h1 className="t-title">Не удалось открыть стол</h1>
        <p role="alert" className="text-sm leading-relaxed text-ink-2">
          {tableError}
        </p>
        <button className={actionClass} onClick={() => window.location.reload()}>
          Повторить
        </button>
      </main>
    );
  if (!context || !ready)
    return (
      <main className="mx-auto min-h-dvh max-w-lg p-5">
        <p role="status" className="py-6 text-sm">
          Проверяем QR стола…
        </p>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="mb-4 h-36 animate-pulse rounded-[24px] bg-stone motion-reduce:animate-none"
          />
        ))}
      </main>
    );
  const categories = [
    "Все",
    ...new Set(menu?.products.map((p) => p.category).filter((c): c is string => Boolean(c))),
  ];
  const products =
    menu?.products.filter((p) => category === "Все" || p.category === category) ?? [];
  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg overflow-x-clip bg-canvas pb-[calc(120px+env(safe-area-inset-bottom))] text-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-canvas/95 px-5 pb-4 pt-[calc(16px+env(safe-area-inset-top))] backdrop-blur-xl">
        <div>
          <p className="text-xs font-semibold tracking-[0.28em]">HOSTESS</p>
          <p className="mt-1 text-xs text-ink-2">QR · Заказ за столом</p>
        </div>
        <button
          disabled={busy || uncertain}
          className="grid size-12 place-items-center rounded-full bg-stone disabled:opacity-40"
          aria-label="Мой кабинет"
          onClick={() => setAccountOpen(true)}
        >
          <UserRound size={20} />
        </button>
      </header>
      <section className="px-5 pb-6 pt-7">
        <div className="flex items-center justify-between">
          <p className="t-micro">BAR & LIVE MARKET</p>
          <span className={`flex items-center gap-2 text-xs ${fresh ? "text-live" : "text-ink-2"}`}>
            <span className={`size-1.5 rounded-full ${fresh ? "bg-live" : "bg-ink-3"}`} />
            {fresh ? "Биржа открыта" : "Цены обновляются"}
          </span>
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.06em]">{context.venue.name}</h1>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-stone px-4 py-3">
          <p className="text-sm font-medium">Стол №{context.table.code}</p>
          <p className="max-w-[55%] text-right text-xs text-ink-2">
            {context.table.zoneName ?? "Ваш вечер начинается здесь"}
          </p>
        </div>
        <p className="mt-2 break-words text-sm text-ink-2">{context.table.name}</p>
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-2">
          Выбирайте напитки по биржевой цене. Мы зафиксируем сумму перед заказом.
        </p>
      </section>
      {!fresh && (
        <div
          className="mx-5 mb-5 rounded-2xl border border-line p-4 text-sm text-ink-2"
          role="status"
        >
          Биржа временно недоступна или раунд завершён. Меню доступно для просмотра, оформление
          возобновится после обновления цен.
        </div>
      )}
      {categories.length > 1 && (
        <nav
          aria-label="Категории меню"
          className="no-scrollbar mb-4 flex gap-2 overflow-x-auto px-5"
        >
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${category === c ? "bg-ink text-white" : "bg-stone"}`}
            >
              {c}
            </button>
          ))}
        </nav>
      )}
      <section aria-label="Биржевое меню" className="space-y-3 px-5">
        {!menu ? (
          <p role="status" className="py-8 text-sm text-ink-2">
            Ждём доступный каталог…
          </p>
        ) : !products.length ? (
          <p className="py-8 text-sm text-ink-2">В этой категории пока нет напитков.</p>
        ) : (
          products.map((p) => (
            <article key={p.id} className="rounded-[24px] border border-line p-4">
              <div className="flex gap-4">
                {p.imageUrl && /^https:\/\//.test(p.imageUrl) && (
                  <img
                    src={p.imageUrl}
                    referrerPolicy="no-referrer"
                    alt=""
                    loading="lazy"
                    className="size-20 shrink-0 rounded-2xl bg-stone object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-ink-2">
                    {p.category ?? "XOXO MARKET"}
                  </p>
                  <h2 className="mt-1 break-words text-base font-medium">{p.name}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold tracking-tight">{kzt(p.price)}</p>
                    {typeof p.changePercent === "number" && (
                      <span
                        className={`inline-flex items-center text-xs ${p.changePercent > 0 ? "text-busy" : "text-live"}`}
                      >
                        {p.changePercent > 0 ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownRight size={14} />
                        )}
                        {Math.abs(p.changePercent)}%
                      </span>
                    )}
                    {p.originalPrice !== undefined && p.originalPrice !== p.price && (
                      <span className="text-xs text-ink-3 line-through">
                        {kzt(p.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs text-ink-2">
                  {!p.isAvailable ? "Временно недоступен" : "Цена текущего раунда"}
                </span>
                <Quantity
                  name={p.name}
                  value={cart[p.id] ?? 0}
                  disabled={busy || uncertain || !fresh || !p.isAvailable}
                  onChange={(delta) => update(p.id, delta)}
                />
              </div>
            </article>
          ))
        )}
      </section>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t border-line bg-canvas/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
        <button
          className={`${actionClass} w-full justify-between`}
          disabled={!count && !order}
          onClick={() => setCartOpen(true)}
        >
          <span className="flex items-center gap-3">
            <ShoppingBag size={18} />
            {order && !count ? "Мой заказ" : `Корзина · ${count}`}
          </span>
          <span>
            {quote
              ? kzt(quote.payable)
              : order && !count
                ? `#${order.orderNumber}`
                : "Проверить сумму →"}
          </span>
        </button>
      </div>
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-h-[92dvh] w-[calc(100%-24px)] max-w-lg overflow-y-auto rounded-[28px] border-line bg-canvas p-5">
          <DialogHeader>
            <DialogTitle>Стол №{context.table.code} · XOXO</DialogTitle>
            <DialogDescription>
              {order && !count ? "Ваш заказ" : "Цена фиксируется сервером перед подтверждением"}
            </DialogDescription>
          </DialogHeader>
          {order && !count ? (
            <>
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-live-soft text-live">
                <Check />
              </div>
              <DiningReceipt order={order} />
              <button
                className={actionClass}
                onClick={() => {
                  setCartOpen(false);
                  setOrder(null);
                  persist({}, null);
                }}
              >
                Заказать ещё
              </button>
              <button
                className="min-h-11 text-sm"
                onClick={() => {
                  setCartOpen(false);
                  setAccountOpen(true);
                }}
              >
                Мои заказы и бонусы
              </button>
            </>
          ) : (
            <>
              {!count && <p className="py-8 text-sm text-ink-2">Добавьте напитки из меню</p>}
              {Object.entries(cart).map(([id, quantity]) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 border-b border-line py-3"
                >
                  <p className="min-w-0 break-words text-sm">
                    {menu?.products.find((p) => p.id === id)?.name ??
                      quote?.lines.find((l) => l.productId === id)?.productName ??
                      "Товар недоступен"}
                  </p>
                  <Quantity
                    name={menu?.products.find((p) => p.id === id)?.name ?? "товар"}
                    value={quantity}
                    disabled={busy || uncertain}
                    onChange={(delta) => update(id, delta)}
                  />
                </div>
              ))}
              {!sessionKnown && (
                <p className="rounded-xl bg-stone p-3 text-sm" role="status">
                  Не удалось проверить гостевую сессию.
                  <button
                    className="block min-h-11 underline"
                    onClick={() => void refreshSession()}
                  >
                    Повторить
                  </button>
                </p>
              )}
              {profile ? (
                <div className="space-y-3 rounded-2xl bg-stone p-4">
                  <p className="text-sm">
                    {profile.guest.name} ·{" "}
                    {profile.guest.provisional ? "Новый профиль" : "Подтверждённый гость"}
                  </p>
                  <p className="text-xs text-ink-2">
                    {wallet ? `${wallet.balance} бонусов доступно` : "Кошелёк временно недоступен"}
                  </p>
                  <label className="block text-sm">
                    Списать бонусы
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={wallet?.balance ?? 0}
                      step={1}
                      value={redeem}
                      disabled={!wallet || busy || uncertain}
                      onChange={(e) => {
                        setRedeem(
                          Math.max(
                            0,
                            Math.min(wallet?.balance ?? 0, Math.floor(Number(e.target.value) || 0)),
                          ),
                        );
                        setQuote(null);
                      }}
                      className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-3"
                    />
                  </label>
                </div>
              ) : (
                sessionKnown && (
                  <div className="rounded-2xl bg-stone p-4">
                    <p className="text-sm">Можно заказать без регистрации</p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-2">
                      Бонусы начисляются только гостю с серверной сессией.
                    </p>
                    <button
                      disabled={busy || uncertain}
                      className="mt-2 min-h-11 text-sm underline disabled:opacity-40"
                      onClick={() => setIdentityOpen((v) => !v)}
                    >
                      Создать гостевой профиль
                    </button>
                  </div>
                )
              )}
              {identityOpen && !profile && (
                <GuestIdentity
                  disabled={busy || uncertain}
                  onChanged={() => {
                    setIdentityOpen(false);
                    void refreshSession();
                  }}
                />
              )}
              {quote && (
                <div className="space-y-3 rounded-2xl border border-line p-4">
                  <p className="text-xs text-ink-2">
                    Цены зафиксированы
                    {validQuote
                      ? ` · ${Math.max(0, Math.ceil((Date.parse(quote.expiresAt) - now) / 1000))} сек.`
                      : " · срок истёк"}
                  </p>
                  {quote.lines.map((l) => (
                    <p key={l.productId} className="flex justify-between gap-3 text-sm">
                      <span>
                        {l.productName} · {l.quantity} × {kzt(l.unitPrice)}
                      </span>
                      <span className="shrink-0">{kzt(l.total)}</span>
                    </p>
                  ))}
                  <div className="flex justify-between border-t border-line pt-3 text-sm">
                    <span>До бонусов</span>
                    <span>{kzt(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Списание бонусов</span>
                    <span>−{quote.discount}</span>
                  </div>
                  <div className="flex justify-between gap-2 font-semibold">
                    <span>К оплате официанту</span>
                    <span className="shrink-0">{kzt(quote.payable)}</span>
                  </div>
                  {profile && (
                    <p className="text-xs text-brass">
                      Начислим {quote.cashback} бонусов · отдельная партия на 14 суток
                    </p>
                  )}
                </div>
              )}
              {quote && !validQuote && !uncertain && (
                <p role="status" className="text-sm text-busy">
                  Цена обновилась — проверьте новую сумму
                </p>
              )}
              {error && (
                <p role="alert" className="text-sm leading-relaxed text-busy">
                  {error}
                </p>
              )}
              {uncertain ? (
                <button disabled={busy} className={actionClass} onClick={() => void submit()}>
                  <RefreshCw size={16} />
                  {busy ? "Проверяем…" : "Проверить заказ"}
                </button>
              ) : quote && validQuote ? (
                <button
                  disabled={busy || !sessionKnown}
                  className={actionClass}
                  onClick={() => void submit()}
                >
                  {busy ? "Отправляем…" : `Заказать · ${kzt(quote.payable)}`}
                </button>
              ) : (
                <button
                  disabled={busy || !fresh || !count || !sessionKnown}
                  className={actionClass}
                  onClick={() => void requestQuote()}
                >
                  {busy ? "Фиксируем цены…" : "Проверить сумму"}
                </button>
              )}
              <p className="text-center text-xs leading-relaxed text-ink-2">
                Оплата официанту через терминал. Онлайн-списания денег нет.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={accountOpen}
        onOpenChange={(open) => {
          setAccountOpen(open);
          if (!open) void refreshSession();
        }}
      >
        <DialogContent className="max-h-[92dvh] w-[calc(100%-24px)] max-w-lg overflow-y-auto rounded-[28px] border-line bg-canvas p-5">
          <DialogHeader>
            <DialogTitle>Гостевой аккаунт</DialogTitle>
            <DialogDescription>Заказы и бонусы XOXO</DialogDescription>
          </DialogHeader>
          <DiningAccount onSessionChanged={() => void refreshSession()} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Quantity({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string;
  value: number;
  disabled: boolean;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center rounded-xl bg-stone">
      <button
        aria-label={`Убрать ${name}`}
        disabled={disabled || !value}
        onClick={() => onChange(-1)}
        className="grid size-11 place-items-center disabled:opacity-30"
      >
        <Minus size={16} />
      </button>
      <span aria-live="polite" className="min-w-5 text-center text-sm tabular-nums">
        {value}
      </span>
      <button
        aria-label={`Добавить ${name}`}
        disabled={disabled || value >= 20}
        onClick={() => onChange(1)}
        className="grid size-11 place-items-center disabled:opacity-30"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
