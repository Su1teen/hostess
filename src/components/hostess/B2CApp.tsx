import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { MapScreen } from "./screens/MapScreen";
import { AIScreen } from "./screens/AIScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { RestaurantSheet } from "./RestaurantSheet";
import { PaymentSheet } from "./PaymentSheet";
import { WaitlistProvider, useWaitlist } from "./waitlist/WaitlistProvider";
import { ActiveWaitlistWidget } from "./waitlist/ActiveWaitlistWidget";
import { SpotAvailableOverlay } from "./waitlist/SpotAvailableOverlay";
import type { Screen, BookingPayload } from "./types";
import { restaurants, type Restaurant } from "@/data/hostess";

const screenOrder: Screen[] = ["map", "catalog", "ai", "calendar", "profile"];

type SheetState = "collapsed" | "half" | "full";

export function B2CApp({ onLogout }: { onLogout: () => void }) {
  const [screen, setScreen] = useState<Screen>("map");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [payment, setPayment] = useState<BookingPayload | null>(null);
  const [sheetState, setSheetState] = useState<SheetState>("collapsed");
  const prevScreen = useRef<Screen>("map");

  const dir = screenOrder.indexOf(screen) >= screenOrder.indexOf(prevScreen.current) ? 1 : -1;
  useEffect(() => {
    prevScreen.current = screen;
  }, [screen]);

  const closeAll = () => {
    setPayment(null);
    setRestaurant(null);
  };

  const handleNavChange = (s: Screen) => {
    if (s === "catalog") {
      setScreen("map");
      setSheetState("full");
    } else {
      setScreen(s);
      setSheetState("collapsed");
    }
  };

  const activeTab: Screen = sheetState === "full" && screen === "map" ? "catalog" : screen;

  return (
    <WaitlistProvider>
      <div className="relative h-full w-full overflow-hidden">
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={screen}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 64, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -64, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="absolute inset-0"
          >
            {screen === "map" && (
              <MapScreen
                onOpenRestaurant={setRestaurant}
                sheetState={sheetState}
                onSheetStateChange={setSheetState}
              />
            )}
            {screen === "ai" && <AIScreen />}
            {screen === "calendar" && <CalendarScreen onNavigateToMap={() => setScreen("map")} />}
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
        </AnimatePresence>

        <AnimatePresence>
          {restaurant && (
            <RestaurantSheet
              key="rest"
              r={restaurant}
              onClose={() => setRestaurant(null)}
              onProceed={(b) => setPayment(b)}
            />
          )}
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

        <BottomNav active={activeTab} onChange={handleNavChange} />
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
