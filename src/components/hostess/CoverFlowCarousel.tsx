import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { hapticTick } from "@/lib/haptics";

export type CoverFlowItem = {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  badge?: string;
  meta?: string;
  payload?: any;
};

const CARD_W = 208; // ширина карточки (px)
const GAP = 16;
const STEP = CARD_W + GAP;

/**
 * Горизонтальная «барабанная» карусель (Cover Flow, Task 2).
 * Центральная карточка увеличена, боковые — уменьшены и слегка повёрнуты.
 * Бесконечная прокрутка (список утраивается и рецентрируется).
 * Тактильный «тик» (navigator.vibrate) при каждой смене активной карточки.
 */
export function CoverFlowCarousel({
  items,
  onSelect,
}: {
  items: CoverFlowItem[];
  onSelect?: (item: CoverFlowItem) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const raf = useRef<number>(0);
  const activeRef = useRef<number>(items.length); // индекс в утроённом списке
  const [active, setActive] = useState<number>(0); // индекс в исходном списке

  // Утраиваем для бесконечной прокрутки.
  const loop = [...items, ...items, ...items];
  const mid = items.length;

  const paint = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let nearest = 0;
    let nearestDist = Infinity;
    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = cardCenter - center;
      const norm = Math.max(-2, Math.min(2, dist / STEP));
      const abs = Math.abs(norm);
      const scale = 1 - abs * 0.16;
      const opacity = 1 - abs * 0.34;
      const rotate = norm * -14; // cover-flow наклон
      const translateY = abs * 10;
      const translateX = norm * -45;
      card.style.transform = `translateX(${translateX}px) translateY(${translateY}px) perspective(800px) rotateY(${rotate}deg) scale(${scale})`;
      card.style.opacity = String(Math.max(0.3, opacity));
      card.style.zIndex = String(100 - Math.round(abs * 10));
      if (Math.abs(dist) < nearestDist) {
        nearestDist = Math.abs(dist);
        nearest = i;
      }
    });

    if (nearest !== activeRef.current) {
      activeRef.current = nearest;
      setActive(((nearest % items.length) + items.length) % items.length);
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(50);
      }
    }
  }, [items.length]);

  const recenter = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Держим прокрутку в пределах средней копии для эффекта бесконечности.
    const idx = activeRef.current;
    if (idx < items.length || idx >= items.length * 2) {
      const target = mid + (((idx % items.length) + items.length) % items.length);
      const card = cardsRef.current[target];
      if (card) {
        el.scrollLeft = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;
        activeRef.current = target;
      }
    }
  }, [items.length, mid]);

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(paint);
  };

  // Центрируем на средней копии при монтировании.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const card = cardsRef.current[mid];
    if (el && card) {
      el.scrollLeft = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;
      activeRef.current = mid;
    }
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Рецентрируем после остановки прокрутки.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let settle: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(settle);
      settle = setTimeout(recenter, 120);
    };
    el.addEventListener("scroll", handler);
    return () => {
      clearTimeout(settle);
      el.removeEventListener("scroll", handler);
    };
  }, [recenter]);

  const scrollToCard = (i: number) => {
    const el = scrollerRef.current;
    const card = cardsRef.current[i];
    if (el && card) {
      el.scrollTo({
        left: card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="select-none">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto pb-2"
        style={{
          gap: GAP,
          paddingLeft: "calc(50% - 104px)",
          paddingRight: "calc(50% - 104px)",
        }}
      >
        {loop.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            ref={(node) => {
              cardsRef.current[i] = node;
            }}
            className="shrink-0 snap-center will-change-transform"
            style={{ width: CARD_W }}
          >
            <button
              onClick={() => {
                if (i === activeRef.current) onSelect?.(item);
                else scrollToCard(i);
              }}
              className="relative block w-full overflow-hidden rounded-[24px] text-left shadow-float"
              style={{ aspectRatio: "4 / 5" }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
              {item.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-lg shadow-primary/30">
                  {item.badge}
                </span>
              )}
              <div className="absolute inset-x-3 bottom-3 text-white">
                <p className="text-[15px] font-semibold leading-tight">{item.title}</p>
                {item.subtitle && <p className="mt-0.5 text-[11px] opacity-80">{item.subtitle}</p>}
                {item.meta && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                    {item.meta} <ChevronRight className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Индикаторы-точки */}
      <div className="mt-1 flex items-center justify-center gap-1.5">
        {items.map((it, i) => (
          <span
            key={it.id}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-5 bg-primary" : "w-1.5 bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
