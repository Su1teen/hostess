import { useState, type CSSProperties } from "react";
import { Plus, Minus, Check } from "lucide-react";

/**
 * Realistic restaurant floor plan.
 * Base canvas is 360x290 px; tables/zones are absolutely positioned.
 * Zoom scales the inner canvas inside a scrollable viewport.
 */

type TableDef = {
  id: number;
  shape: "round" | "rect";
  x: number; // top-left of table box (px, base canvas)
  y: number;
  w: number;
  h: number;
  seats: number;
  taken: boolean;
};

const BASE_W = 360;
const BASE_H = 290;

const tables: TableDef[] = [
  // Left-wall booths (banquettes)
  { id: 1, shape: "rect", x: 16, y: 60, w: 30, h: 50, seats: 4, taken: false },
  { id: 2, shape: "rect", x: 16, y: 128, w: 30, h: 50, seats: 4, taken: true },
  { id: 3, shape: "rect", x: 16, y: 196, w: 30, h: 44, seats: 3, taken: false },
  // Central round tables
  { id: 4, shape: "round", x: 98, y: 74, w: 46, h: 46, seats: 4, taken: false },
  { id: 5, shape: "round", x: 172, y: 74, w: 46, h: 46, seats: 4, taken: true },
  { id: 6, shape: "round", x: 246, y: 74, w: 38, h: 38, seats: 2, taken: false },
  { id: 7, shape: "round", x: 98, y: 150, w: 40, h: 40, seats: 2, taken: false },
  { id: 8, shape: "round", x: 168, y: 148, w: 46, h: 46, seats: 4, taken: false },
  { id: 9, shape: "round", x: 244, y: 150, w: 40, h: 40, seats: 3, taken: true },
  // Long shared tables (bottom)
  { id: 10, shape: "rect", x: 98, y: 220, w: 64, h: 34, seats: 6, taken: false },
  { id: 11, shape: "rect", x: 186, y: 220, w: 44, h: 34, seats: 2, taken: false },
];

function chairStyle(rotate: number): CSSProperties {
  return {
    transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
  };
}

function TableFootprint({
  t,
  selected,
  onSelect,
}: {
  t: TableDef;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const chairColor = t.taken
    ? "bg-neutral-300"
    : selected
      ? "bg-primary/60"
      : "bg-neutral-300";

  const chairs: { left: number; top: number; rotate: number }[] = [];
  const gap = 8; // distance from table edge to chair centre
  if (t.shape === "round") {
    const r = t.w / 2 + gap;
    const cx = t.w / 2;
    const cy = t.h / 2;
    for (let i = 0; i < t.seats; i++) {
      const ang = (i / t.seats) * Math.PI * 2 - Math.PI / 2;
      chairs.push({
        left: cx + Math.cos(ang) * r,
        top: cy + Math.sin(ang) * r,
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

  const tableClasses = t.taken
    ? "bg-neutral-300 text-neutral-500"
    : selected
      ? "bg-primary text-white shadow-lg shadow-primary/40"
      : "bg-white text-primary ring-2 ring-primary/70";

  return (
    <button
      type="button"
      disabled={t.taken}
      onClick={() => onSelect(t.id)}
      aria-label={`Стол ${t.id}, ${t.seats} мест, ${t.taken ? "занят" : "свободен"}`}
      className="absolute"
      style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
    >
      {/* chairs */}
      {chairs.map((c, i) => (
        <span
          key={i}
          className={`absolute h-[6px] w-[13px] rounded-[3px] ${chairColor}`}
          style={{ left: c.left, top: c.top, ...chairStyle(c.rotate) }}
        />
      ))}
      {/* table surface */}
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center text-[10px] font-semibold leading-none transition-all ${tableClasses} ${
          t.shape === "round" ? "rounded-full" : "rounded-md"
        } ${selected ? "animate-[pulse-table_1.6s_ease-in-out_infinite]" : ""}`}
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

export function FloorPlan({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="rounded-3xl bg-white p-4 hairline">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-neutral-900">План зала</span>
        <span className="flex items-center gap-3 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            Занято
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-primary/70" />
            Свободно
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Выбрано
          </span>
        </span>
      </div>

      {/* Viewport */}
      <div className="no-scrollbar relative overflow-auto rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 ring-1 ring-black/[0.04]">
        <div
          className="relative"
          style={{
            width: BASE_W * zoom,
            height: BASE_H * zoom,
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: BASE_W, height: BASE_H, transform: `scale(${zoom})` }}
          >
            {/* Room walls */}
            <div className="absolute inset-3 rounded-xl border-2 border-neutral-200" />

            {/* Entrance opening (top-left) */}
            <div className="absolute left-8 top-[6px] h-[14px] w-16 rounded-b-md bg-gradient-to-br from-neutral-50 to-neutral-100" />
            <span className="absolute left-9 top-[18px] text-[9px] font-medium text-neutral-400">
              Вход
            </span>

            {/* Гардероб */}
            <div className="absolute left-[120px] top-[14px] flex h-[34px] w-[74px] items-center justify-center rounded-md border border-neutral-200 bg-white/60 text-[9px] font-medium text-neutral-400">
              Гардероб
            </div>

            {/* Бар */}
            <div className="absolute right-[16px] top-[14px] flex h-[38px] w-[104px] items-center justify-center rounded-md bg-neutral-800 text-[10px] font-semibold text-white">
              Бар
            </div>
            <div className="absolute right-[26px] top-[56px] flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-neutral-300" />
              ))}
            </div>

            {/* WC */}
            <div className="absolute right-[16px] top-[150px] flex h-[38px] w-[40px] items-center justify-center rounded-md border border-neutral-200 bg-white/60 text-[9px] font-medium text-neutral-400">
              WC
            </div>

            {/* Сцена */}
            <div className="absolute bottom-[14px] right-[16px] flex h-[52px] w-[120px] items-center justify-center rounded-t-[40px] bg-neutral-200/80 text-[10px] font-semibold text-neutral-500">
              Сцена
            </div>

            {/* Tables */}
            {tables.map((t) => (
              <TableFootprint
                key={t.id}
                t={t}
                selected={selected === t.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-full bg-white/90 shadow-md ring-1 ring-black/5 backdrop-blur">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.2).toFixed(2)))}
            className="grid h-8 w-8 place-items-center text-neutral-700 active:bg-neutral-100"
            aria-label="Приблизить"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="h-px w-full bg-neutral-200" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(2)))}
            className="grid h-8 w-8 place-items-center text-neutral-700 active:bg-neutral-100"
            aria-label="Отдалить"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selected != null && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
          <div>
            <p className="text-[11px] text-neutral-500">Выбранный стол</p>
            <p className="text-sm font-semibold text-neutral-900">
              Стол T{selected} ·{" "}
              {tables.find((t) => t.id === selected)?.seats} места
            </p>
          </div>
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white">
            Свободно
          </span>
        </div>
      )}
    </div>
  );
}
