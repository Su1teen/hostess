import { useState, type ComponentType, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  type HTMLMotionProps,
  type PanInfo,
} from "framer-motion";
import { ChevronRight, Minus, Plus, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
   Hostess system primitives — the only building blocks screens should use.
   ────────────────────────────────────────────────────────────────────── */

export const spring = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 } as const;
export const sheetSpring = { type: "spring", stiffness: 330, damping: 36, mass: 0.95 } as const;
export const softSpring = { type: "spring", stiffness: 240, damping: 30 } as const;
export const tapSpring = { type: "spring", stiffness: 600, damping: 30 } as const;

export const ICON_STROKE = 1.6;

/* ── Buttons ─────────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "light";
type ButtonSize = "lg" | "md" | "sm";

const buttonVariant: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white shadow-[0_10px_24px_-12px_rgb(23_21_15/0.55)]",
  secondary: "bg-stone text-ink",
  outline: "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--hs-line-strong)]",
  ghost: "bg-transparent text-ink",
  light: "bg-white text-ink shadow-soft",
};

const buttonSize: Record<ButtonSize, string> = {
  lg: "h-14 rounded-btn px-6 text-[16px]",
  md: "h-12 rounded-[18px] px-5 text-[15px]",
  sm: "h-9 rounded-[14px] px-3.5 text-[13px]",
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  ...props
}: HTMLMotionProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize; block?: boolean }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      transition={tapSpring}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 font-medium tracking-[-0.01em] transition-[background-color,opacity,box-shadow] disabled:pointer-events-none disabled:opacity-35",
        buttonSize[size],
        buttonVariant[variant],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

type IconButtonVariant = "surface" | "photo" | "stone" | "plain" | "ink";

const iconButtonVariant: Record<IconButtonVariant, string> = {
  surface: "bg-white text-ink shadow-soft",
  photo: "frost-photo text-ink shadow-[0_4px_14px_-6px_rgb(0_0_0/0.3)]",
  stone: "bg-stone text-ink",
  plain: "text-ink",
  ink: "bg-ink text-white",
};

export function IconButton({
  icon: Icon,
  label,
  variant = "surface",
  size = 40,
  iconSize = 18,
  className,
  ...props
}: Omit<HTMLMotionProps<"button">, "children"> & {
  icon: ComponentType<LucideProps>;
  label: string;
  variant?: IconButtonVariant;
  size?: number;
  iconSize?: number;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={tapSpring}
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        iconButtonVariant[variant],
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <Icon style={{ width: iconSize, height: iconSize }} strokeWidth={ICON_STROKE} />
    </motion.button>
  );
}

/* ── Chips & tags ────────────────────────────────────────────────── */

export function Chip({
  selected,
  tone = "stone",
  icon: Icon,
  className,
  children,
  ...props
}: Omit<HTMLMotionProps<"button">, "children"> & {
  children?: ReactNode;
  selected?: boolean;
  tone?: "stone" | "surface" | "outline";
  icon?: ComponentType<LucideProps>;
}) {
  const idle =
    tone === "surface"
      ? "bg-white text-ink shadow-soft"
      : tone === "outline"
        ? "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--hs-line-strong)]"
        : "bg-stone text-ink";
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      transition={tapSpring}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-chip px-3.5 text-[13.5px] font-medium tracking-[-0.01em] transition-colors duration-200",
        selected ? "bg-ink text-white" : idle,
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-[15px] w-[15px]" strokeWidth={ICON_STROKE} />}
      {children}
    </motion.button>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-2 shadow-[inset_0_0_0_1px_var(--hs-line-strong)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Section header ──────────────────────────────────────────────── */

export function SectionHeader({
  title,
  eyebrow,
  action,
  onAction,
  className,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4 px-5", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="t-micro mb-1.5">{eyebrow}</p>}
        <h2 className="t-headline truncate text-ink">{title}</h2>
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="press shrink-0 pb-0.5 text-[14px] font-medium text-ink-2"
        >
          {action}
        </button>
      )}
    </div>
  );
}

