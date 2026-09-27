import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveStatus, Photo, tapSpring } from "./system";

/* ──────────────────────────────────────────────────────────────────────
   Venue card family — one visual grammar for every venue presentation:
   photo → name → quiet meta → realtime status.
   ────────────────────────────────────────────────────────────────────── */

export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("t-num inline-flex items-center gap-1 text-[12.5px] font-medium text-ink", className)}>
      <Star className="h-3 w-3 fill-ink" strokeWidth={0} />
      {value.toFixed(1)}
    </span>
  );
}

/** Full-width list row: thumbnail + text + live status (+ optional slots). */
export function VenueRow({
  image,
  title,
  subtitle,
  occupancy,
  rating,
  meta,
  status,
  estimated,
  onClick,
  footer,
  className,
}: {
  image: string;
  title: string;
  subtitle: string;
  occupancy?: number;
  rating?: number;
  meta?: string;
  status?: string;
  estimated?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-5", className)}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        transition={tapSpring}
        onClick={onClick}
        className="flex w-full items-start gap-4 text-left"
      >
        <Photo src={image} className="h-[76px] w-[76px] shrink-0 rounded-[14px]" />
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="flex items-start justify-between gap-3">
            <span className="block truncate text-[16px] font-semibold tracking-[-0.015em] text-ink">
              {title}
            </span>
            {rating != null && <Rating value={rating} className="shrink-0 pt-0.5" />}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-ink-2">{subtitle}</span>
          <span className="mt-2 flex items-center gap-2">
            {occupancy != null && (
              <LiveStatus occupancy={occupancy} label={status} estimated={estimated} showPercent={false} />
            )}
            {meta && <span className="t-num truncate text-[12.5px] text-ink-3">· {meta}</span>}
          </span>
        </span>
      </motion.button>
      {footer && <div className="mt-3 pl-[92px]">{footer}</div>}
    </div>
  );
}

/** Time slot chips (OpenTable pattern) — quiet outline, the reservation language. */
export function SlotChips({
  slots,
  onPick,
  selected,
  size = "sm",
}: {
  slots: string[];
  onPick: (slot: string) => void;
  selected?: string | null;
  size?: "sm" | "md";
}) {
  if (slots.length === 0)
    return <span className="text-[12.5px] font-medium text-busy">Мест нет · лист ожидания</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((s) => {
        const on = selected === s;
        return (
          <motion.button
            key={s}
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={tapSpring}
            onClick={(e) => {
              e.stopPropagation();
              onPick(s);
            }}
            className={cn(
              "t-num rounded-[12px] font-medium tracking-[-0.005em] transition-colors",
              size === "sm" ? "h-8 px-3 text-[13px]" : "h-11 px-4 text-[14.5px]",
              on
                ? "bg-ink text-white"
                : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--hs-line-strong)]",
            )}
          >
            {s}
          </motion.button>
        );
      })}
    </div>
  );
}

/** Horizontal compact card for the map sheet (Booking-style result preview). */
export function CompactVenueCard({
  image,
  title,
  subtitle,
  occupancy,
  rating,
  status,
  estimated,
  onClick,
  className,
}: {
  image: string;
  title: string;
  subtitle: string;
  occupancy: number;
  rating: number;
  status?: string;
  estimated?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      transition={tapSpring}
      onClick={onClick}
      className={cn(
        "flex w-[272px] shrink-0 snap-start items-center gap-3 rounded-card bg-surface p-2.5 pr-3.5 text-left shadow-hairline",
        className,
      )}
    >
      <Photo src={image} className="h-[72px] w-[72px] shrink-0 rounded-[14px]" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px] font-semibold tracking-[-0.015em]">{title}</span>
          <Rating value={rating} className="shrink-0" />
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-ink-2">{subtitle}</span>
        <LiveStatus occupancy={occupancy} label={status} estimated={estimated} className="mt-1.5" showPercent={false} />
      </span>
    </motion.button>
  );
}

/** Editorial portrait card with caption beneath the photo (Dorsia rhythm). */
export function EditorialCard({
  image,
  title,
  caption,
  onClick,
  width = 168,
}: {
  image: string;
  title: string;
  caption: string;
  onClick: () => void;
  width?: number;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      transition={tapSpring}
      onClick={onClick}
      className="shrink-0 snap-start text-left"
      style={{ width }}
    >
      <Photo src={image} className="aspect-[4/5] w-full rounded-card" />
      <span className="mt-2.5 block truncate text-[15px] font-semibold tracking-[-0.015em]">{title}</span>
      <span className="mt-0.5 block truncate text-[12.5px] text-ink-2">{caption}</span>
    </motion.button>
  );
}

/** Wide cinematic card for events. */
export function EventCard({
  image,
  eyebrow,
  title,
  subtitle,
  meta,
  onClick,
}: {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      transition={tapSpring}
      onClick={onClick}
      className="w-[300px] shrink-0 snap-start text-left"
    >
      <span className="relative block overflow-hidden rounded-card">
        <Photo src={image} className="aspect-[16/10] w-full" />
        <span className="frost-photo absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium text-ink">
          {eyebrow}
        </span>
      </span>
      <span className="mt-3 flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold tracking-[-0.015em]">{title}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-ink-2">{subtitle}</span>
        </span>
        <span className="t-num shrink-0 pt-0.5 text-[12.5px] font-medium text-ink">{meta}</span>
      </span>
    </motion.button>
  );
}
