import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Plus, Minus, Check } from "lucide-react";

/**
 * Интерактивный план зала.
 * — Pinch-to-zoom (двумя пальцами) + pan (drag одним пальцем) через Framer Motion.
 * — 6 различных схем залов, переключаются по props.zone.
 * — Базовый холст 360×290 px; столы и декор позиционируются абсолютно.
 */

export type TableStatus = "free" | "occupied" | "reserved";
export type TableMode = "select" | "manage";

type TableDef = {
  id: number;
  shape: "round" | "rect" | "oval";
  x: number;
  y: number;
  w: number;
  h: number;
  seats: number;
  taken: boolean;
  status?: TableStatus;
};

type Plan = {
  id: string;
  label: string;
  baseW: number;
  baseH: number;
  tables: TableDef[];
  decor: ReactNode;
};

const BASE_W = 360;
const BASE_H = 290;

/* ── Декоративные «кирпичики» ─────────────────────────────────────── */

const Walls = ({ dashed = false }: { dashed?: boolean }) => (
  <div
    className={`absolute inset-3 rounded-xl border-2 border-neutral-200 ${
      dashed ? "border-dashed" : ""
    }`}
  />
);

const Label = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    className={`absolute flex items-center justify-center rounded-md text-[9px] font-medium text-neutral-400 ${className ?? ""}`}
  />
);

/* ── 6 схем залов ─────────────────────────────────────────────────── */

