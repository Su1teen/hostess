import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  categories,
  cityEvents,
  money,
  restaurants,
  venues,
  type CityEvent,
  type Restaurant,
  type Venue,
} from "@/data/hostess";
import { EventTicketModal } from "@/components/hostess/EventTicketModal";
import { VenueBookingModal } from "@/components/hostess/VenueBookingModal";
import { StackedCoverFlow, type StackedCoverFlowItem } from "@/components/hostess/StackedCoverFlow";
import { EditorialCard, EventCard, SlotChips, VenueRow } from "@/components/hostess/cards";
import { Chip, SectionHeader } from "@/components/hostess/system";
import { categoryMeta, curatedRestaurants, occupancyOf, slotsFor } from "@/components/hostess/venue";

/* ── Category filter row ─────────────────────────────────────────── */

export function CategoryRail({
  activeValues,
  onSelect,
  tone = "stone",
  className,
}: {
  activeValues: readonly string[];
  onSelect: (category: string) => void;
  tone?: "stone" | "surface";
  className?: string;
}) {
  return (
    <div className={`rail gap-2 py-1 ${className ?? ""}`}>
      {categories.map((category) => {
        const meta = categoryMeta[category.key];
        return (
          <Chip
            key={category.key}
            tone={tone}
            icon={meta?.Icon}
            selected={activeValues.includes(category.key)}
            onClick={() => onSelect(category.key)}
            className="snap-start"
          >
            {meta?.label ?? category.label}
          </Chip>
        );
      })}
    </div>
  );
}

/* ── Discovery sections ──────────────────────────────────────────── */

type CatalogSectionsProps = {
  category: string;
  onOpenRestaurant: (restaurant: Restaurant) => void;
  onOpenVenue: (venue: Venue) => void;
  onOpenEvent: (event: CityEvent) => void;
};

function Section({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      {children}
    </motion.section>
  );
}

const eventMeta = (e: CityEvent) => (e.price === 0 ? "Бесплатно" : `от ${money(e.price)}`);