/* ── Grouped rows (iOS inset grouped list) ───────────────────────── */

export function RowGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("divide-hairline overflow-hidden rounded-card bg-surface", className)}>
      {children}
    </div>
  );
}

export function ListRow({
  icon: Icon,
  leading,
  title,
  subtitle,
  value,
  trailing,
  chevron = true,
  destructive,
  onClick,
  className,
}: {
  icon?: ComponentType<LucideProps>;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] w-full items-center gap-3.5 px-4 py-3 text-left",
        onClick && "press-soft",
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-[11px]",
            destructive ? "bg-busy-soft text-busy" : "bg-stone text-ink",
          )}
        >
          <Icon className="h-[17px] w-[17px]" strokeWidth={ICON_STROKE} />
        </span>
      )}
      {leading}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[15px] tracking-[-0.01em]",
            destructive ? "text-busy" : "text-ink",
          )}
        >
          {title}
        </span>
        {subtitle && <span className="mt-0.5 block truncate text-[13px] text-ink-3">{subtitle}</span>}
      </span>
      {value && <span className="t-num shrink-0 text-[14px] text-ink-2">{value}</span>}
      {trailing}
      {chevron && onClick && !trailing && (
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={ICON_STROKE} />
      )}
    </Tag>
  );
}

/* ── Realtime status ─────────────────────────────────────────────── */

export type LiveTone = "live" | "warn" | "busy";

export function occupancyLevel(occupancy: number): { tone: LiveTone; label: string } {
  if (occupancy >= 98) return { tone: "busy", label: "Полная посадка" };
  if (occupancy >= 80) return { tone: "busy", label: "Почти полно" };
  if (occupancy >= 55) return { tone: "warn", label: "Умеренно" };
  return { tone: "live", label: "Свободно" };
}

export const toneColor: Record<LiveTone, string> = {
  live: "var(--hs-live)",
  warn: "var(--hs-warn)",
  busy: "var(--hs-busy)",
};

export function LiveDot({
  tone,
  pulse = false,
  size = 7,
}: {
  tone: LiveTone;
  pulse?: boolean;
  size?: number;
}) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {pulse && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: toneColor[tone],
            animation: "hs-live-pulse 1.8s var(--ease-out-quint) infinite",
          }}
        />
      )}
      <span className="relative h-full w-full rounded-full" style={{ background: toneColor[tone] }} />
    </span>
  );
}

export function LiveStatus({
  occupancy,
  className,
  light,
  showPercent = true,
}: {
  occupancy: number;
  className?: string;
  light?: boolean;
  showPercent?: boolean;
}) {
  const { tone, label } = occupancyLevel(occupancy);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12.5px] font-medium",
        light ? "text-white" : "text-ink",
        className,
      )}
    >
      <LiveDot tone={tone} pulse={tone === "live"} />
      {label}
      {showPercent && (
        <span className={cn("t-num font-normal", light ? "text-white/65" : "text-ink-3")}>
          · {occupancy}%
        </span>
      )}
    </span>
  );
}

/* ── Stepper ─────────────────────────────────────────────────────── */

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "md",
  tone = "stone",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "md" | "sm";
  tone?: "stone" | "surface";
}) {
  const btn = size === "sm" ? 30 : 36;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full p-1",
        tone === "stone" ? "bg-stone" : "bg-white shadow-hairline",
      )}
    >
      <IconButton
        icon={Minus}
        label="Меньше"
        variant={tone === "stone" ? "surface" : "stone"}
        size={btn}
        iconSize={14}
        disabled={value <= min}
        className="shadow-none disabled:opacity-35"
        onClick={() => onChange(Math.max(min, value - 1))}
      />
      <span className="t-num min-w-7 text-center text-[15px] font-semibold">{value}</span>
      <IconButton
        icon={Plus}
        label="Больше"
        variant={tone === "stone" ? "surface" : "stone"}
        size={btn}
        iconSize={14}
        disabled={value >= max}
        className="shadow-none disabled:opacity-35"
        onClick={() => onChange(Math.min(max, value + 1))}
      />
    </div>
  );
}

