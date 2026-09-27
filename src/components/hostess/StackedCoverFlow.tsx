import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { Star } from "lucide-react";
import type { LiveMedia } from "@/data/hostess";
import { hapticTick } from "@/lib/haptics";
import { AmbienceVideo, LiveBadge, useMediaFocusHeld } from "./LiveMedia";
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
  /** Override for the status line (e.g. bays "2 из 6 свободно"). */
  status?: string;
  estimated?: boolean;
  rating?: number;
  live?: LiveMedia;
  onClick: () => void;
};

/** Wrap a relative offset into (-n/2, n/2] so the drum is endless. */
function wrapOffset(value: number, n: number) {
  if (n <= 1) return value;
  const half = n / 2;
  return ((((value + half) % n) + n) % n) - half;
}

const mod = (v: number, n: number) => ((v % n) + n) % n;

/** Settle spring: critically-damped feel, no wobble, carries flick velocity. */
const SETTLE = { type: "spring", stiffness: 260, damping: 30, mass: 1, restDelta: 0.0005 } as const;
/** How far a flick "throws" the drum (seconds of projected travel). */
const THROW = 0.2;
const MAX_THROW = 4;

/**
 * Signature stacked drum. A single continuous motion value (`pos`) drives
 * every card, so cards track the finger 1:1 and settle with a
 * velocity-aware spring. Depth comes from perspective, Z-translation and
 * tonal shading — not from transparency. Only the settled front card may
 * play live ambience video.
 */
