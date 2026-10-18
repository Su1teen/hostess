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
import { cartKey, changeQuantity } from "@/lib/dine-in-api";

export function XoxoBarSheet({ r, onClose }: { r: Restaurant; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null),
    tabsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState("home"),
    [accountOpen, setAccountOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const exchange = useXoxoExchange();
  const regular = useRegularMenu("xoxo");
  const history = usePriceHistory(exchange.roundKey);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
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
          tab !== "book" ? (
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
          {tab === "book" ? (
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
                browseOnly={tab === "menu"}
              />
              {tab === "market" && (
                <p className="mt-3 text-xs leading-relaxed text-ink-3">
                  Выбранные напитки добавятся к брони. Если вы уже в XOXO, отсканируйте QR вашего
                  стола для заказа из меню и биржи.
                </p>
              )}
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
