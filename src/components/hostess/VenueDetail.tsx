import { useRef, useState, type ReactNode, type RefObject } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Heart, Share } from "lucide-react";
import { toast } from "sonner";
import { hapticSelect } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Dock, IconButton, Photo, sheetSpring } from "./system";

/**
 * Full-screen venue detail shell:
 * cinematic swipeable hero with parallax → content sheet that rises over
 * the photo → collapsing title bar → docked primary action.
 */
export function VenueDetailShell({
  name,
  images,
  onClose,
  heroOverlay,
  topRight,
  dock,
  children,
  heroShade = "light",
  scrollRef: externalRef,
}: {
  name: string;
  images: string[];
  onClose: () => void;
  heroOverlay?: ReactNode;
  topRight?: ReactNode;
  dock?: ReactNode;
  children: ReactNode;
  heroShade?: "light" | "mood";
  scrollRef?: RefObject<HTMLDivElement | null>;
}) {
  const localRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalRef ?? localRef;
  const { scrollY } = useScroll({ container: scrollRef });
  const heroY = useTransform(scrollY, [0, 520], [0, 180]);
  const heroFade = useTransform(scrollY, [0, 420], [1, 0.55]);
  const barOpacity = useTransform(scrollY, [300, 380], [0, 1]);
  const [page, setPage] = useState(0);
  const [saved, setSaved] = useState(false);

  const share = async () => {
    hapticSelect();
    try {
      if (navigator.share) await navigator.share({ title: name, text: `${name} — в Hostess` });
      else toast("Ссылка на место скопирована");
    } catch {
      /* пользователь закрыл системный диалог */
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={sheetSpring}
      className="absolute inset-0 z-[100] flex flex-col overflow-hidden bg-canvas"
    >
      {/* Collapsed title bar */}
      <motion.div
        style={{ opacity: barOpacity }}
        className="pointer-events-none absolute inset-x-0 top-0 z-20 border-b border-line bg-[color-mix(in_oklab,var(--hs-canvas)_88%,transparent)] pt-safe backdrop-blur-xl"
      >
        <p
          className={cn(
            "truncate pb-3 pt-2.5 text-center text-[16px] font-semibold tracking-[-0.015em]",
            topRight ? "pl-20 pr-44" : "px-20",
          )}
        >
          {name}
        </p>
      </motion.div>

      {/* Persistent controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-safe">
        <IconButton
          icon={ChevronDown}
          label="Закрыть"
          variant="photo"
          onClick={onClose}
          className="pointer-events-auto"
          iconSize={20}
        />
        <div className="pointer-events-auto flex items-center gap-2">
          {topRight}
          <IconButton icon={Share} label="Поделиться" variant="photo" onClick={share} />
          <motion.div animate={saved ? { scale: [1, 1.18, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
            <IconButton
              icon={Heart}
              label={saved ? "Убрать из избранного" : "В избранное"}
              variant="photo"
              onClick={() => {
                hapticSelect();
                setSaved((s) => !s);
                toast(saved ? "Убрано из избранного" : "Сохранено в избранное");
              }}
              className={saved ? "[&_svg]:fill-ink" : undefined}
            />
          </motion.div>
        </div>
      </div>

      <div ref={scrollRef} className="no-scrollbar relative flex-1 overflow-y-auto overscroll-none">
        {/* Hero */}
        <div className="relative h-[min(60vh,500px)] min-h-[380px] overflow-hidden bg-stone">
          <motion.div style={{ y: heroY, opacity: heroFade }} className="absolute inset-0">
            <div
              className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
              onScroll={(e) => {
                const el = e.currentTarget;
                setPage(Math.round(el.scrollLeft / el.clientWidth));
              }}
            >
              {images.map((src, i) => (
                <Photo key={src + i} src={src} eager={i === 0} className="h-full w-full shrink-0 snap-center" />
              ))}
            </div>
          </motion.div>
          <div
            className={cn(
              "pointer-events-none absolute inset-0",
              heroShade === "mood"
                ? "bg-gradient-to-b from-black/45 via-black/10 to-black/70"
                : "bg-gradient-to-b from-black/30 via-transparent to-black/25",
            )}
          />
          {images.length > 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ width: i === page ? 18 : 6, opacity: i === page ? 1 : 0.55 }}
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  className="h-[5px] rounded-full bg-white"
                />
              ))}
            </div>
          )}
          {heroOverlay && <div className="pointer-events-none absolute inset-x-0 bottom-14">{heroOverlay}</div>}
        </div>

        <div className="relative z-10 -mt-8 min-h-[60vh] rounded-t-hero bg-canvas pb-12 pt-7">
          {children}
        </div>
      </div>

      {dock && <Dock>{dock}</Dock>}
    </motion.div>
  );
}

/** Three calm facts separated by hairlines (rating · check · hours). */
export function FactsRow({ facts }: { facts: { label: string; value: ReactNode; sub?: ReactNode }[] }) {
  return (
    <div className="mx-5 grid grid-cols-3 divide-x divide-line border-y border-line py-4">
      {facts.map((f) => (
        <div key={f.label} className="px-3 first:pl-0 last:pr-0">
          <p className="t-micro">{f.label}</p>
          <p className="t-num mt-1.5 truncate text-[15px] font-semibold tracking-[-0.01em]">{f.value}</p>
          {f.sub && <p className="t-num mt-0.5 truncate text-[11.5px] text-ink-3">{f.sub}</p>}
        </div>
      ))}
    </div>
  );
}
