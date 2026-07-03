import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PhoneFrame } from "@/components/hostess/PhoneFrame";
import { BottomNav } from "@/components/hostess/BottomNav";
import { Splash } from "@/components/hostess/Splash";
import { MapScreen } from "@/components/hostess/screens/MapScreen";
import { AIScreen } from "@/components/hostess/screens/AIScreen";
import { CalendarScreen } from "@/components/hostess/screens/CalendarScreen";
import { ProfileScreen } from "@/components/hostess/screens/ProfileScreen";
import { RestaurantSheet } from "@/components/hostess/RestaurantSheet";
import { PaymentSheet } from "@/components/hostess/PaymentSheet";
import type { Screen, BookingPayload } from "@/components/hostess/types";
import { restaurants, type Restaurant } from "@/data/hostess";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hostess — Городской lifestyle-хаб Астаны" },
      {
        name: "description",
        content:
          "Рестораны, концерты, красота, медицина и городские события Астаны — бронирование, предзаказ и сплит чека в одном приложении.",
      },
    ],
  }),
  component: Index,
});

// "catalog" — это не отдельный экран, а раскрытая шторка на карте.
// Но вкладка в навбаре остаётся, поэтому держим её в порядке слайдов.
const screenOrder: Screen[] = ["map", "catalog", "ai", "calendar", "profile"];

type SheetState = "collapsed" | "half" | "full";

function Index() {
  const [screen, setScreen] = useState<Screen>("map");
  const [splash, setSplash] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [payment, setPayment] = useState<BookingPayload | null>(null);
  const [sheetState, setSheetState] = useState<SheetState>("half");
  const prevScreen = useRef<Screen>("map");

  // Направление слайда: вправо/влево по порядку вкладок (как в iOS).
  const dir = screenOrder.indexOf(screen) >= screenOrder.indexOf(prevScreen.current) ? 1 : -1;
  useEffect(() => {
    prevScreen.current = screen;
  }, [screen]);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1100);
    return () => clearTimeout(t);
  }, []);

  const closeAll = () => {
    setPayment(null);
    setRestaurant(null);
  };

  // Обработчик переключения вкладок навбара.
  const handleNavChange = (s: Screen) => {
    if (s === "catalog") {
      // "Места" — не отдельный экран, а раскрытая шторка на карте.
      setScreen("map");
      setSheetState("full");
    } else {
      setScreen(s);
      // При уходе с карты — сворачиваем шторку.
      if (s !== "map") setSheetState("collapsed");
    }
  };

  // Когда шторка полностью раскрыта — подсвечиваем вкладку "Места".
  const activeTab: Screen = sheetState === "full" && screen === "map" ? "catalog" : screen;

  return (
    <PhoneFrame>
      <AnimatePresence>{splash && <Splash key="splash" />}</AnimatePresence>

      <div className="relative h-full w-full overflow-hidden">
        {/* popLayout: старый экран уезжает, новый въезжает — без белой вспышки */}
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
            {screen === "calendar" && <CalendarScreen />}
            {screen === "profile" && (
              <ProfileScreen
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

        <BottomNav active={activeTab} onChange={handleNavChange} />
      </div>
    </PhoneFrame>
  );
}
