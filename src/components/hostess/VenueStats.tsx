import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiveStatus, OccupancyRing, occupancyLevel, toneColor } from "./system";
import { freshness, hourlyLoad, liveSignal } from "./venue";

function currentIndex(len: number) {
  const hour = new Date().getHours();
  return Math.max(0, Math.min(len - 1, (hour < 6 ? hour + 24 : hour) - 12));
}

function LoadBars({ values, idx, tone, height, animateIn }: { values: number[]; idx: number; tone: string; height: number; animateIn: boolean }) {
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {values.map((v, i) => (
        <motion.span
          key={i}
          className="w-[3px] origin-bottom rounded-[1.5px]"
          style={{ height: `${v}%`, background: i === idx ? tone : "rgb(17 18 20 / 0.12)" }}
          initial={{ scaleY: 0 }}
          animate={animateIn ? { scaleY: 1 } : {}}
          transition={{ delay: i * 0.018, type: "spring", stiffness: 260, damping: 26 }}
        />
      ))}
    </div>
  );
}

/**
 * Compact "now" strip for venue detail (Flighty precision, no dashboard):
 * ring + state + source/freshness on the left, today's load curve right.
 */
export function LiveNow({
  id,
  occupancy,
  peakHours,
  className,
}: {
  id: string;
  occupancy: number;
  peakHours: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10px" });
  const signal = liveSignal(id);
  const estimated = signal.source === "estimated";
  const load = hourlyLoad(peakHours, occupancy);
  const idx = currentIndex(load.length);
  const values = load.map((v, i) => (i === idx ? occupancy : v));
  const { tone, label } = occupancyLevel(occupancy);

  return (
    <div ref={ref} className={cn("flex items-center gap-3.5 border-y border-line py-4", className)}>
      <OccupancyRing value={occupancy} size={46} stroke={3} estimated={estimated}>
        <span className="t-num text-[12px] font-semibold tracking-[-0.02em]">{estimated ? "≈" : `${occupancy}%`}</span>
      </OccupancyRing>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold tracking-[-0.012em]">
          {label}
          <span className="font-normal text-ink-3"> · сейчас</span>
        </p>
        <p className="mt-0.5 truncate text-[12px] text-ink-3">{freshness(signal)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <LoadBars values={values} idx={idx} tone={toneColor[tone]} height={26} animateIn={inView} />
        <span className="t-num text-[10.5px] text-ink-3">Пик {peakHours.replace(/ /g, "")}</span>
      </div>
    </div>
  );
}

/** Wider load panel (kept for XOXO): open layout, hairlines, no card. */
export function VenueStats({
  occupancy,
  peakHours,
  className,
  title = "Загрузка сейчас",
}: {
  occupancy: number;
  peakHours: string;
  className?: string;
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const load = hourlyLoad(peakHours, occupancy);
  const idx = currentIndex(load.length);
  const values = load.map((v, i) => (i === idx ? occupancy : v));
  const { tone } = occupancyLevel(occupancy);

  return (
    <div ref={ref} className={cn("border-y border-line py-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="t-micro">{title}</p>
          <LiveStatus occupancy={occupancy} className="mt-2 text-[14px]" />
        </div>
        <div className="text-right">
          <p className="t-micro">Пик</p>
          <p className="t-num mt-2 text-[14px] font-medium">{peakHours}</p>
        </div>
      </div>
      <div className="mt-4 flex h-12 items-end gap-[3px]">
        {values.map((v, i) => (
          <motion.span
            key={i}
            className="flex-1 origin-bottom rounded-[2px]"
            style={{ height: `${v}%`, background: i === idx ? toneColor[tone] : "rgb(17 18 20 / 0.08)" }}
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ delay: i * 0.02, type: "spring", stiffness: 260, damping: 26 }}
          />
        ))}
      </div>
      <div className="t-num mt-2 flex justify-between text-[10.5px] text-ink-3">
        <span>12:00</span>
        <span>16:00</span>
        <span>20:00</span>
        <span>00:00</span>
        <span>02:00</span>
      </div>
    </div>
  );
}
