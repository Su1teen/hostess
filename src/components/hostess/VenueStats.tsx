import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiveStatus, occupancyLevel, toneColor } from "./system";
import { hourlyLoad } from "./venue";

/**
 * Realtime load panel (Flighty-style): one status line, one calm chart.
 * Current hour is the only saturated bar; everything else stays neutral.
 */
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
  const hour = new Date().getHours();
  const idx = Math.max(0, Math.min(load.length - 1, (hour < 6 ? hour + 24 : hour) - 12));
  const values = load.map((v, i) => (i === idx ? occupancy : v));
  const { tone } = occupancyLevel(occupancy);

  return (
    <div ref={ref} className={cn("rounded-card bg-surface p-4 shadow-hairline", className)}>
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
      <div className="mt-4 flex h-14 items-end gap-[3px]">
        {values.map((v, i) => (
          <motion.span
            key={i}
            className="flex-1 origin-bottom rounded-[3px]"
            style={{
              height: `${v}%`,
              background: i === idx ? toneColor[tone] : "rgb(23 21 15 / 0.1)",
            }}
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
