import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { UserRound } from "lucide-react";
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
        <div className="mx-5 mt-6 rounded-[24px] bg-surface p-5">
          <p className="t-micro">Биржа напитков</p>
          <div className="mt-3 flex items-center gap-2">
            <LiveDot tone={exchange.connected ? "live" : "warn"} pulse={exchange.connected} />
            <p className="font-medium">
              {exchange.connected ? "Актуальные цены" : "Нет актуального соединения"}
            </p>
          </div>
          <p className="mt-2 text-xs text-ink-3">
            {exchange.connected
              ? "Цена меняется вместе с раундом. Перед предзаказом подтвердите серверную цену."
              : "Предзаказ временно недоступен. Последние полученные цены показаны справочно."}
          </p>
          {exchange.updatedAt && (
            <p className="mt-2 text-xs text-ink-3">
              Обновлено{" "}
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
              <h2 className="t-title">Сегодня в баре</h2>
              {!exchange.products.length && (
                <p className="mt-4 text-sm text-ink-3">Каталог появится после подключения биржи.</p>
              )}
              <div className="mt-5 space-y-3">
                {exchange.products.map((product) => {
                  const picture = r.menu
                    .flatMap((s) => s.items)
                    .find((d) => d.name.toLowerCase() === product.name.toLowerCase())?.image;
                  return (
                    <article
                      key={product.id}
                      className="rounded-[20px] bg-surface p-4 shadow-hairline"
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
                          <p className="t-num mt-1 text-lg">
                            {money(product.price)}{" "}
                            <span className="text-xs text-ink-3">
                              {product.changePercent > 0 ? "↗" : "↘"}{" "}
                              {Math.abs(product.changePercent).toFixed(1)}%
                            </span>
                          </p>
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
