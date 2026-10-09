import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Radio, UserRound, Wine } from "lucide-react";
import { type Restaurant, money } from "@/data/hostess";
import { useXoxoExchange } from "@/hooks/useXoxoExchange";
import { VenueDetailShell } from "./VenueDetail";
import { BottomSheet, Button, IconButton, LiveDot, Tabs } from "./system";
import { GuestBooking } from "./GuestBooking";
import { GuestPortal } from "./GuestPortal";

export function XoxoBarSheet({ r, onClose }: { r: Restaurant; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null),
    tabsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState("menu"),
    [accountOpen, setAccountOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const exchange = useXoxoExchange();
  const items = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));
  const goTab = (value: string) => {
    setTab(value);
    if (tabsRef.current && scrollRef.current)
      scrollRef.current.scrollTo({
        top: tabsRef.current.offsetTop - 60,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
  };
  return (
    <>
      <VenueDetailShell
        name={r.name}
        images={r.gallery}
        onClose={onClose}
        scrollRef={scrollRef}
        heroShade="mood"
        topRight={
          <IconButton
            icon={UserRound}
            label="Мой кабинет"
            variant="photo"
            onClick={() => setAccountOpen(true)}
          />
        }
        heroOverlay={
          <div className="px-5 text-white">
            <p className="text-[11px] uppercase tracking-[.16em] text-white/70">
              Sports · Lounge · Nightlife
            </p>
            <h1 className="t-display mt-2">{r.name}</h1>
          </div>
        }
        dock={
          tab === "menu" ? (
            <Button block size="lg" onClick={() => goTab("book")}>
              {items.length ? `К брони · ${items.length} поз.` : "Выбрать стол"}
            </Button>
          ) : (
            <Button block variant="secondary" size="lg" onClick={() => setAccountOpen(true)}>
              Мой кабинет
            </Button>
          )
        }
      >
        <div className="px-5">
          <p className="t-caption">{r.address}</p>
          <p className="t-body mt-3 text-ink-2">{r.description}</p>
        </div>
        <div className="relative mx-5 mt-6 overflow-hidden rounded-[26px] border border-amber-200/15 bg-[#111713] p-5 text-white shadow-[0_18px_50px_-24px_rgba(7,17,11,.8)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full border border-amber-200/10 bg-[radial-gradient(circle,rgba(189,151,86,.16),transparent_68%)]"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-amber-100/65">
                <Wine size={13} strokeWidth={1.7} /> Биржа напитков
              </p>
              <h2 className="t-title mt-2 text-white">Бар в движении</h2>
            </div>
            <div
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] ${
                exchange.connected
                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                  : "border-amber-200/20 bg-amber-100/10 text-amber-100"
              }`}
            >
              <LiveDot tone={exchange.connected ? "live" : "warn"} pulse={exchange.connected} />
              {exchange.connected ? "Торги идут" : "Связь"}
            </div>
          </div>
          <div className="relative mt-5 flex items-end justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-xs text-white/55">
                {exchange.connected
                  ? `${exchange.products.length} позиций · цены обновляются автоматически`
                  : "Последние цены будут показаны справочно"}
              </p>
              <p className="mt-1.5 text-sm text-white/85">
                {exchange.connected
                  ? "Выберите напиток — цену подтвердим при оформлении"
                  : "Предзаказ станет доступен после восстановления связи"}
              </p>
            </div>
            <Radio
              aria-hidden="true"
              size={18}
              className={
                exchange.connected
                  ? "mb-1 shrink-0 text-emerald-200"
                  : "mb-1 shrink-0 text-amber-100/60"
              }
            />
          </div>
          {exchange.updatedAt && (
            <p className="relative mt-3 text-[10px] tracking-wide text-white/40">
              Снимок рынка ·{" "}
              {new Intl.DateTimeFormat("ru-RU", {
                timeZone: "Asia/Almaty",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(exchange.updatedAt))}
            </p>
          )}
        </div>
        <div ref={tabsRef} className="sticky top-[calc(var(--sat)+58px)] z-10 mt-7 bg-canvas pt-2">
          <Tabs
            id="xoxo"
            value={tab}
            onChange={goTab}
            tabs={[
              { key: "menu", label: "Биржа и бар" },
              { key: "book", label: "Бронирование" },
            ]}
          />
        </div>
        <div className="px-5 py-6">
          {tab === "book" ? (
            <GuestBooking items={items} />
          ) : (
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="t-micro">XOXO · LIVE MARKET</p>
                  <h2 className="t-title mt-1">Сегодня в баре</h2>
                </div>
                {exchange.connected && exchange.products.length > 0 && (
                  <span className="pb-1 text-[10px] uppercase tracking-[.16em] text-ink-3">
                    {exchange.products.length} лотов
                  </span>
                )}
              </div>
              {!exchange.products.length && (
                <p className="mt-4 text-sm text-ink-3">
                  {exchange.connected
                    ? "В этом раунде пока нет доступных напитков."
                    : "Каталог появится после подключения биржи."}
                </p>
              )}
              <div className="mt-5 space-y-3">
                {exchange.products.map((product) => {
                  const picture = r.menu
                    .flatMap((s) => s.items)
                    .find((d) => d.name.toLowerCase() === product.name.toLowerCase())?.image;
                  return (
                    <article
                      key={product.id}
                      className="rounded-[20px] border border-line/70 bg-surface p-4 shadow-hairline transition-colors hover:border-amber-300/50"
                    >
                      <div className="flex gap-3">
                        {picture && (
                          <img
                            src={picture}
                            alt=""
                            loading="lazy"
                            className="h-16 w-16 rounded-xl object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[15px] font-medium">{product.name}</h3>
                          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <p className="t-num text-lg">{money(product.price)}</p>
                            <span
                              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                                product.changePercent > 0
                                  ? "text-emerald-700"
                                  : product.changePercent < 0
                                    ? "text-rose-700"
                                    : "text-ink-3"
                              }`}
                            >
                              {product.changePercent > 0 ? (
                                <ArrowUpRight size={13} />
                              ) : product.changePercent < 0 ? (
                                <ArrowDownRight size={13} />
                              ) : null}
                              {product.changePercent > 0 ? "+" : ""}
                              {product.changePercent.toFixed(1)}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-ink-3">
                            Минимум {money(product.minPrice)} · меню {money(product.originalPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-ink-3">Предзаказ к столу</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Убрать ${product.name}`}
                            disabled={!quantities[product.id]}
                            className="h-11 w-11 rounded-full bg-canvas disabled:opacity-30"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [product.id]: Math.max(0, (prev[product.id] ?? 0) - 1),
                              }))
                            }
                          >
                            −
                          </button>
                          <span className="t-num min-w-6 text-center">
                            {quantities[product.id] ?? 0}
                          </span>
                          <button
                            type="button"
                            aria-label={`Добавить ${product.name}`}
                            disabled={!exchange.connected || (quantities[product.id] ?? 0) >= 20}
                            className="h-11 w-11 rounded-full bg-canvas disabled:opacity-30"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [product.id]: (prev[product.id] ?? 0) + 1,
                              }))
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </VenueDetailShell>
      <AnimatePresence>
        {accountOpen && (
          <BottomSheet
            onClose={() => setAccountOpen(false)}
            z="z-[150]"
            maxHeight="90%"
            header={
              <div className="px-5 pb-4 pt-8">
                <p className="t-micro">XOXO · мой кабинет</p>
              </div>
            }
          >
            <GuestPortal />
          </BottomSheet>
        )}
      </AnimatePresence>
    </>
  );
}
