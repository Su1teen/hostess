import { createFileRoute } from "@tanstack/react-router";
import { GuestPortal } from "@/components/hostess/GuestPortal";
import { ThemeProvider } from "@/components/hostess/ThemeProvider";
export const Route = createFileRoute("/guest")({
  head: () => ({
    meta: [{ title: "Hostess · мой кабинет" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: () => (
    <ThemeProvider>
      <main className="mx-auto min-h-dvh max-w-lg bg-canvas">
        <GuestPortal />
      </main>
    </ThemeProvider>
  ),
});
