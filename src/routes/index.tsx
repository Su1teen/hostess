import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PhoneFrame } from "@/components/hostess/PhoneFrame";
import { BottomNav } from "@/components/hostess/BottomNav";
import { Splash } from "@/components/hostess/Splash";
import { MapScreen } from "@/components/hostess/screens/MapScreen";
import { CatalogScreen } from "@/components/hostess/screens/CatalogScreen";
import { AIScreen } from "@/components/hostess/screens/AIScreen";
import { CalendarScreen } from "@/components/hostess/screens/CalendarScreen";
import { ProfileScreen } from "@/components/hostess/screens/ProfileScreen";
import { RestaurantSheet, SplitBillSheet } from "@/components/hostess/RestaurantSheet";
import type { Screen } from "@/components/hostess/types";
import type { Restaurant } from "@/data/hostess";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hostess — Премиум бронирование ресторанов Астаны" },
      {
        name: "description",
        content:
          "Мобильное приложение для бронирования столиков, меню, календаря и социальных функций в лучших ресторанах Астаны.",
      },
    ],
  }),
  component: Index,
});

const transition = { type: "spring" as const, stiffness: 260, damping: 30 };

function Index() {
  const [screen, setScreen] = useState<Screen>("map");
  const [splash, setSplash] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [split, setSplit] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <PhoneFrame>
      <AnimatePresence>{splash && <Splash key="splash" />}</AnimatePresence>

      <div className="relative h-full w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition}
            className="absolute inset-0"
          >
            {screen === "map" && <MapScreen onOpenRestaurant={setRestaurant} />}
            {screen === "catalog" && <CatalogScreen onOpenRestaurant={setRestaurant} />}
            {screen === "ai" && <AIScreen />}
            {screen === "calendar" && <CalendarScreen />}
            {screen === "profile" && <ProfileScreen onSplitBill={() => setSplit(true)} />}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {restaurant && (
            <RestaurantSheet key="rest" r={restaurant} onClose={() => setRestaurant(null)} />
          )}
          {split && <SplitBillSheet key="split" onClose={() => setSplit(false)} />}
        </AnimatePresence>

        <BottomNav active={screen} onChange={setScreen} />
      </div>
    </PhoneFrame>
  );
}
