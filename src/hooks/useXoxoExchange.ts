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
  validUntil: number;
};

const empty: ExchangeState = {
  products: [],
  updatedAt: null,
  connected: false,
  roundKey: null,
  validUntil: 0,
};

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
    const apiPath = "/api/exchange/current-round";

    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(apiPath, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Exchange responded ${response.status}`);
        const payload = (await response.json()) as ExchangePayload;
        if (
          !Array.isArray(payload.products) ||
          !payload.products.every(
            (p) =>
              typeof p.id === "string" &&
              typeof p.name === "string" &&
              Number.isFinite(p.price) &&
              p.price >= 0 &&
              Number.isFinite(p.minPrice) &&
              Number.isFinite(p.originalPrice) &&
              Number.isFinite(p.changePercent),
          )
        )
          throw new Error("Invalid exchange payload");
        const fresh =
          Math.abs(Date.now() - Date.parse(payload.generatedAt)) < 60_000 &&
          payload.currentRound &&
          Date.parse(payload.currentRound.endsAt) > Date.now();
        if (active) {
          setState({
            products: payload.products.filter((product) => product.isAvailable),
            updatedAt: payload.generatedAt,
            connected: payload.status === "ok" && Boolean(fresh),
            roundKey: payload.currentRound?.roundKey ?? null,
            validUntil: Math.min(
              Date.parse(payload.generatedAt) + 60_000,
              Date.parse(payload.currentRound?.endsAt ?? ""),
            ),
          });
        }
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === "AbortError")) {
          setState((previous) => ({ ...previous, connected: false }));
        }
      }
    };

    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30_000);
    const freshness = window.setInterval(
      () =>
        setState((previous) =>
          previous.connected && previous.validUntil <= Date.now()
            ? { ...previous, connected: false }
            : previous,
        ),
      1000,
    );
    return () => {
      window.clearInterval(freshness);
      active = false;
      window.clearInterval(timer);
      controller?.abort();
    };
  }, []);

  return state;
}
