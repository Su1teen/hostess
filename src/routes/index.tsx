import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PhoneFrame } from "@/components/hostess/PhoneFrame";
import { Splash } from "@/components/hostess/Splash";
import { ThemeProvider } from "@/components/hostess/ThemeProvider";
import { AuthScreen } from "@/components/hostess/screens/AuthScreen";
import { B2CApp } from "@/components/hostess/B2CApp";
import { BusinessLayout } from "@/components/hostess/BusinessLayout";
import { useAuth } from "@/components/hostess/AuthContext";

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

function Index() {
  const { role, login, logout } = useAuth();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <PhoneFrame>
      <AnimatePresence mode="wait" initial={false}>
        {splash && role !== null && <Splash key="splash" />}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {role === null && <AuthScreen key="auth" onLogin={login} />}
        {role === "guest" && (
          <motion.div
            key="guest"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute inset-0"
          >
            <ThemeProvider>
              <B2CApp onLogout={logout} />
            </ThemeProvider>
          </motion.div>
        )}
        {role === "business" && (
          <motion.div
            key="business"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute inset-0"
          >
            <ThemeProvider>
              <BusinessLayout onLogout={logout} />
            </ThemeProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </PhoneFrame>
  );
}
