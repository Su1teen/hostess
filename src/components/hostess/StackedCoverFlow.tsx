import { useState } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronRight } from "lucide-react";

export type StackedCoverFlowItem = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  meta: string;
  badge?: string;
  onClick: () => void;
};

function circularOffset(index: number, activeIndex: number, length: number) {
  let offset = index - activeIndex;
  const midpoint = length / 2;

  if (offset > midpoint) offset -= length;
  if (offset < -midpoint) offset += length;

  return offset;
}

export function StackedCoverFlow({ items }: { items: StackedCoverFlowItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const move = (direction: -1 | 1) => {
    if (items.length < 2) return;
    setActiveIndex((current) => (current + direction + items.length) % items.length);
  };

  const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.x < -42 || info.velocity.x < -350) move(1);
    if (info.offset.x > 42 || info.velocity.x > 350) move(-1);
  };

  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden pb-1">
      <div className="relative mx-auto aspect-[10/16] w-[65vw] min-w-[240px] max-w-[280px] [perspective:1000px]">
        {items.map((item, index) => {
          const offset = circularOffset(index, activeIndex, items.length);
          const distance = Math.abs(offset);

          if (distance > 2) return null;

          const isActive = offset === 0;

          return (
            <motion.button
              key={item.id}
              type="button"
              drag={isActive && items.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.24}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              onTap={() => {
                if (isActive) item.onClick();
                else move(offset > 0 ? 1 : -1);
              }}
              initial={false}
              animate={{
                x: offset * 68,
                y: distance * 9,
                scale: 1 - distance * 0.085,
                rotateY: offset * -4,
                opacity: distance === 2 ? 0.68 : 1,
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 330, damping: 31, mass: 0.82 }
              }
              whileTap={isActive ? { scale: 0.985 } : undefined}
              className="absolute inset-0 touch-pan-y overflow-hidden rounded-[30px] bg-neutral-900 text-left shadow-[0_24px_55px_-24px_rgba(15,23,42,0.68)]"
              style={{ zIndex: 10 - distance }}
              aria-label={isActive ? `Открыть ${item.title}` : `Показать ${item.title}`}
            >
              <img
                src={item.image}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full select-none object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-black/10" />

              {item.badge && (
                <span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-normal text-white shadow-sm">
                  {item.badge}
                </span>
              )}

              <span className="absolute inset-x-4 bottom-4 text-white">
                <span className="block text-[20px] font-normal leading-[1.15] tracking-[-0.02em]">
                  {item.title}
                </span>
                <span className="mt-1.5 block truncate text-[13px] font-light text-white/76">
                  {item.subtitle}
                </span>
                <span className="mt-3 inline-flex min-h-8 items-center gap-1 rounded-full bg-white/18 px-3 text-xs font-normal text-white backdrop-blur-md">
                  {item.meta}
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="mt-1 flex min-h-8 items-center justify-center">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="grid h-11 w-11 place-items-center"
              aria-label={`Показать карточку ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <span
                className={
                  index === activeIndex
                    ? "h-2 w-7 rounded-full bg-orange-500 transition-all"
                    : "h-2 w-2 rounded-full bg-neutral-300 transition-all"
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