const plans: Record<string, Plan> = {
  // 1. Основной зал — классическая компоновка с баром, сценой, гардеробом
  hall: {
    id: "hall",
    label: "Основной зал",
    baseW: BASE_W,
    baseH: BASE_H,
    tables: [
      { id: 1, shape: "rect", x: 16, y: 60, w: 30, h: 50, seats: 4, taken: false },
      { id: 2, shape: "rect", x: 16, y: 128, w: 30, h: 50, seats: 4, taken: true },
      { id: 3, shape: "rect", x: 16, y: 196, w: 30, h: 44, seats: 3, taken: false },
      { id: 4, shape: "round", x: 98, y: 74, w: 46, h: 46, seats: 4, taken: false },
      { id: 5, shape: "round", x: 172, y: 74, w: 46, h: 46, seats: 4, taken: true },
      { id: 6, shape: "round", x: 246, y: 74, w: 38, h: 38, seats: 2, taken: false },
      { id: 7, shape: "round", x: 98, y: 150, w: 40, h: 40, seats: 2, taken: false },
      { id: 8, shape: "round", x: 168, y: 148, w: 46, h: 46, seats: 4, taken: false },
      { id: 9, shape: "round", x: 244, y: 150, w: 40, h: 40, seats: 3, taken: true },
      { id: 10, shape: "rect", x: 98, y: 220, w: 64, h: 34, seats: 6, taken: false },
      { id: 11, shape: "rect", x: 186, y: 220, w: 44, h: 34, seats: 2, taken: false },
    ],
    decor: (
      <>
        <Walls />
        <div className="absolute left-8 top-[6px] h-[14px] w-16 rounded-b-md bg-gradient-to-br from-neutral-50 to-neutral-100" />
        <span className="absolute left-9 top-[18px] text-[9px] font-medium text-neutral-400">
          Вход
        </span>
        <Label className="left-[120px] top-[14px] h-[34px] w-[74px] border border-neutral-200 bg-white/60">
          Гардероб
        </Label>
        <div className="absolute right-[16px] top-[14px] flex h-[38px] w-[104px] items-center justify-center rounded-md bg-neutral-800 text-[10px] font-semibold text-white">
          Бар
        </div>
        <div className="absolute right-[26px] top-[56px] flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-2 w-2 rounded-full bg-neutral-300" />
          ))}
        </div>
        <Label className="right-[16px] top-[150px] h-[38px] w-[40px] border border-neutral-200 bg-white/60">
          WC
        </Label>
        <div className="absolute bottom-[14px] right-[16px] flex h-[52px] w-[120px] items-center justify-center rounded-t-[40px] bg-neutral-200/80 text-[10px] font-semibold text-neutral-500">
          Сцена
        </div>
      </>
    ),
  },

  // 2. VIP — несколько крупных круглых столов, приватная атмосфера
  vip: {
    id: "vip",
    label: "VIP",
    baseW: BASE_W,
    baseH: BASE_H,
    tables: [
      { id: 1, shape: "round", x: 60, y: 70, w: 64, h: 64, seats: 6, taken: false },
      { id: 2, shape: "round", x: 220, y: 70, w: 64, h: 64, seats: 6, taken: true },
      { id: 3, shape: "round", x: 60, y: 170, w: 64, h: 64, seats: 6, taken: false },
      { id: 4, shape: "round", x: 220, y: 170, w: 64, h: 64, seats: 6, taken: false },
      { id: 5, shape: "oval", x: 140, y: 120, w: 80, h: 56, seats: 8, taken: false },
    ],
    decor: (
      <>
        <div className="absolute inset-3 rounded-2xl border-2 border-amber-200/80 bg-amber-50/30" />
        <span className="absolute left-9 top-[18px] text-[9px] font-medium text-amber-700/70">
          Вход
        </span>
        <div className="absolute left-8 top-[6px] h-[14px] w-16 rounded-b-md bg-amber-50/60" />
        <Label className="left-[120px] top-[14px] h-[30px] w-[110px] border border-amber-200 bg-amber-50/50 text-amber-700/70">
          Лаунж-зона
        </Label>
        <div className="absolute right-[20px] top-[14px] flex h-[34px] w-[90px] items-center justify-center rounded-md bg-amber-900/90 text-[10px] font-semibold text-amber-50">
          Дегустационный
        </div>
        <div className="absolute bottom-[16px] left-1/2 flex -translate-x-1/2 gap-6 text-[9px] text-amber-700/50">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
      </>
    ),
  },

  // 3. Терраса — открытая, прямоугольные столы с зонтиками, растения по периметру
  terrace: {
    id: "terrace",
    label: "Терраса",
    baseW: BASE_W,
    baseH: BASE_H,
    tables: [
      { id: 1, shape: "rect", x: 40, y: 60, w: 56, h: 36, seats: 4, taken: false },
      { id: 2, shape: "rect", x: 40, y: 120, w: 56, h: 36, seats: 4, taken: true },
      { id: 3, shape: "rect", x: 40, y: 180, w: 56, h: 36, seats: 4, taken: false },
      { id: 4, shape: "rect", x: 150, y: 60, w: 56, h: 36, seats: 4, taken: false },
      { id: 5, shape: "rect", x: 150, y: 120, w: 56, h: 36, seats: 4, taken: false },
      { id: 6, shape: "rect", x: 150, y: 180, w: 56, h: 36, seats: 4, taken: true },
      { id: 7, shape: "round", x: 264, y: 70, w: 44, h: 44, seats: 4, taken: false },
      { id: 8, shape: "round", x: 264, y: 150, w: 44, h: 44, seats: 4, taken: false },
      { id: 9, shape: "rect", x: 110, y: 232, w: 140, h: 30, seats: 8, taken: false },
    ],
    decor: (
      <>
        <Walls dashed />
        <span className="absolute left-9 top-[18px] text-[9px] font-medium text-emerald-700/70">
          Выход
        </span>
        <div className="absolute left-8 top-[6px] h-[14px] w-16 rounded-b-md bg-emerald-50/60" />
        {/* Зонтики над столами */}
        {[
          { x: 68, y: 54 },
          { x: 68, y: 114 },
          { x: 68, y: 174 },
          { x: 178, y: 54 },
          { x: 178, y: 114 },
          { x: 178, y: 174 },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute h-3 w-3 rounded-full bg-primary/30 ring-2 ring-primary/20"
            style={{ left: p.x, top: p.y, transform: "translate(-50%,-50%)" }}
          />
        ))}
        {/* Растения по периметру */}
        {[
          { x: 14, y: 50 },
          { x: 14, y: 110 },
          { x: 14, y: 170 },
          { x: 330, y: 50 },
          { x: 330, y: 110 },
          { x: 330, y: 170 },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute text-[12px] leading-none"
            style={{ left: p.x, top: p.y, transform: "translate(-50%,-50%)" }}
          >
            🌿
          </span>
        ))}
        <Label className="bottom-[14px] left-[20px] h-[26px] w-[70px] border border-emerald-200 bg-emerald-50/50 text-emerald-700/70">
          Бар-терраса
        </Label>
      </>
    ),
  },

  // 4. Бар — длинная барная стойка со стульями, высокие столы
  bar: {
    id: "bar",
    label: "Бар",
    baseW: BASE_W,
    baseH: BASE_H,
    tables: [
      { id: 1, shape: "rect", x: 30, y: 80, w: 30, h: 30, seats: 2, taken: false },
      { id: 2, shape: "rect", x: 30, y: 130, w: 30, h: 30, seats: 2, taken: true },
      { id: 3, shape: "rect", x: 30, y: 180, w: 30, h: 30, seats: 2, taken: false },
      { id: 4, shape: "round", x: 110, y: 90, w: 34, h: 34, seats: 2, taken: false },
      { id: 5, shape: "round", x: 110, y: 160, w: 34, h: 34, seats: 2, taken: false },
      { id: 6, shape: "round", x: 180, y: 90, w: 34, h: 34, seats: 2, taken: true },
      { id: 7, shape: "round", x: 180, y: 160, w: 34, h: 34, seats: 2, taken: false },
      { id: 8, shape: "rect", x: 250, y: 200, w: 80, h: 34, seats: 4, taken: false },
    ],
    decor: (
      <>
        <Walls />
        <div className="absolute left-8 top-[6px] h-[14px] w-16 rounded-b-md bg-gradient-to-br from-neutral-50 to-neutral-100" />
        <span className="absolute left-9 top-[18px] text-[9px] font-medium text-neutral-400">
          Вход
        </span>
        {/* Длинная барная стойка */}
        <div className="absolute left-[80px] top-[40px] flex h-[200px] w-[26px] items-center justify-center rounded-md bg-neutral-800 text-[9px] font-semibold text-white [writing-mode:vertical-rl]">
          Барная стойка
        </div>
        {/* Стулья у бара */}
        <div className="absolute left-[112px] top-[48px] flex h-[184px] flex-col justify-between">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="h-3 w-3 rounded-full bg-neutral-300" />
          ))}
        </div>
        <Label className="right-[16px] top-[14px] h-[34px] w-[70px] border border-neutral-200 bg-white/60">
          DJ пульт
        </Label>
        <div className="absolute bottom-[14px] right-[16px] flex h-[40px] w-[120px] items-center justify-center rounded-md bg-neutral-200/70 text-[10px] font-semibold text-neutral-500">
          Стойка коктейлей
        </div>
      </>
    ),
  },

  // 5. Лаунж — низкие диваны, прямоугольные lounge-столы, изогнутая компоновка
  lounge: {
    id: "lounge",
    label: "Лаунж",
    baseW: BASE_W,
    baseH: BASE_H,
    tables: [
      { id: 1, shape: "rect", x: 50, y: 70, w: 70, h: 30, seats: 4, taken: false },
      { id: 2, shape: "rect", x: 50, y: 150, w: 70, h: 30, seats: 4, taken: true },
      { id: 3, shape: "rect", x: 145, y: 110, w: 70, h: 30, seats: 4, taken: false },
      { id: 4, shape: "oval", x: 240, y: 70, w: 80, h: 40, seats: 6, taken: false },
      { id: 5, shape: "oval", x: 240, y: 150, w: 80, h: 40, seats: 6, taken: false },
      { id: 6, shape: "rect", x: 110, y: 220, w: 140, h: 28, seats: 6, taken: false },
    ],
    decor: (
      <>
        <div className="absolute inset-3 rounded-[28px] border-2 border-neutral-200 bg-neutral-50/40" />
        <div className="absolute left-8 top-[6px] h-[14px] w-16 rounded-b-md bg-neutral-50/60" />
        <span className="absolute left-9 top-[18px] text-[9px] font-medium text-neutral-400">
          Вход
        </span>
        {/* Диваны (закруглённые блоки) */}
        {[
          { x: 50, y: 50, w: 70 },
          { x: 50, y: 130, w: 70 },
          { x: 145, y: 90, w: 70 },
        ].map((s, i) => (
          <div
            key={i}
            className="absolute h-[10px] rounded-full bg-neutral-300/80"
            style={{ left: s.x, top: s.y, width: s.w }}
          />
        ))}
        <Label className="right-[16px] top-[14px] h-[34px] w-[90px] border border-neutral-200 bg-white/60">
          Чилл-зона
        </Label>
        <div className="absolute bottom-[14px] right-[16px] flex h-[40px] w-[110px] items-center justify-center rounded-full bg-neutral-200/70 text-[10px] font-semibold text-neutral-500">
          Кальянная
        </div>
        <span className="absolute left-[160px] top-[200px] text-[14px] leading-none opacity-50">
          ♪
        </span>
      </>
    ),
  },

  // 6. Приватный кабинет — один большой овальный стол, интимная обстановка
  private: {
    id: "private",
    label: "Приватный",
    baseW: BASE_W,
    baseH: BASE_H,
    tables: [
      { id: 1, shape: "oval", x: 110, y: 110, w: 140, h: 70, seats: 12, taken: false },
      { id: 2, shape: "round", x: 40, y: 60, w: 34, h: 34, seats: 2, taken: false },
      { id: 3, shape: "round", x: 286, y: 60, w: 34, h: 34, seats: 2, taken: false },
      { id: 4, shape: "round", x: 40, y: 196, w: 34, h: 34, seats: 2, taken: true },
      { id: 5, shape: "round", x: 286, y: 196, w: 34, h: 34, seats: 2, taken: false },
    ],
    decor: (
      <>
        <div className="absolute inset-3 rounded-2xl border-2 border-neutral-300 bg-neutral-50/50" />
        <div className="absolute left-1/2 top-[6px] h-[14px] w-20 -translate-x-1/2 rounded-b-md bg-neutral-50/60" />
        <span className="absolute left-1/2 top-[18px] -translate-x-1/2 text-[9px] font-medium text-neutral-400">
          Вход
        </span>
        <Label className="left-[20px] top-[14px] h-[30px] w-[60px] border border-neutral-200 bg-white/60">
          Сервировочная
        </Label>
        <Label className="right-[20px] top-[14px] h-[30px] w-[60px] border border-neutral-200 bg-white/60">
          Медиа
        </Label>
        <div className="absolute bottom-[14px] left-1/2 flex -translate-x-1/2 items-center gap-2 text-[9px] text-neutral-400">
          <span>✦</span> Приватный зал <span>✦</span>
        </div>
      </>
    ),
  },
};

