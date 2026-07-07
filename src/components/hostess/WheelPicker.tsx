import { useEffect, useRef } from "react";

const ITEM_H = 36;
const VISIBLE = 5; // нечётное — выбранный ряд по центру

/**
 * iOS-style барабан (как в будильнике): scroll-snap + затухание/сжатие
 * рядов по мере удаления от центра.
 */
export function WheelPicker({
  options,
  value,
  onChange,
  label,
}: {
  options: string[];
  value: number;
  onChange: (index: number) => void;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number>(0);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pad = (ITEM_H * (VISIBLE - 1)) / 2;

  // Позиционируем на текущее значение при монтировании.
  useEffect(() => {
    ref.current?.scrollTo({ top: value * ITEM_H });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup: отменяем все pending анимации и таймеры при размонтировании.
  useEffect(() => {
    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(settle.current);
    };
  }, []);


  const paint = () => {
    const el = ref.current;
    if (!el) return;
    const center = el.scrollTop + pad + ITEM_H / 2;
    el.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
      const rowCenter = row.offsetTop + ITEM_H / 2;
      const d = Math.min(Math.abs(rowCenter - center) / (ITEM_H * 2.2), 1);
      row.style.opacity = String(1 - d * 0.78);
      row.style.transform = `rotateX(${d * 38}deg) scale(${1 - d * 0.14})`;
    });
  };

  useEffect(() => {
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const handleScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(paint);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const idx = Math.max(0, Math.min(options.length - 1, Math.round(el.scrollTop / ITEM_H)));
      if (idx !== value) onChange(idx);
    }, 90);
  };

  return (
    <div className="flex-1">
      {label && (
        <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          {label}
        </p>
      )}
      <div className="relative" style={{ height: ITEM_H * VISIBLE }}>
        {/* Подсветка выбранного ряда */}
        <div
          className="pointer-events-none absolute inset-x-1 z-0 rounded-xl bg-neutral-100"
          style={{ top: pad, height: ITEM_H }}
        />
        {/* Градиентные маски сверху/снизу */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-white to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-white to-transparent" />

        <div
          ref={ref}
          onScroll={handleScroll}
          className="no-scrollbar relative z-10 h-full snap-y snap-mandatory overflow-y-auto"
          style={{ perspective: "600px" }}
        >
          <div style={{ height: pad }} />
          {options.map((opt, i) => (
            <button
              key={`${opt}-${i}`}
              type="button"
              data-row
              onClick={() => {
                ref.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
              }}
              className={`flex w-full snap-center items-center justify-center text-[15px] transition-colors ${
                i === value ? "font-semibold text-neutral-900" : "font-normal text-neutral-500"
              }`}
              style={{ height: ITEM_H }}
            >
              {opt}
            </button>
          ))}
          <div style={{ height: pad }} />
        </div>
      </div>
    </div>
  );
}