export function StackedCoverFlow({ items }: { items: StackedCoverFlowItem[] }) {
  const n = items.length;
  const reduce = useReducedMotion();
  const pos = useMotionValue(0);
  const [active, setActive] = useState(0);
  const [settled, setSettled] = useState(true);
  const activeRef = useRef(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const panStart = useRef(0);
  const panned = useRef(false);
  const axis = useRef<"x" | "y" | null>(null);
  const lastTick = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.55 });
  const focusHeld = useMediaFocusHeld();
  const [cardW, setCardW] = useState(264);

  useEffect(() => {
    const measure = () => setCardW(Math.round(Math.min(Math.max(window.innerWidth * 0.66, 236), 300)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const cardH = Math.round(cardW * 1.36);
  const step = cardW * 0.6;

  useMotionValueEvent(pos, "change", (v) => {
    const idx = mod(Math.round(v), n);
    if (idx !== activeRef.current) {
      activeRef.current = idx;
      setActive(idx);
      const now = performance.now();
      if (now - lastTick.current > 45) hapticTick();
      lastTick.current = now;
    }
  });

  const restTimer = useRef(0);
  const unsettle = () => {
    window.clearTimeout(restTimer.current);
    setSettled(false);
  };

  const settle = (target: number, velocity = 0) => {
    anim.current?.stop();
    unsettle();
    anim.current = animate(pos, target, {
      ...(reduce ? { duration: 0 } : { ...SETTLE, velocity }),
      // Video starts only after the drum has rested on a card for a beat.
      onComplete: () => {
        restTimer.current = window.setTimeout(() => setSettled(true), 280);
      },
    });
  };

  const goTo = (index: number) => {
    const current = pos.get();
    settle(current + wrapOffset(index - current, n));
  };

  const onPanStart = (_: PointerEvent, info: PanInfo) => {
    // Axis lock: a mostly-vertical gesture belongs to the page scroll.
    axis.current = Math.abs(info.offset.x) >= Math.abs(info.offset.y) ? "x" : "y";
    if (axis.current === "y") return;
    anim.current?.stop();
    unsettle();
    panned.current = true;
    panStart.current = pos.get();
  };

  const onPan = (_: PointerEvent, info: PanInfo) => {
    if (axis.current !== "x") return;
    pos.set(panStart.current - info.offset.x / step);
  };

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    if (axis.current !== "x") return;
    axis.current = null;
    const velocity = -info.velocity.x / step;
    const projected = pos.get() + velocity * THROW;
    const base = Math.round(panStart.current);
    const delta = Math.max(-MAX_THROW, Math.min(MAX_THROW, Math.round(projected) - base));
    settle(base + delta, velocity);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") goTo(active + 1);
    else if (e.key === "ArrowLeft") goTo(active - 1);
    else if (e.key === "Enter") items[active]?.onClick();
    else return;
    e.preventDefault();
  };

  if (n === 0) return null;
  const canPlay = settled && inView && !focusHeld;

  return (
    <div ref={rootRef} className="select-none overflow-x-clip pt-1">
      <motion.div
        onPanStart={n > 1 ? onPanStart : undefined}
        onPan={n > 1 ? onPan : undefined}
        onPanEnd={n > 1 ? onPanEnd : undefined}
        onPointerDown={() => (panned.current = false)}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="listbox"
        aria-label="Подборка мест"
        aria-activedescendant={`drum-${items[active]?.id}`}
        className="relative mx-auto touch-pan-y outline-none"
        style={{ height: cardH + 18, perspective: 1200, perspectiveOrigin: "50% 42%" }}
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
            playing={canPlay && index === active}
            onTap={(rel) => {
              if (panned.current) return;
              if (Math.abs(rel) < 0.5) item.onClick();
              else goTo(index);
            }}
          />
        ))}
      </motion.div>

      {n > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
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
                    width: index === active ? 16 : 4,
                    backgroundColor: index === active ? "var(--hs-ink)" : "rgb(17 18 20 / 0.16)",
                  }}
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                  className="block h-1 rounded-full"
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
  playing,
  onTap,
}: {
  item: StackedCoverFlowItem;
  index: number;
  n: number;
  pos: MotionValue<number>;
  width: number;
  height: number;
  playing: boolean;
  onTap: (rel: number) => void;
}) {
  const rel = useTransform(pos, (p) => wrapOffset(index - p, n));
  const [videoOn, setVideoOn] = useState(false);

  // Cover-flow geometry: neighbours spread, further cards compress behind.
  const x = useTransform(rel, (r) => {
    const a = Math.abs(r);
    const d = a <= 1 ? a * 0.6 : 0.6 + (a - 1) * 0.17;
    return Math.sign(r) * d * width;
  });
  const rotateY = useTransform(rel, (r) => -Math.max(-1.3, Math.min(1.3, r)) * 18);
  const z = useTransform(rel, (r) => -Math.min(Math.abs(r), 2.6) * 150);
  const scale = useTransform(rel, (r) => 1 - Math.min(Math.abs(r), 2.6) * 0.05);
  const y = useTransform(rel, (r) => Math.min(Math.abs(r), 2.6) * 3);
  const zIndex = useTransform(rel, (r) => Math.round(100 - Math.abs(r) * 10));
  const opacity = useTransform(rel, (r) => {
    const a = Math.abs(r);
    return a > 2.4 ? Math.max(0, 1 - (a - 2.4) * 2.5) : 1;
  });
  const shade = useTransform(rel, (r) => Math.min(Math.abs(r), 2) * 0.24);
  const textOpacity = useTransform(rel, (r) => Math.max(0, 1 - Math.abs(r) * 1.7));
  const shadow = useTransform(rel, (r) => {
    const k = Math.max(0, 1 - Math.abs(r));
    return `0 ${8 + k * 16}px ${20 + k * 30}px -${14 + k * 6}px rgb(17 18 20 / ${0.12 + k * 0.26})`;
  });
  const pointerEvents = useTransform(rel, (r) => (Math.abs(r) > 2.4 ? "none" : "auto"));

  return (
    <motion.button
      type="button"
      id={`drum-${item.id}`}
      role="option"
      aria-selected={playing}
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
      {item.live ? (
        <AmbienceVideo
          media={item.live}
          active={playing}
          eagerPoster={index < 3}
          onPlaying={setVideoOn}
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <Photo src={item.image} className="absolute inset-0 h-full w-full" eager={index < 3} />
      )}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
      <motion.span className="pointer-events-none absolute inset-0 bg-[#0b0c0e]" style={{ opacity: shade }} />

      <motion.span style={{ opacity: textOpacity }} className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-2">
        {item.badge ? (
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium tracking-[-0.005em] text-ink">
            {item.badge}
          </span>
        ) : (
          <span />
        )}
        {item.live && <LiveBadge media={item.live} playing={videoOn} />}
      </motion.span>

      <motion.span style={{ opacity: textOpacity }} className="pointer-events-none absolute inset-x-5 bottom-5 block text-white">
        {item.eyebrow && (
          <span className="block text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/70">
            {item.eyebrow}
          </span>
        )}
        <span className="mt-1.5 block text-[25px] font-semibold leading-[1.04] tracking-[-0.032em]">{item.title}</span>
        <span className="mt-1.5 block truncate text-[13px] text-white/75">{item.subtitle}</span>
        <span className="mt-3.5 flex items-center justify-between gap-3">
          {item.occupancy != null ? (
            <LiveStatus
              occupancy={item.occupancy}
              label={item.status}
              estimated={item.estimated}
              light
              showPercent={!item.status}
            />
          ) : (
            <span className="text-[12.5px] font-medium">{item.meta}</span>
          )}
          {item.rating != null && (
            <span className="t-num inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium">
              <Star className="h-3 w-3 fill-white" strokeWidth={0} />
              {item.rating.toFixed(1)}
            </span>
          )}
        </span>
      </motion.span>
    </motion.button>
  );
}
