import { createFileRoute } from "@tanstack/react-router";
import { DiningPage } from "@/components/hostess/DiningPage";
import { ThemeProvider } from "@/components/hostess/ThemeProvider";

export const Route = createFileRoute("/v/$venue/t/$table/$token")({
  head: () => ({
    meta: [
      { title: "XOXO · Заказ за столом | Hostess" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: DiningRoute,
});
function DiningRoute() {
  const params = Route.useParams();
  return (
    <ThemeProvider>
      <DiningPage key={`${params.venue}/${params.table}/${params.token}`} {...params} />
    </ThemeProvider>
  );
}
