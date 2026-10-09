import { createFileRoute } from "@tanstack/react-router";
import { restaurants } from "@/data/hostess";
import { PhoneFrame } from "@/components/hostess/PhoneFrame";
import { ThemeProvider } from "@/components/hostess/ThemeProvider";
import { XoxoBarSheet } from "@/components/hostess/XoxoBarSheet";
export const Route = createFileRoute("/xoxo")({
  head: () => ({ meta: [{ title: "XOXO · бар и бронирование" }] }),
  component: () => {
    const venue = restaurants.find((r) => r.id === "xoxo");
    return venue ? (
      <PhoneFrame>
        <ThemeProvider>
          <XoxoBarSheet r={venue} onClose={() => location.assign("/")} />
        </ThemeProvider>
      </PhoneFrame>
    ) : (
      <p>Заведение недоступно</p>
    );
  },
});
