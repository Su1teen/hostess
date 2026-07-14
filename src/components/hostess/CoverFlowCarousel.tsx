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
 * CARD_W  — visual width of the card (15 % narrower than 345 → ~293 px).
 * ITEM_W  — width of the flex scroll-item.  Controls scroll speed:
 *           larger = more px needed per card switch = slower, smoother.
 * PULL    — how many px to translate each side-card inward so they
 *           stack tightly behind the active card.
 *
 * Visual peek of side card ≈ ITEM_W − PULL − (CARD_W × (1−SCALE))/2
 *   140 − 100 − (293×0.06)/2 ≈ 31 px  → tight stack ✓
 */
const CARD_W = 293;
const CARD_H = Math.round(CARD_W * (5 / 4)); // 366
const ITEM_W = 140;
const PULL = 100; // translateX pull per normalised step

/**
 * Stacked card carousel with native horizontal scroll.
 *
 * Flex items are ITEM_W wide; the visual card inside each is CARD_W
 * wide (overflows its parent). A per-frame `paint` pass applies:
 *   • translateX  — pulls side cards inward (tight stacking)
 *   • scale       — side cards shrink slightly
 *   • rotateY     — 3-D tilt
 *   • translateZ  — depth
 *   • opacity     — fade
 *
 * Because ITEM_W is large (140 px), the user needs a meaningful
 * swipe to change cards — no more "too fast" scroll.  The visual
 * stacking is entirely controlled by translateX in the paint pass.
 *
 * `scroll-snap-stop: always` prevents overshooting on iOS.
 * Infinite scroll via tripled list + silent re-center.
 * Haptic tick on every card change.
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

  // Triple list for infinite scroll.
  const loop = [...items, ...items, ...items];
  const mid = items.length;

  // ── Paint: per-frame 3-D transforms ─────────────────────────
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
      const norm = dist / ITEM_W; // continuous, not clamped
      const abs = Math.abs(norm);

      // Clamp influence at ±2.5 steps (beyond that cards are hidden)
      const cAbs = Math.min(abs, 2.5);
      const cNorm = Math.sign(norm) * cAbs;

      // ── translateX: pull side cards toward center ──
      const tx = cNorm * -PULL;

      // ── scale: center 1 → ±1 step 0.94 → ±2 steps 0.88 ──
      const scale = 1 - cAbs * 0.06;

      // ── opacity: center 1 → ±2 steps 0.5 ──
      const opacity = Math.max(0.3, 1 - cAbs * 0.22);

      // ── rotateY: gentle 3-D tilt ──
      const ry = cNorm * -8;

      // ── translateZ: push side cards back ──
      const tz = -cAbs * 35;

      // ── translateY: tiny vertical shift for depth ──
      const ty = Math.min(cAbs, 1) * 5;

      card.style.transform =
        `perspective(1200px) translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(100 - Math.round(cAbs * 10));

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
      settle = setTimeout(recenter, 180);
    };
    el.addEventListener("scroll", handler);
    return () => {
      clearTimeout(settle);
      el.removeEventListener("scroll", handler);
    };
  }, [recenter]);

  // Smooth-scroll to a specific card.
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
          paddingTop: 12,
          paddingBottom: 18,
        }}
      >
        {loop.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            ref={(node) => {
              cardsRef.current[i] = node;
            }}
            className="relative shrink-0 snap-center will-change-transform"
            style={{
              width: ITEM_W,
              height: CARD_H,
              scrollSnapStop: "always", // prevent skipping cards on fast flick
            }}
          >
            {/* Visual card — wider than the flex item, centered */}
            <button
              onClick={() => {
                if (i === activeRef.current) onSelect?.(item);
                else scrollToCard(i);
              }}
              className="absolute top-0 overflow-hidden rounded-[24px] text-left shadow-float"
              style={{
                width: CARD_W,
                height: CARD_H,
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
