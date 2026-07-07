import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Star, Wallet } from "lucide-react";
import { money } from "@/data/hostess";

/* ── Props ────────────────────────────────────────────────────────── */

interface VenueStatsProps {
  occupancy: number;   // 0-100 percentage
  avgCheck: number;    // in tenge
  peakHours: string;   // e.g. "19:00 – 21:00"
  rating: number;      // e.g. 4.9
  reviews: number;     // e.g. 1284
}

/* ── SVG Donut constants ──────────────────────────────────────────── */

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* ── Component ────────────────────────────────────────────────────── */

export function VenueStats({ occupancy, avgCheck, peakHours, rating, reviews }: VenueStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  // Calculate the stroke offset for the donut arc
  const targetOffset = CIRCUMFERENCE - (occupancy / 100) * CIRCUMFERENCE;

  return (
    <div
      ref={ref}
      className="flex items-center gap-4 rounded-2xl bg-neutral-50 p-4"
    >
      {/* ── Donut chart ───────────────────────────────────────── */}
      <div className="relative h-[120px] w-[120px] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="7"
          />
          {/* Animated progress ring */}
          <motion.circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="var(--theme-accent, #F97316)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={isInView ? { strokeDashoffset: targetOffset } : {}}
            transition={{ type: "spring", stiffness: 60, damping: 18, mass: 1 }}
          />
        </svg>

        {/* Center percentage label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-semibold tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
          >
            {occupancy}%
          </motion.span>
          <span className="text-[10px] text-neutral-500">загрузка</span>
        </div>
      </div>

      {/* ── Metric cards ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Average check */}
        <motion.div
          className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-50">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-neutral-500">Средний чек</p>
            <p className="text-sm font-semibold leading-tight">{money(avgCheck)}</p>
          </div>
        </motion.div>

        {/* Peak hours */}
        <motion.div
          className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.2 }}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50">
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-neutral-500">Пиковые часы</p>
            <p className="text-sm font-semibold leading-tight">{peakHours}</p>
          </div>
        </motion.div>

        {/* Rating */}
        <motion.div
          className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.3 }}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-yellow-50">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-neutral-500">Рейтинг</p>
            <p className="text-sm font-semibold leading-tight">
              {rating}{" "}
              <span className="text-[10px] font-normal text-neutral-400">
                ({reviews.toLocaleString("ru-RU")} отзывов)
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
