import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { UserRound } from "lucide-react";
import { type Restaurant } from "@/data/hostess";
import { useXoxoExchange } from "@/hooks/useXoxoExchange";
import { VenueDetailShell } from "./VenueDetail";
import { BottomSheet, Button, IconButton, Tabs } from "./system";
import { GuestBooking } from "./GuestBooking";
import { GuestPortal } from "./GuestPortal";
import { DiningCatalog, DiningGateways, type CatalogProduct } from "./DiningCatalog";
import { usePriceHistory, useRegularMenu } from "@/hooks/useDiningCatalog";
import { cartKey, changeQuantity, diningApi, type DiningTable } from "@/lib/dine-in-api";
import { guestApi } from "@/lib/guest-api";
import { DiningPage } from "./DiningPage";
import { WebTablePicker } from "./WebTablePicker";

export function XoxoBarSheet({ r, onClose }: { r: Restaurant; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null),
    tabsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState("home"),
    [accountOpen, setAccountOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [code, setCode] = useState(""),
    [codeError, setCodeError] = useState(""),
    [claiming, setClaiming] = useState(false);
  const [dining, setDining] = useState<{ token: string; context: DiningTable } | null>(null);
  const claimLock = useRef(false);
  const exchange = useXoxoExchange();
  const regular = useRegularMenu("xoxo");
  const history = usePriceHistory(exchange.roundKey);
  const [now, setNow] = useState(Date.now());
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    setInteractive(true);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);
  const marketProducts: CatalogProduct[] = exchange.products.map((p) => ({ ...p, key: p.id }));
  const regularProducts: CatalogProduct[] = (regular.menu?.items ?? []).map((p) => ({
    ...p,
    key: cartKey(p.id, "REGULAR_MENU"),
  }));
  const items = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([key, quantity]) => ({
      productId: key.startsWith("menu:") ? key.slice(5) : key,
      quantity,
      itemType: key.startsWith("menu:") ? ("REGULAR_MENU" as const) : ("EXCHANGE" as const),
    }));
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
          tab !== "book" ? (
            <div className="grid grid-cols-2 gap-2">
              <Button block size="lg" disabled={!interactive} onClick={() => goTab("book")}>
                Забронировать
              </Button>
              <Button
                block
                variant="secondary"
                size="lg"
                disabled={!interactive}
                onClick={() => goTab("order")}
              >
                Я уже в XOXO
              </Button>
            </div>
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

        <div ref={tabsRef} className="sticky top-[calc(var(--sat)+58px)] z-10 mt-7 bg-canvas pt-2">
          <Tabs
            id="xoxo"
            value={tab === "book" ? "book" : "home"}
            onChange={goTab}
            tabs={[
              { key: "home", label: "Меню и биржа" },
              { key: "book", label: "Бронирование" },
            ]}
          />
        </div>
        <div className="px-5 py-6">
          {tab === "order" ? (
            <div className="space-y-4">
              <WebTablePicker onSelect={setDining} />
              <details className="rounded-2xl border border-line p-4">
                <summary className="cursor-pointer text-sm font-medium">
                  У меня есть код сотрудника
                </summary>
                <form
                  className="space-y-4 rounded-3xl border border-line p-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (claimLock.current) return;
                    claimLock.current = true;
                    setClaiming(true);
                    setCodeError("");
                    try {
                      const result = await guestApi<{ accessToken: string }>(
                        "/dine-in/access/claim",
                        {
                          code: code.replace(/\s/g, "").toUpperCase(),
                        },
                      );
                      const context = await diningApi.table(result.accessToken);
                      setDining({ token: result.accessToken, context });
                    } catch (error) {
                      setCodeError((error as Error).message);
                    } finally {
                      claimLock.current = false;
                      setClaiming(false);
                    }
                  }}
                >
                  <h2 className="t-title">Войти по коду стола</h2>
                  <p className="text-sm leading-relaxed text-ink-2">
                    Дополнительный способ открыть подтверждённый визит. Код действует 10 минут.
                  </p>
                  <label className="block text-sm">
                    Код от сотрудника
                    <input
                      autoComplete="off"
                      autoCapitalize="characters"
                      required
                      minLength={10}
                      maxLength={10}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 font-mono tracking-widest"
                    />
                  </label>
                  {codeError && (
                    <p role="alert" className="text-sm text-red-700">
                      {codeError}
                    </p>
                  )}
                  <Button type="submit" block size="lg" disabled={claiming}>
                    {claiming ? "Проверяем стол…" : "Подтвердить стол и открыть заказ"}
                  </Button>
                  <p className="text-xs text-ink-3">
                    Выбранные позиции сохранятся. До отправки вы проверите актуальную сумму.
                  </p>
                </form>
              </details>
            </div>
          ) : tab === "book" ? (
            <GuestBooking items={items} />
          ) : tab === "home" ? (
            <DiningGateways
              onSelect={goTab}
              productCount={marketProducts.length}
              connected={exchange.connected}
              menuCount={regularProducts.length}
              menuImage={regularProducts.find((p) => p.imageUrl)?.imageUrl}
            />
          ) : (
            <>
              <DiningCatalog
                key={tab}
                section={tab === "market" ? "market" : "menu"}
                products={tab === "market" ? marketProducts : regularProducts}
                loading={tab === "market" ? exchange.loading : regular.loading}
                connected={tab === "market" ? exchange.connected : regular.available}
                cart={quantities}
                onUpdate={(id, delta) => setQuantities((prev) => changeQuantity(prev, id, delta))}
                onBack={() => goTab("home")}
                roundEndsAt={exchange.endsAt}
                roundLabel={exchange.roundKey}
                history={history}
                now={now}
              />
              {tab === "market" && (
                <p className="mt-3 text-xs leading-relaxed text-ink-3">
                  Выбранные напитки можно добавить к брони. Для заказа сейчас выберите свой стол в
                  «Я уже в XOXO» или отсканируйте QR.
                </p>
              )}
            </>
          )}
        </div>
      </VenueDetailShell>
      <AnimatePresence>
        {dining && (
          <BottomSheet onClose={() => setDining(null)} z="z-[160]" maxHeight="100%">
            <DiningPage
              key={dining.token}
              venue={dining.context.venue.slug}
              table={dining.context.table.code}
              token={dining.token}
              initialCart={quantities}
            />
          </BottomSheet>
        )}
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
