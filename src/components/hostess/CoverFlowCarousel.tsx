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

/*
 * ── Layout constants ───────────────────────────────────────────
 * CARD_W  — visual width of the card (~86 vw, large & prominent).
 * ITEM_W  — width of the flex scroll-item; determines the scroll
 *           step and therefore how tightly cards stack. Smaller
 *           value → cards overlap more → tighter stack.
 * STEP    — how many px of scroll correspond to one card change.
 */
const CARD_W = 345;
const ITEM_W = 50;
const STEP = ITEM_W;

/**
 * Stacked card carousel with native horizontal scroll.
 *
 * Cards are visually large (CARD_W) but sit inside narrow flex items
 * (ITEM_W), so they naturally overlap and create a tight "stacked"
 * look. A per-frame `paint` pass applies 3-D transforms (scale,
 * rotateY, translateZ) to the cards based on their distance from
 * the scroll-viewport center, producing the classic Cover Flow
 * depth effect. Haptic feedback fires on each card change.
 *
 * Infinite scroll is achieved by tripling the list and silently
 * re-centering after scroll settles.
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
  const activeRef = useRef<number>(items.length);
  const [active, setActive] = useState<number>(0);

  // Triple the list for infinite scroll illusion.
  const loop = [...items, ...items, ...items];
  const mid = items.length;

  // ── Paint: apply 3-D transforms every scroll frame ──────────
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
      const norm = Math.max(-3, Math.min(3, dist / STEP));
      const abs = Math.abs(norm);

      // Scale: center = 1, side = 0.86, clamp at 2 steps
      const scale = 1 - Math.min(abs, 2) * 0.07;

      // Opacity: center = 1, side fades
      const opacity = 1 - Math.min(abs, 2) * 0.25;

      // Rotate for 3-D depth
      const rotateY = norm * -12;

      // Push side cards back in Z
      const translateZ = -Math.min(abs, 2) * 50;

      // Slight vertical offset for depth feel
      const translateY = Math.min(abs, 1.5) * 8;

      card.style.transform =
        `perspective(1200px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.opacity = String(Math.max(0.25, opacity));
      card.style.zIndex = String(100 - Math.round(abs * 10));
      // Apply transition only when not actively scrolling (snap settling)
      card.style.transition = "opacity 0.15s ease";

      if (Math.abs(dist) < nearestDist) {
        nearestDist = Math.abs(dist);
        nearest = i;
      }
    });

    if (nearest !== activeRef.current) {
      activeRef.current = nearest;
      setActive(((nearest % items.length) + items.length) % items.length);
      hapticTick();
    }
  }, [items.length]);

  // ── Recenter to mid-copy for infinite loop ──────────────────
  const recenter = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
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

  // Center on mid-copy at mount.
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

  // Recenter after scroll settles.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let settle: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(settle);
      settle = setTimeout(recenter, 150);
    };
    el.addEventListener("scroll", handler);
    return () => {
      clearTimeout(settle);
      el.removeEventListener("scroll", handler);
    };
  }, [recenter]);

  // Snap-scroll to a specific card.
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
      {/* ── Scrollable track ─────────────────────────────────── */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        style={{
          paddingLeft: `calc(50% - ${ITEM_W / 2}px)`,
          paddingRight: `calc(50% - ${ITEM_W / 2}px)`,
          /* extra vertical padding so rotated/scaled cards aren't clipped */
          paddingTop: 10,
          paddingBottom: 16,
        }}
      >
        {loop.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            ref={(node) => {
              cardsRef.current[i] = node;
            }}
            className="relative shrink-0 snap-center"
            style={{
              width: ITEM_W,
              /* The visual card overflows this narrow item.
                 We need a fixed height so the flex row has height. */
              height: CARD_W * (5 / 4),
            }}
          >
            {/* Visual card — wider than the flex item, centered via
                absolute + left:50% + negative margin */}
            <button
              onClick={() => {
                if (i === activeRef.current) onSelect?.(item);
                else scrollToCard(i);
              }}
              className="absolute top-0 overflow-hidden rounded-[24px] text-left shadow-float will-change-transform"
              style={{
                width: CARD_W,
                height: CARD_W * (5 / 4),
                left: "50%",
                marginLeft: -(CARD_W / 2),
              }}
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
                {item.subtitle && (
                  <p className="mt-0.5 text-[11px] opacity-80">{item.subtitle}</p>
                )}
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

      {/* ── Dot indicators ───────────────────────────────────── */}
      <div className="mt-1 flex items-center justify-center gap-1.5">
        {items.map((it, i) => (
          <span
            key={it.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-5 bg-primary" : "w-1.5 bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
