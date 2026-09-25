import { useEffect, useState } from "react";

export type XoxoExchangeProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  minPrice: number;
  previousPrice: number | null;
  changePercent: number;
  isAvailable: boolean;
};

type ExchangePayload = {
  generatedAt: string;
  status: "ok" | "no_published_round";
  currentRound: { id: string; roundKey: string; endsAt: string } | null;
  products: XoxoExchangeProduct[];
};

type ExchangeState = {
  products: XoxoExchangeProduct[];
  updatedAt: string | null;
  connected: boolean;
  roundKey: string | null;
};

const empty: ExchangeState = { products: [], updatedAt: null, connected: false, roundKey: null };

export function normalizeExchangeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/whisky/g, "whiskey")
    .replace(/[^a-zа-яё0-9]/gi, "");
}

export function findXoxoExchangeProduct(
  name: string,
  products: XoxoExchangeProduct[],
): XoxoExchangeProduct | undefined {
  const key = normalizeExchangeName(name);
  return products.find((product) => normalizeExchangeName(product.name) === key);
}

export function useXoxoExchange() {
  const [state, setState] = useState<ExchangeState>(empty);

  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(`${apiBase}/api/v1/public/current-round`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Exchange responded ${response.status}`);
        const payload = (await response.json()) as ExchangePayload;
        if (!Array.isArray(payload.products)) throw new Error("Invalid exchange payload");
        if (active) {
          setState({
            products: payload.products.filter((product) => product.isAvailable),
            updatedAt: payload.generatedAt,
            connected: payload.status === "ok",
            roundKey: payload.currentRound?.roundKey ?? null,
          });
        }
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === "AbortError")) {
          setState((previous) => ({ ...previous, connected: false }));
        }
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      controller?.abort();
    };
  }, []);

  return state;
}
