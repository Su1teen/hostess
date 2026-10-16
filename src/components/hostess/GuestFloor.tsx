import type { Availability, AvailabilityResource } from "@/lib/guest-api";

function reasonLabel(resource: AvailabilityResource) {
  if (resource.unavailableReason === "legacy_mapping") return "Доступность уточняется";
  if (resource.unavailableReason === "capacity") return "Недостаточно мест для вашей компании";
  if (resource.unavailableReason === "not_verified") return "Требует проверки";
  if (resource.unavailableReason === "occupied") return "Занято на это время";
  return "Временно недоступно";
}

export function GuestFloor({
  hall,
  selected,
  selectedZoneId,
  guests,
  onSelect,
  onAutoSelect,
}: {
  hall: Availability;
  selected: string | null;
  selectedZoneId: string | null;
  guests: number;
  onSelect: (id: string) => void;
  onAutoSelect: (zoneId: string) => void;
}) {
  return (
    <div className="space-y-3" aria-label="Зоны и доступные места XOXO">
      <p className="t-micro">Зоны XOXO · доступность на выбранное время</p>
      {hall.zones?.map((zone) => {
        const canAuto = zone.resources.some(
          (resource) =>
            resource.bookable &&
            resource.available &&
            resource.capacity !== null &&
            resource.capacity >= guests,
        );
        const autoSelected = selectedZoneId === zone.id && selected === null;
        return (
          <section key={zone.id} className="rounded-[22px] border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-ink">{zone.name}</h3>
                {zone.description && (
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">{zone.description}</p>
                )}
              </div>
              {zone.resources.length > 0 && (
                <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-[11px] text-ink-3">
                  {zone.resources.length} варианта
                </span>
              )}
            </div>
            {canAuto && (
              <button
                type="button"
                aria-pressed={autoSelected}
                onClick={() => onAutoSelect(zone.id)}
                className={`mt-3 min-h-11 w-full rounded-xl border px-3 text-sm font-medium transition-colors motion-reduce:transition-none ${
                  autoSelected
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-background text-ink"
                }`}
              >
                {autoSelected ? "Автоподбор выбран" : "Подобрать место в этой зоне"}
              </button>
            )}
            {zone.resources.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                {zone.resources.map((resource) => {
                  const fits = resource.capacity !== null && resource.capacity >= guests;
                  const enabled = resource.bookable && resource.available && fits;
                  const active = selected === resource.id;
                  return (
                    <button
                      key={resource.id}
                      type="button"
                      disabled={!enabled}
                      aria-pressed={active}
                      onClick={() => onSelect(resource.id)}
                      className={`min-h-[92px] rounded-2xl border p-3 text-left transition-colors motion-reduce:transition-none ${
                        active
                          ? "border-ink bg-ink text-white"
                          : enabled
                            ? "border-line bg-background text-ink hover:border-ink/40"
                            : "border-line bg-background/70 text-ink-3 opacity-70"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-medium">{resource.name}</span>
                        <span className={`text-xs ${active ? "text-white/75" : "text-ink-3"}`}>
                          {resource.capacity} мест
                        </span>
                      </span>
                      <span
                        className={`mt-2 block text-xs ${active ? "text-white/75" : "text-ink-3"}`}
                      >
                        {enabled ? "Свободно · можно выбрать" : reasonLabel(resource)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-background px-3 py-2.5 text-xs leading-relaxed text-ink-3">
                Зона внесена в систему. Индивидуальные места появятся после сверки реальной
                расстановки; сейчас автоматическая бронь здесь недоступна.
              </p>
            )}
          </section>
        );
      })}
      {!hall.zones?.length && (
        <p className="rounded-2xl bg-surface p-4 text-sm text-ink-3" role="status">
          Схема мест пока не загружена. Доступность брони не подтверждена.
        </p>
      )}
    </div>
  );
}
