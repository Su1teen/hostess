import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import type { LiveMedia } from "@/data/hostess";
import { cn } from "@/lib/utils";
import { Photo, tapSpring } from "./system";

/* ──────────────────────────────────────────────────────────────────────
   Live ambience media. Rules:
   - one decoder at a time: a <video> is mounted only for the element that
     currently owns playback; everything else shows its poster;
   - an open venue detail takes focus, so background drum cards pause;
   - reduced-motion / data-saver users get the poster only.
   ────────────────────────────────────────────────────────────────────── */

let focusDepth = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Claim media focus (detail screens). Background players pause while held. */
export function useClaimMediaFocus() {
  useEffect(() => {
    focusDepth += 1;
    emit();
    return () => {
      focusDepth -= 1;
      emit();
    };
  }, []);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** True while some foreground surface (venue detail) owns media. */
export const useMediaFocusHeld = () =>
  useSyncExternalStore(
    subscribe,
    () => focusDepth > 0,
    () => false,
  );

function useCanAutoplay() {
  const reduce = useReducedMotion();
  const [saveData, setSaveData] = useState(false);
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setSaveData(Boolean(c?.saveData));
  }, []);
  return !reduce && !saveData;
}

/**
 * Poster-first ambience video. `active` decides whether a decoder exists at
 * all; the clip fades in only once frames are actually playing, so there is
 * never a black flash or a spinner.
 */
export function AmbienceVideo({
  media,
  active,
  muted = true,
  className,
  eagerPoster,
  onPlaying,
}: {
  media: LiveMedia;
  active: boolean;
  muted?: boolean;
  className?: string;
  eagerPoster?: boolean;
  onPlaying?: (playing: boolean) => void;
}) {
  const canAutoplay = useCanAutoplay();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const mount = active && canAutoplay;
  const onPlayingRef = useRef(onPlaying);
  onPlayingRef.current = onPlaying;

  useEffect(() => {
    if (!mount) {
      setPlaying(false);
      onPlayingRef.current?.(false);
    }
  }, [mount]);

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  return (
    <span className={cn("relative block overflow-hidden bg-stone", className)}>
      <Photo src={media.poster} className="absolute inset-0 h-full w-full" eager={eagerPoster} />
      {mount && (
        <video
          ref={ref}
          src={media.src}
          poster={media.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-hidden
          onPlaying={() => {
            setPlaying(true);
            onPlayingRef.current?.(true);
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            playing ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </span>
  );
}

/** Discreet state label: "LIVE" for streams, "Сейчас · 6 мин" for recent clips. */
export function LiveBadge({
  media,
  playing = true,
  className,
  tone = "photo",
}: {
  media: LiveMedia;
  playing?: boolean;
  className?: string;
  tone?: "photo" | "plain";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[10.5px] font-semibold tracking-[0.08em]",
        tone === "photo" ? "bg-black/35 text-white backdrop-blur-md" : "bg-stone text-ink",
        className,
      )}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        {media.isLive && playing && (
          <span
            className="absolute inset-0 rounded-full bg-[#ff3b30]"
            style={{ animation: "hs-live-pulse 2s var(--ease-out-quint) infinite" }}
          />
        )}
        <span className={cn("relative h-full w-full rounded-full", media.isLive ? "bg-[#ff3b30]" : "bg-white/80")} />
      </span>
      {media.isLive ? "LIVE" : <span className="normal-case tracking-normal">Сейчас · {media.updatedMin} мин</span>}
    </span>
  );
}

export function MuteToggle({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      transition={tapSpring}
      onClick={onToggle}
      aria-label={muted ? "Включить звук" : "Выключить звук"}
      className="grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={muted ? "off" : "on"}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.15 }}
        >
          {muted ? <VolumeX className="h-4 w-4" strokeWidth={1.8} /> : <Volume2 className="h-4 w-4" strokeWidth={1.8} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