export function CatalogSections({
  category,
  onOpenRestaurant,
  onOpenVenue,
  onOpenEvent,
}: CatalogSectionsProps) {
  const categoryVenues = venues
    .filter((venue) => venue.category === category)
    .sort((a, b) => b.rating - a.rating);

  let stackItems: StackedCoverFlowItem[];
  if (category === "food") {
    stackItems = curatedRestaurants().map((r, index) => ({
      id: r.id,
      image: r.cover,
      eyebrow: r.cuisine,
      title: r.name,
      subtitle: `${r.district} · ${r.distanceKm} км`,
      meta: `~${money(r.avgCheck)}`,
      occupancy: r.occupancy,
      rating: r.rating,
      badge: index === 0 ? "Выбор недели" : r.id === "xoxo" ? "Сегодня трансляция" : undefined,
      onClick: () => onOpenRestaurant(r),
    }));
  } else if (category === "concerts") {
    stackItems = cityEvents.map((e) => ({
      id: e.id,
      image: e.cover,
      eyebrow: `${e.tag} · ${e.date}`,
      title: e.title,
      subtitle: `${e.place} · ${e.time}`,
      meta: eventMeta(e),
      badge: e.hot ? "Почти распродано" : undefined,
      onClick: () => onOpenEvent(e),
    }));
  } else {
    stackItems = categoryVenues.map((v) => ({
      id: v.id,
      image: v.cover,
      eyebrow: v.kind.split(" · ")[0],
      title: v.name,
      subtitle: `${v.kind.split(" · ")[1] ?? "Астана"} · ${v.distanceKm} км`,
      meta: `от ${money(v.priceFrom)}`,
      occupancy: v.occupancy,
      rating: v.rating,
      onClick: () => onOpenVenue(v),
    }));
  }

  const stackTitle =
    category === "food" ? "Сегодня вечером" : category === "concerts" ? "Афиша недели" : "Лучшее рядом";

  const availableNow = [...restaurants]
    .filter((r) => r.occupancy < 98)
    .sort((a, b) => a.occupancy - b.occupancy)
    .slice(0, 4);

  const topRated = [...restaurants].sort((a, b) => b.rating - a.rating);

  return (
    <div className="space-y-10 pb-8 pt-4">
      <Section>
        <SectionHeader eyebrow="Выбор Hostess" title={stackTitle} />
        {stackItems.length > 0 ? (
          <StackedCoverFlow key={category} items={stackItems} />
        ) : (
          <p className="t-caption px-5 py-8">Скоро здесь появятся места</p>
        )}
      </Section>

      {category === "food" && (
        <>
          <Section>
            <SectionHeader eyebrow="Ближайшие столы" title="Свободно сейчас" />
            <div className="space-y-5">
              {availableNow.map((r) => (
                <VenueRow
                  key={r.id}
                  image={r.cover}
                  title={r.name}
                  subtitle={`${r.cuisine} · ${r.district}`}
                  occupancy={r.occupancy}
                  rating={r.rating}
                  onClick={() => onOpenRestaurant(r)}
                  footer={
                    <SlotChips
                      slots={slotsFor(r.id, r.occupancy)}
                      onPick={() => onOpenRestaurant(r)}
                    />
                  }
                />
              ))}
            </div>
          </Section>

          <Section>
            <SectionHeader eyebrow="Гости рекомендуют" title="Лучшие по оценкам" />
            <div className="rail gap-3">
              {topRated.map((r) => (
                <EditorialCard
                  key={r.id}
                  image={r.gallery[1] ?? r.cover}
                  title={r.name}
                  caption={`${r.rating.toFixed(1)} · ${r.reviews.toLocaleString("ru-RU")} отзывов`}
                  onClick={() => onOpenRestaurant(r)}
                />
              ))}
            </div>
          </Section>
        </>
      )}

      {category !== "food" && category !== "concerts" && categoryVenues.length > 0 && (
        <Section>
          <SectionHeader title="Все места" />
          <div className="space-y-5">
            {categoryVenues.map((v) => (
              <VenueRow
                key={v.id}
                image={v.cover}
                title={v.name}
                subtitle={v.kind}
                occupancy={occupancyOf(v.id)}
                rating={v.rating}
                meta={`от ${money(v.priceFrom)}`}
                onClick={() => onOpenVenue(v)}
              />
            ))}
          </div>
        </Section>
      )}

      {(category === "food" || category === "concerts") && (
        <Section>
          <SectionHeader eyebrow="Город" title="Афиша выходных" />
          <div className="rail gap-3">
            {cityEvents.map((e) => (
              <EventCard
                key={e.id}
                image={e.cover}
                eyebrow={`${e.date} · ${e.time}`}
                title={e.title}
                subtitle={e.place}
                meta={eventMeta(e)}
                onClick={() => onOpenEvent(e)}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

/** Standalone discovery screen (kept for reuse; the app embeds sections in the map sheet). */
export function CatalogScreen({
  onOpenRestaurant,
}: {
  onOpenRestaurant: (restaurant: Restaurant) => void;
}) {
  const [category, setCategory] = useState("food");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [event, setEvent] = useState<CityEvent | null>(null);

  return (
    <div className="catalog-scroll no-scrollbar h-full overflow-y-auto bg-canvas pb-nav">
      <div className="pt-safe sticky top-0 z-10 bg-[color-mix(in_oklab,var(--hs-canvas)_90%,transparent)] pb-2 backdrop-blur-xl">
        <h1 className="t-title px-5 pb-3 pt-2">Места</h1>
        <CategoryRail activeValues={[category]} onSelect={setCategory} />
      </div>
      <CatalogSections
        category={category}
        onOpenRestaurant={onOpenRestaurant}
        onOpenVenue={setVenue}
        onOpenEvent={setEvent}
      />
      <AnimatePresence>
        {venue && <VenueBookingModal key="venue" venue={venue} onClose={() => setVenue(null)} />}
        {event && <EventTicketModal key="event" event={event} onClose={() => setEvent(null)} />}
      </AnimatePresence>
    </div>
  );
}
