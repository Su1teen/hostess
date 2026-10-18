import { useEffect, useState } from "react";
import { z } from "zod";
import { diningApi, type RegularMenu } from "@/lib/dine-in-api";

const historySchema = z.object({
  generatedAt: z.string().datetime({ offset: true }),
  currency: z.literal("KZT"),
  rounds: z.array(
    z.object({
      id: z.string(),
      startsAt: z.string().datetime({ offset: true }),
      endsAt: z.string().datetime({ offset: true }),
      prices: z.array(
        z.object({ productId: z.string(), price: z.number().finite().nonnegative() }),
      ),
    }),
  ),
});
export type PriceHistory = z.infer<typeof historySchema>;

export function usePriceHistory(roundId?: string | null) {
  const [history, setHistory] = useState<PriceHistory | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/exchange/history?limit=12", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("History unavailable");
        const data = historySchema.parse(await response.json());
        if (!controller.signal.aborted) setHistory(data);
      })
      .catch(() => {
        /* Historical analytics are optional; no synthetic replacements. */
      });
    return () => controller.abort();
  }, [roundId]);
  return history;
}

export function useRegularMenu(venue: string) {
  const [menu, setMenu] = useState<RegularMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      try {
        const result = await diningApi.regularMenu(venue, current.signal);
        if (active && !current.signal.aborted) {
          setMenu(result);
          setAvailable(true);
        }
      } catch {
        if (active && !current.signal.aborted) setAvailable(false);
      } finally {
        if (active && !current.signal.aborted) setLoading(false);
      }
    };
    const focus = () => {
      if (!document.hidden) void refresh();
    };
    void refresh();
    const timer = window.setInterval(focus, 30_000);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      active = false;
      controller?.abort();
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [venue]);
  return { menu, loading, available };
}
