import { useRef, useState } from "react";
import type { Availability } from "@/lib/guest-api";

export function GuestFloor({
  hall,
  selected,
  onSelect,
}: {
  hall: Availability;
  selected: string[];
  onSelect: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 });
  const points = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ distance: 0, zoom: 1, x: 0, y: 0, pan: { x: 0, y: 0 }, moved: false });
  const svgRef = useRef<SVGSVGElement>(null);
  const capZoom = (n: number) => Math.max(1, Math.min(2.5, n));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="t-micro">Зал XOXO · выберите стол</p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Уменьшить карту"
            className="h-11 w-11 rounded-full bg-surface"
            onClick={() => {
              setZoom(capZoom(zoom - 0.25));
              setPan({ x: 0, y: 0 });
            }}
          >
            −
          </button>
          <button
            type="button"
            aria-label="Увеличить карту"
            className="h-11 w-11 rounded-full bg-surface"
            onClick={() => setZoom(capZoom(zoom + 0.25))}
          >
            +
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-line bg-surface">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${hall.width} ${hall.height}`}
          className="block w-full"
          style={{ touchAction: "none" }}
          role="img"
          aria-label="Карта зала. Доступный список столов ниже."
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            const p = [...points.current.values()];
            gesture.current = {
              distance: p.length === 2 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0,
              zoom,
              x: e.clientX,
              y: e.clientY,
              pan,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            if (!points.current.has(e.pointerId)) return;
            points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            const p = [...points.current.values()];
            const g = gesture.current;
            if (p.length === 2 && g.distance) {
              g.moved = true;
              setZoom(
                capZoom((g.zoom * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)) / g.distance),
              );
            } else if (p.length === 1 && zoom > 1) {
              const ratio =
                hall.width / (svgRef.current?.getBoundingClientRect().width ?? hall.width);
              const dx = (e.clientX - g.x) * ratio,
                dy = (e.clientY - g.y) * ratio;
              if (Math.abs(dx) + Math.abs(dy) > 5) g.moved = true;
              setPan({
                x: Math.max(
                  (-hall.width * (zoom - 1)) / 2,
                  Math.min((hall.width * (zoom - 1)) / 2, g.pan.x + dx),
                ),
                y: Math.max(
                  (-hall.height * (zoom - 1)) / 2,
                  Math.min((hall.height * (zoom - 1)) / 2, g.pan.y + dy),
                ),
              });
            }
          }}
          onPointerUp={(e) => points.current.delete(e.pointerId)}
          onPointerCancel={() => points.current.clear()}
        >
          <g
            transform={`translate(${hall.width / 2 + pan.x} ${hall.height / 2 + pan.y}) scale(${zoom}) translate(${-hall.width / 2} ${-hall.height / 2})`}
          >
            <rect
              x="18"
              y="18"
              width={hall.width - 36}
              height={hall.height - 36}
              rx="32"
              fill="none"
              stroke="#deded5"
            />
            {hall.screens.map((s) => (
              <g key={s.id}>
                <rect x={s.x} y={s.y} width="38" height="14" rx="4" fill="#646957" />
                <text x={s.x + 19} y={s.y - 8} textAnchor="middle" fontSize="11" fill="#74776c">
                  TV
                </text>
              </g>
            ))}
            <text x="80" y="480" fontSize="15" fill="#97998e">
              Вход ↗
            </text>
            {hall.tables.map((t) => (
              <g
                key={t.id}
                onClick={() => {
                  if (t.available && !gesture.current.moved) onSelect(t.id);
                }}
                style={{ cursor: t.available ? "pointer" : "default" }}
              >
                <rect
                  x={t.x - 8}
                  y={t.y - 8}
                  width={t.w + 16}
                  height={t.h + 16}
                  rx={t.shape === "round" ? 45 : 18}
                  fill={selected.includes(t.id) ? "#d7deca" : "#f4f3ed"}
                />
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  rx={t.shape === "round" ? t.w / 2 : 12}
                  fill={selected.includes(t.id) ? "#525e43" : t.available ? "#e5e8dd" : "#e6e2dd"}
                  stroke={selected.includes(t.id) ? "#525e43" : "#d2d5ca"}
                />
                <text
                  x={t.x + t.w / 2}
                  y={t.y + t.h / 2 - 3}
                  textAnchor="middle"
                  fill={selected.includes(t.id) ? "white" : "#484d41"}
                  fontSize="17"
                >
                  {t.label}
                </text>
                <text
                  x={t.x + t.w / 2}
                  y={t.y + t.h / 2 + 16}
                  textAnchor="middle"
                  fill={selected.includes(t.id) ? "#dee5d3" : "#7b7d74"}
                  fontSize="11"
                >
                  {t.seats} мест
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <p className="text-xs text-ink-3">
        Увеличьте двумя пальцами. Для группы можно выбрать соседние столы ряда A или B.
      </p>
      <div className="grid grid-cols-2 gap-2" aria-label="Выбор стола">
        {hall.tables.map((t) => (
          <button
            type="button"
            key={t.id}
            disabled={!t.available}
            aria-pressed={selected.includes(t.id)}
            onClick={() => onSelect(t.id)}
            className={`min-h-11 rounded-xl px-3 py-3 text-left text-sm disabled:opacity-40 ${selected.includes(t.id) ? "bg-ink text-white" : "bg-surface text-ink"}`}
          >
            {t.label} · {t.seats} мест{" "}
            <span className="block text-xs opacity-70">{t.available ? "Свободен" : "Занят"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
