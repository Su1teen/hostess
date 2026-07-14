import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BusinessBottomNav, type BusinessScreen } from "./BusinessBottomNav";
import { BusinessDashboardScreen } from "./screens/BusinessDashboardScreen";
import { HostessFloorScreen } from "./screens/HostessFloorScreen";
import { BusinessMenuScreen } from "./screens/BusinessMenuScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

const screenOrder: BusinessScreen[] = ["dashboard", "bookings", "menu", "profile"];

export function BusinessLayout({ onLogout }: { onLogout: () => void }) {
  const [screen, setScreen] = useState<BusinessScreen>("dashboard");
  const prevScreen = useRef<BusinessScreen>("dashboard");

  const dir = screenOrder.indexOf(screen) >= screenOrder.indexOf(prevScreen.current) ? 1 : -1;
  useEffect(() => {
    prevScreen.current = screen;
  }, [screen]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-50">
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
          {screen === "dashboard" && <BusinessDashboardScreen />}
          {screen === "bookings" && <HostessFloorScreen />}
          {screen === "menu" && <BusinessMenuScreen />}
          {screen === "profile" && <ProfileScreen variant="business" onLogout={onLogout} />}
        </motion.div>
      </AnimatePresence>

      <BusinessBottomNav active={screen} onChange={setScreen} />
    </div>
  );
}
