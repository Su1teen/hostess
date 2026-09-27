import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { BottomNav } from "./BottomNav";
import { MapScreen } from "./screens/MapScreen";
import { AIScreen } from "./screens/AIScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { RestaurantSheet } from "./RestaurantSheet";
import { XoxoBarSheet } from "./XoxoBarSheet";
import { PaymentSheet } from "./PaymentSheet";
import { WaitlistProvider, useWaitlist } from "./waitlist/WaitlistProvider";
import { ActiveWaitlistWidget } from "./waitlist/ActiveWaitlistWidget";
import { SpotAvailableOverlay } from "./waitlist/SpotAvailableOverlay";
import type { Screen, BookingPayload, SheetState } from "./types";
import { restaurants, type Restaurant } from "@/data/hostess";

const screenOrder: Screen[] = ["map", "catalog", "ai", "calendar", "profile"];

export function B2CApp({ onLogout }: { onLogout: () => void }) {
  const [screen, setScreen] = useState<Screen>("map");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [payment, setPayment] = useState<BookingPayload | null>(null);
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const [mapOverlay, setMapOverlay] = useState(false);
  const prevScreen = useRef<Screen>("map");

  const dir = screenOrder.indexOf(screen) >= screenOrder.indexOf(prevScreen.current) ? 1 : -1;
  useEffect(() => {
    prevScreen.current = screen;
  }, [screen]);

  const closeAll = () => {
    setPayment(null);
    setRestaurant(null);
  };

  // «Места» — не отдельный экран, а раскрытая до full шторка карты.
  const handleNavChange = (s: Screen) => {
    if (s === "catalog") {
      setScreen("map");
      setSheetState("full");
    } else if (s === "map") {
      setScreen("map");
      if (screen === "map" || sheetState === "full") setSheetState("peek");
    } else {
      setScreen(s);
    }
  };

  const activeTab: Screen = sheetState === "full" && screen === "map" ? "catalog" : screen;
  const overlayOpen = Boolean(restaurant || payment || (mapOverlay && screen === "map"));

  return (
    <WaitlistProvider>
      <div className="relative h-full w-full overflow-hidden bg-canvas">
        {/* Карта живёт постоянно — не пересоздаём Mapbox при смене вкладок. */}
        <div className="absolute inset-0 z-0" aria-hidden={screen !== "map"}>
          <MapScreen
            onOpenRestaurant={setRestaurant}
            sheetState={sheetState}
            onSheetStateChange={setSheetState}
            onOpenProfile={() => setScreen("profile")}
            onOverlayChange={setMapOverlay}
          />
        </div>

        <AnimatePresence custom={dir} initial={false}>
          {screen !== "map" && (
            <motion.div
              key={screen}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d * 28, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d * -20, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.9 }}
              className="absolute inset-0 z-[5] bg-canvas"
            >
              {screen === "ai" && <AIScreen onOpenRestaurant={setRestaurant} />}
              {screen === "calendar" && (
                <CalendarScreen onNavigateToMap={() => handleNavChange("map")} />
              )}
              {screen === "profile" && (
                <ProfileScreen
                  variant="guest"
                  onLogout={onLogout}
                  onSplitBill={() =>
                    setPayment({
                      restaurant: restaurants[0],
                      table: 4,
                      day: "Сегодня",
                      time: "20:00",
                      guests: 4,
                      preorder: [],
                    })
                  }
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {restaurant && restaurant.id === "xoxo" ? (
            <XoxoBarSheet key="xoxo" r={restaurant} onClose={() => setRestaurant(null)} />
          ) : restaurant ? (
            <RestaurantSheet
              key={`rest-${restaurant.id}`}
              r={restaurant}
              onClose={() => setRestaurant(null)}
              onProceed={(b) => setPayment(b)}
            />
          ) : null}
          {payment && (
            <PaymentSheet
              key="payment"
              booking={payment}
              onClose={() => setPayment(null)}
              onDone={closeAll}
            />
          )}
        </AnimatePresence>

        <ActiveWaitlistWidget onOpen={() => setScreen("profile")} />
        <WaitlistOverlayHost />

        <BottomNav active={activeTab} onChange={handleNavChange} hidden={overlayOpen} />

        <Toaster
          position="top-center"
          offset={16}
          toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
        />
      </div>
    </WaitlistProvider>
  );
}

function WaitlistOverlayHost() {
  const { readyEntry } = useWaitlist();
  return (
    <AnimatePresence>
      {readyEntry && (
        <SpotAvailableOverlay key={readyEntry.id} entry={readyEntry} onClaim={() => {}} />
      )}
    </AnimatePresence>
  );
}
