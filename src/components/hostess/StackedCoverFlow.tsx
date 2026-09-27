import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { Star } from "lucide-react";
import { hapticTick } from "@/lib/haptics";
import { LiveStatus, Photo } from "./system";

export type StackedCoverFlowItem = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  meta: string;
  eyebrow?: string;
  badge?: string;
  occupancy?: number;
  rating?: number;
  onClick: () => void;
};

/** Wrap a relative offset into (-n/2, n/2] so the drum is endless. */
function wrapOffset(value: number, n: number) {
  if (n <= 1) return value;
  const half = n / 2;
  return ((((value + half) % n) + n) % n) - half;
}

const mod = (v: number, n: number) => ((v % n) + n) % n;

/**
 * Signature stacked drum. A single continuous motion value (`pos`) drives
 * every card, so cards track the finger 1:1 and settle with a
 * velocity-aware spring. Depth comes from perspective, Z-translation and
 * tonal shading — not from transparency.
 */
export function StackedCoverFlow({ items }: { items: StackedCoverFlowItem[] }) {
  const n = items.length;
  const reduce = useReducedMotion();
  const pos = useMotionValue(0);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const panStart = useRef(0);
  const panned = useRef(false);
  const [cardW, setCardW] = useState(264);

  useEffect(() => {
    const measure = () => setCardW(Math.round(Math.min(Math.max(window.innerWidth * 0.68, 236), 300)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const cardH = Math.round(cardW * 1.36);
  const step = cardW * 0.62;

  useMotionValueEvent(pos, "change", (v) => {
    const idx = mod(Math.round(v), n);
    if (idx !== activeRef.current) {
      activeRef.current = idx;
      setActive(idx);
      hapticTick();
    }
  });

  const settle = (target: number, velocity = 0) => {
    anim.current?.stop();
    anim.current = animate(
      pos,
      target,
      reduce
        ? { duration: 0 }
        : { type: "spring", stiffness: 280, damping: 32, mass: 0.9, velocity, restDelta: 0.001 },
    );
  };

  const goTo = (index: number) => {
    const current = pos.get();
    settle(current + wrapOffset(index - current, n));
  };

  const onPanStart = () => {
    anim.current?.stop();
    panned.current = true;
    panStart.current = pos.get();
  };

  const onPan = (_: PointerEvent, info: PanInfo) => {
    pos.set(panStart.current - info.offset.x / step);
  };

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const velocity = -info.velocity.x / step;
    const projected = pos.get() + velocity * 0.22;
    const delta = Math.max(-3, Math.min(3, Math.round(projected) - Math.round(panStart.current)));
    settle(Math.round(panStart.current) + delta, velocity);
  };

  if (n === 0) return null;

  return (
    <div className="select-none overflow-x-clip pt-1">
      <motion.div
        onPanStart={n > 1 ? onPanStart : undefined}
        onPan={n > 1 ? onPan : undefined}
        onPanEnd={n > 1 ? onPanEnd : undefined}
        onPointerDown={() => (panned.current = false)}
        className="relative mx-auto touch-pan-y"
        style={{ height: cardH + 20, perspective: 1100, perspectiveOrigin: "50% 45%" }}
      >
        {items.map((item, index) => (
          <DrumCard
            key={item.id}
            item={item}
            index={index}
            n={n}
            pos={pos}
            width={cardW}
            height={cardH}
            onTap={(rel) => {
              if (panned.current) return;
              if (Math.abs(rel) < 0.5) item.onClick();
              else goTo(index);
            }}
          />
        ))}
      </motion.div>

      {n > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Показать ${item.title}`}
                aria-current={index === active}
                className="grid h-8 place-items-center px-0.5"
              >
                <motion.span
                  animate={{
                    width: index === active ? 18 : 5,
                    backgroundColor: index === active ? "var(--hs-ink)" : "rgb(23 21 15 / 0.18)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  className="block h-[5px] rounded-full"
                />
              </button>
            ))}
          </div>
          <span className="t-num text-[11px] font-medium tracking-[0.08em] text-ink-3">
            {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}

function DrumCard({
  item,
  index,
  n,
  pos,
  width,
  height,
  onTap,
}: {
  item: StackedCoverFlowItem;
  index: number;
  n: number;
  pos: MotionValue<number>;
  width: number;
  height: number;
  onTap: (rel: number) => void;
}) {
  const rel = useTransform(pos, (p) => wrapOffset(index - p, n));

  // Cover-flow geometry: neighbours spread, further cards compress behind.
  const x = useTransform(rel, (r) => {
    const a = Math.abs(r);
    const d = a <= 1 ? a * 0.56 : 0.56 + (a - 1) * 0.2;
    return Math.sign(r) * d * width;
  });
  const rotateY = useTransform(rel, (r) => -Math.max(-1.25, Math.min(1.25, r)) * 22);
  const z = useTransform(rel, (r) => -Math.min(Math.abs(r), 2.6) * 110);
  const scale = useTransform(rel, (r) => 1 - Math.min(Math.abs(r), 2.6) * 0.06);
  const y = useTransform(rel, (r) => Math.min(Math.abs(r), 2.6) * 4);
  const zIndex = useTransform(rel, (r) => Math.round(100 - Math.abs(r) * 10));
  const opacity = useTransform(rel, (r) => {
    const a = Math.abs(r);
    return a > 2.4 ? Math.max(0, 1 - (a - 2.4) * 2.5) : 1;
  });
  const shade = useTransform(rel, (r) => Math.min(Math.abs(r), 2) * 0.26);
  const textOpacity = useTransform(rel, (r) => Math.max(0, 1 - Math.abs(r) * 1.6));
  const shadow = useTransform(rel, (r) => {
    const k = Math.max(0, 1 - Math.abs(r));
    return `0 ${10 + k * 18}px ${24 + k * 30}px -${16 + k * 4}px rgb(23 21 15 / ${0.18 + k * 0.28})`;
  });
  const pointerEvents = useTransform(rel, (r) => (Math.abs(r) > 2.4 ? "none" : "auto"));

  return (
    <motion.button
      type="button"
      onClick={() => onTap(rel.get())}
      className="absolute left-1/2 top-0 overflow-hidden rounded-hero bg-stone text-left will-change-transform"
      style={{
        width,
        height,
        marginLeft: -width / 2,
        x,
        y,
        z,
        rotateY,
        scale,
        zIndex,
        opacity,
        boxShadow: shadow,
        pointerEvents,
        transformStyle: "preserve-3d",
      }}
      aria-label={`Открыть ${item.title}`}
    >
      <Photo src={item.image} className="absolute inset-0 h-full w-full" eager={index < 3} />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/5" />
      <motion.span
        className="pointer-events-none absolute inset-0 bg-[#17150f]"
        style={{ opacity: shade }}
      />

      {item.badge && (
        <motion.span
          style={{ opacity: textOpacity }}
          className="frost-photo absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[-0.005em] text-ink"
        >
          {item.badge}
        </motion.span>
      )}

      <motion.span
        style={{ opacity: textOpacity }}
        className="pointer-events-none absolute inset-x-5 bottom-5 block text-white"
      >
        {item.eyebrow && (
          <span className="block text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/70">
            {item.eyebrow}
          </span>
        )}
        <span className="mt-1.5 block text-[24px] font-semibold leading-[1.05] tracking-[-0.03em]">
          {item.title}
        </span>
        <span className="mt-1.5 block truncate text-[13px] text-white/75">{item.subtitle}</span>
        <span className="mt-3.5 flex items-center justify-between gap-3">
          {item.occupancy != null ? (
            <LiveStatus occupancy={item.occupancy} light showPercent={false} />
          ) : (
            <span className="text-[12.5px] font-medium">{item.meta}</span>
          )}
          {item.rating != null && (
            <span className="t-num inline-flex items-center gap-1 text-[12.5px] font-medium">
              <Star className="h-3 w-3 fill-white" strokeWidth={0} />
              {item.rating.toFixed(1)}
            </span>
          )}
        </span>
      </motion.span>
    </motion.button>
  );
}
