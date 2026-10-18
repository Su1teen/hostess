import { cn } from "@/lib/utils";
import { useOccupancy } from "@/hooks/useOccupancy";
import { useNow } from "@/hooks/useNow";
import { OccupancyRing, toneColor, occupancyLevel } from "./system";
import { freshness, liveSignal, statusText } from "./venue";

function OccupancyPanel({
  id,
  className,
  compact = false,
}: {
  id: string;
  className?: string;
  compact?: boolean;
}) {
  const { signals, isPending, isError } = useOccupancy();
  const now = useNow(15_000);
  const signal = liveSignal(id, now, signals[id]);
  const fresh = signal.source === "verified";
  const hasOccupancy = signal.occupancy >= 0;
  const observation = signal.observation;
  const capacity = fresh ? observation?.capacity : undefined;
  const occupied = fresh ? observation?.occupiedUnits : undefined;
  const { tone } = occupancyLevel(signal.occupancy);
  return (
    <section
      className={cn("rounded-[22px] border border-line bg-stone/45 p-4", className)}
      aria-label="Загрузка заведения"
    >
      <div className="flex items-center gap-3.5">
        <OccupancyRing value={signal.occupancy} size={compact ? 46 : 54} stroke={3}>
          <span className="t-num text-[13px] font-semibold">
            {hasOccupancy ? `${signal.occupancy}%` : "—"}
          </span>
        </OccupancyRing>
        <div className="min-w-0 flex-1">
          <p className="t-micro">{fresh ? "Занято столов сейчас" : "Загрузка заведения"}</p>
          <p className="mt-1 text-[14px] font-semibold">
            {isPending && id === "xoxo" ? "Обновляем данные зала…" : statusText(signal)}
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3">
            {isError && id === "xoxo" && !fresh
              ? "Связь с заведением временно недоступна"
              : freshness(signal)}
          </p>
        </div>
      </div>
      {fresh && capacity !== undefined && occupied !== undefined && capacity > 0 && (
        <div className="mt-4">
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: Math.min(capacity, 30) }, (_, index) => (
              <span
                key={index}
                className="h-5 min-w-0 flex-1 rounded-[4px]"
                style={{
                  background:
                    index / Math.min(capacity, 30) < occupied / capacity
                      ? toneColor[tone]
                      : "rgb(17 18 20 / 0.07)",
                }}
              />
            ))}
          </div>
          <p className="mt-2 flex justify-between gap-3 text-[11.5px] text-ink-2">
            <span>
              {occupied} из {capacity} столов занято
            </span>
            <span>По данным персонала</span>
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
            Свободные столы могут быть забронированы. Доступность проверяется при бронировании.
          </p>
        </div>
      )}
      {!hasOccupancy && !compact && (
        <p className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-3">
          Когда заведение подтвердит загрузку, здесь появится состояние зала. Доступность
          бронирования проверяется отдельно.
        </p>
      )}
    </section>
  );
}

/** Compatible with venue shells; static values are never presented as live observations. */
export function LiveNow({
  id,
  className,
}: {
  id: string;
  occupancy?: number;
  peakHours?: string;
  className?: string;
}) {
  return <OccupancyPanel id={id} className={className} compact />;
}
export function VenueStats({
  venueId = "xoxo",
  className,
}: {
  venueId?: string;
  occupancy?: number;
  peakHours?: string;
  title?: string;
  className?: string;
}) {
  return <OccupancyPanel id={venueId} className={className} />;
}