export function getPlan(zone: string): Plan {
  return plans[zone] ?? plans.hall;
}

export const floorZones = Object.keys(plans).map((key) => ({
  key,
  label: plans[key].label,
}));

function chairStyle(rotate: number): CSSProperties {
  return {
    transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
  };
}

function TableFootprint({
  t,
  selected,
  onSelect,
  status,
  mode,
}: {
  t: TableDef;
  selected: boolean;
  onSelect: (id: number) => void;
  status: TableStatus;
  mode: TableMode;
}) {
  const chairColor = selected
    ? "bg-primary/60"
    : status === "reserved"
      ? "bg-amber-300"
      : status === "occupied"
        ? "bg-neutral-400"
        : "bg-neutral-300";

  const chairs: { left: number; top: number; rotate: number }[] = [];
  const gap = 8;
  if (t.shape === "round" || t.shape === "oval") {
    const rx = t.w / 2 + gap;
    const ry = t.h / 2 + gap;
    const cx = t.w / 2;
    const cy = t.h / 2;
    for (let i = 0; i < t.seats; i++) {
      const ang = (i / t.seats) * Math.PI * 2 - Math.PI / 2;
      chairs.push({
        left: cx + Math.cos(ang) * rx,
        top: cy + Math.sin(ang) * ry,
        rotate: (ang * 180) / Math.PI + 90,
      });
    }
  } else {
    const topCount = Math.ceil(t.seats / 2);
    const botCount = t.seats - topCount;
    for (let i = 0; i < topCount; i++) {
      chairs.push({
        left: ((i + 0.5) / topCount) * t.w,
        top: -gap,
        rotate: 0,
      });
    }
    for (let i = 0; i < botCount; i++) {
      chairs.push({
        left: ((i + 0.5) / botCount) * t.w,
        top: t.h + gap,
        rotate: 0,
      });
    }
  }

  const tableClasses = selected
    ? "bg-primary text-white shadow-lg shadow-primary/40"
    : status === "occupied"
      ? "bg-neutral-300 text-neutral-500"
      : status === "reserved"
        ? "bg-amber-100 text-amber-700 ring-2 ring-amber-300"
        : "bg-white text-primary ring-2 ring-primary/70";

  const statusLabel =
    status === "free" ? "свободен" : status === "occupied" ? "занят" : "забронирован";

  const disabled = mode === "select" && status !== "free";

  const shapeClass =
    t.shape === "round" ? "rounded-full" : t.shape === "oval" ? "rounded-[50%]" : "rounded-md";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(t.id);
      }}
      aria-label={`Стол ${t.id}, ${t.seats} мест, ${statusLabel}`}
      className="absolute"
      style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
    >
      {chairs.map((c, i) => (
        <span
          key={i}
          className={`absolute h-[6px] w-[13px] rounded-[3px] ${chairColor}`}
          style={{ left: c.left, top: c.top, ...chairStyle(c.rotate) }}
        />
      ))}
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center text-[10px] font-semibold leading-none transition-all ${tableClasses} ${shapeClass} ${
          selected ? "animate-[pulse-table_1.6s_ease-in-out_infinite]" : ""
        }`}
      >
        {selected ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <>
            <span>T{t.id}</span>
            <span className="text-[8px] opacity-70">{t.seats}p</span>
          </>
        )}
      </span>
    </button>
  );
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const touchDistance = (touches: React.TouchList) => {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
};

export function FloorPlan({
  zone,
  selected,
  onSelect,
  mode = "select",
  statuses,
}: {
  zone: string;
  selected: number | null;
  onSelect: (id: number) => void;
  mode?: TableMode;
  statuses?: Record<number, TableStatus>;
}) {
  const plan = getPlan(zone);
  const statusFor = (t: TableDef): TableStatus =>
    statuses?.[t.id] ?? t.status ?? (t.taken ? "occupied" : "free");
  const [zoom, setZoom] = useState(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Сброс позиции/масштаба при переключении зоны.
  useEffect(() => {
    x.set(0);
    y.set(0);
    setZoom(1);
  }, [zone, x, y]);

  // Pinch-to-zoom: двумя пальцами меняем масштаб.
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const lastTap = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinch.current = { dist: touchDistance(e.touches), scale: zoom };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      const ratio = touchDistance(e.touches) / pinch.current.dist;
      const next = clamp(+(pinch.current.scale * ratio).toFixed(2), 0.8, 2.6);
      setZoom(next);
    }
  };

  const onTouchEnd = () => {
    pinch.current = null;
  };

  // Двойной тап — сброс масштаба/позиции.
  const onViewportClick = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setZoom(1);
      x.set(0);
      y.set(0);
    }
    lastTap.current = now;
  };

  const canPan = zoom > 1;

  return (
    <div className="rounded-3xl bg-white p-4 hairline">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-neutral-900">План зала · {plan.label}</span>
        <span className="flex flex-wrap items-center justify-end gap-2 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-primary/70" />
            Свободно
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            Занято
          </span>
          {mode === "manage" && (
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-200 ring-2 ring-amber-300" />
              Забронирован
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Выбрано
          </span>
        </span>
      </div>

      {/* Viewport — жесты перехватываем сами; вертикальный скролл страницы
          работает только когда масштаб = 1 (touch-action: pan-y). */}
      <div
        className="no-scrollbar relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 ring-1 ring-black/[0.04]"
        style={{ height: BASE_H + 16, touchAction: canPan ? "none" : "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onViewportClick}
      >
        <motion.div
          className="absolute left-0 top-0 cursor-grab active:cursor-grabbing"
          style={{
            width: plan.baseW,
            height: plan.baseH,
            scale: zoom,
            x,
            y,
            originX: 0,
            originY: 0,
          }}
          drag={canPan}
          dragConstraints={{
            left: -(plan.baseW * (zoom - 1)),
            right: 0,
            top: -(plan.baseH * (zoom - 1)),
            bottom: 0,
          }}
          dragElastic={0.06}
          dragTransition={{ power: 0.2, timeConstant: 200 }}
        >
          {plan.decor}
          {plan.tables.map((t) => (
            <TableFootprint
              key={t.id}
              t={t}
              selected={selected === t.id}
              onSelect={onSelect}
              status={statusFor(t)}
              mode={mode}
            />
          ))}
        </motion.div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-full bg-white/90 shadow-md ring-1 ring-black/5 backdrop-blur">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => clamp(+(z + 0.2).toFixed(2), 0.8, 2.6));
            }}
            className="grid h-8 w-8 place-items-center text-neutral-700 active:bg-neutral-100"
            aria-label="Приблизить"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="h-px w-full bg-neutral-200" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => {
                const next = clamp(+(z - 0.2).toFixed(2), 0.8, 2.6);
                if (next <= 1) {
                  x.set(0);
                  y.set(0);
                }
                return next;
              });
            }}
            className="grid h-8 w-8 place-items-center text-neutral-700 active:bg-neutral-100"
            aria-label="Отдалить"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Hint */}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-medium text-neutral-400 backdrop-blur">
          щипок — зум · двойной тап — сброс
        </span>
      </div>

      {mode === "select" &&
        selected != null &&
        (() => {
          const t = plan.tables.find((tb) => tb.id === selected);
          if (!t) return null;
          const status = statusFor(t);
          const statusLabel =
            status === "free" ? "Свободно" : status === "occupied" ? "Занят" : "Забронирован";
          return (
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
              <div>
                <p className="text-[11px] text-neutral-500">Выбранный стол</p>
                <p className="text-sm font-semibold text-neutral-900">
                  Стол T{selected} · {t.seats} мест
                </p>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white">
                {statusLabel}
              </span>
            </div>
          );
        })()}
    </div>
  );
}