/* ── Segmented underline tabs ────────────────────────────────────── */

export function Tabs<T extends string>({
  id,
  tabs,
  value,
  onChange,
  className,
}: {
  id: string;
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-6 border-b border-line px-5", className)} role="tablist">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative pb-3 pt-1 text-[15px] font-medium tracking-[-0.01em] transition-colors",
              active ? "text-ink" : "text-ink-3",
            )}
          >
            {t.label}
            {active && (
              <motion.span
                layoutId={`tabs-${id}`}
                transition={spring}
                className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-ink"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Photography with graceful loading ───────────────────────────── */

export function Photo({
  src,
  alt = "",
  className,
  imgClassName,
  eager,
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={cn("relative block overflow-hidden bg-stone", className)}>
      {!loaded && <span className="skeleton absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full select-none object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
    </span>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: ComponentType<LucideProps>;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-8 py-12 text-center", className)}>
      <span className="grid h-14 w-14 place-items-center rounded-full bg-stone text-ink-2">
        <Icon className="h-6 w-6" strokeWidth={ICON_STROKE} />
      </span>
      <p className="t-subhead mt-4 text-ink">{title}</p>
      {text && <p className="t-caption mt-1.5 max-w-[260px]">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Success mark (shared confirmation state) ────────────────────── */

export function SuccessMark({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 56 56"
      className={cn("h-14 w-14", className)}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={softSpring}
    >
      <circle cx="28" cy="28" r="28" fill="var(--hs-ink)" />
      <motion.path
        d="M18 28.5l6.5 6.5L38 21.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
  );
}

/* ── Bottom sheet (modal) ────────────────────────────────────────── */

/**
 * Modal bottom sheet: dimmed backdrop, grab handle, drag-to-dismiss,
 * independent scroll area and an optional docked footer that respects
 * the home-indicator safe area.
 */
export function BottomSheet({
  onClose,
  children,
  footer,
  header,
  className,
  z = "z-[110]",
  maxHeight = "92%",
  tone = "canvas",
}: {
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  className?: string;
  z?: string;
  maxHeight?: string;
  tone?: "canvas" | "surface";
}) {
  const controls = useDragControls();
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) onClose();
  };
  return (
    <motion.div
      className={cn("absolute inset-0 flex items-end", z)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-[rgb(23_21_15/0.32)]"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={sheetSpring}
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.9 }}
        dragSnapToOrigin
        onDragEnd={onDragEnd}
        style={{ maxHeight }}
        className={cn(
          "relative flex w-full flex-col overflow-hidden rounded-t-hero shadow-sheet",
          tone === "canvas" ? "bg-canvas" : "bg-surface",
          className,
        )}
      >
        <div
          onPointerDown={(e) => controls.start(e)}
          className="absolute inset-x-0 top-0 z-30 flex h-6 touch-none justify-center pt-2"
        >
          <span className="h-[5px] w-9 rounded-full bg-[rgb(23_21_15/0.18)]" />
        </div>
        {header && (
          <div onPointerDown={(e) => controls.start(e)} className="shrink-0 touch-none">
            {header}
          </div>
        )}
        <div className="scroll-y no-scrollbar min-h-0 flex-1">{children}</div>
        {footer && <Dock>{footer}</Dock>}
      </motion.div>
    </motion.div>
  );
}

/* ── Docked action bar (bottom of sheets / detail screens) ───────── */

export function Dock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative z-20 shrink-0 border-t border-line bg-[color-mix(in_oklab,var(--hs-canvas)_92%,transparent)] px-5 pt-3 backdrop-blur-xl pb-safe",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Animated number swap (prices, counters) ─────────────────────── */

export function Ticker({ value, className }: { value: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-flex overflow-hidden", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: "60%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-60%", opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="t-num"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
