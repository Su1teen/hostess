import { useCallback, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CarFront, HeartPulse, Mic2, Scissors, Utensils, type LucideProps } from "lucide-react";
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
import { categoryToTheme, useTheme } from "@/components/hostess/ThemeProvider";
import { EventTicketModal } from "@/components/hostess/EventTicketModal";
import { VenueBookingModal } from "@/components/hostess/VenueBookingModal";

const categoryMeta: Record<string, { color: string; Icon: ComponentType<LucideProps> }> = {
  food: { color: "#f97316", Icon: Utensils },
  concerts: { color: "#8b5cf6", Icon: Mic2 },
  beauty: { color: "#ec4899", Icon: Scissors },
  medicine: { color: "#10b981", Icon: HeartPulse },
  auto: { color: "#3b82f6", Icon: CarFront },
};

type CategoryRailProps = {
  value: string;
  onChange: (category: string) => void;
};

export function CategoryRail({ value, onChange }: CategoryRailProps) {
  return (
    <div className="no-scrollbar touch-pan-x snap-x snap-mandatory overflow-x-auto px-5 py-3">
      <div className="flex w-max gap-2.5">
        {categories.map((category) => {
          const isActive = category.key === value;
          const meta = categoryMeta[category.key] ?? categoryMeta.food;
          const Icon = meta.Icon;

          return (
            <motion.button
              key={category.key}
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12 }}
              onClick={() => onChange(category.key)}
              className="flex h-14 shrink-0 snap-start items-center gap-3 rounded-full border p-1 pr-5 text-[15px] font-normal transition-[background-color,border-color,color,box-shadow] duration-150"
              style={{
                backgroundColor: isActive ? meta.color : "#ffffff",
                borderColor: isActive ? meta.color : "rgba(17, 24, 39, 0.08)",
                color: isActive ? "#ffffff" : "#262626",
                boxShadow: isActive
                  ? `0 8px 22px -14px ${meta.color}`
                  : "0 5px 18px -12px rgba(15, 23, 42, 0.35)",
              }}
              aria-pressed={isActive}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-neutral-900 shadow-[0_3px_12px_rgba(15,23,42,0.14)]">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span className="whitespace-nowrap">{category.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

type CatalogSectionsProps = {
  category: string;
  onOpenRestaurant: (restaurant: Restaurant) => void;
  onOpenVenue: (venue: Venue) => void;
  onOpenEvent: (event: CityEvent) => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-3"
    >
      <h2 className="px-5 text-[21px] font-normal tracking-[-0.02em] text-neutral-900">{title}</h2>
      {children}
    </motion.section>
  );
}

function CardRail({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar touch-pan-x snap-x snap-mandatory overflow-x-auto px-5 pb-3">
      <div className="flex w-max gap-3.5">{children}</div>
    </div>
  );
}

function CardFrame({
  image,
  title,
  subtitle,
  meta,
  onClick,
}: {
  image: string;
  title: string;
  subtitle: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className="relative aspect-video w-[82vw] max-w-[326px] shrink-0 snap-start overflow-hidden rounded-[26px] bg-neutral-200 text-left shadow-[0_18px_42px_-28px_rgba(15,23,42,0.65)]"
    >
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-normal leading-tight">{title}</span>
          <span className="mt-1 block truncate text-xs font-light text-white/75">{subtitle}</span>
        </span>
        <span className="shrink-0 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-normal text-neutral-900 backdrop-blur-md">
          {meta}
        </span>
      </span>
    </motion.button>
  );
}

export function CatalogSections({
  category,
  onOpenRestaurant,
  onOpenVenue,
  onOpenEvent,
}: CatalogSectionsProps) {
  const categoryVenues = venues.filter((venue) => venue.category === category);
  const popularRestaurants = [...restaurants].sort((a, b) => b.rating - a.rating);
  const popularVenues = [...categoryVenues].sort((a, b) => b.rating - a.rating);

  const renderCategoryCards = (popular = false) => {
    if (category === "food") {
      const items = popular ? popularRestaurants : restaurants;
      return items.map((restaurant) => (
        <CardFrame
          key={`${popular ? "popular-" : ""}${restaurant.id}`}
          image={restaurant.cover}
          title={restaurant.name}
          subtitle={`${restaurant.cuisine} · ${restaurant.distanceKm} км`}
          meta={popular ? `${restaurant.rating} ★` : `от ${money(restaurant.avgCheck)}`}
          onClick={() => onOpenRestaurant(restaurant)}
        />
      ));
    }

    if (category === "concerts") {
      const items = popular ? cityEvents.filter((event) => event.hot) : cityEvents;
      return items.map((event) => (
        <CardFrame
          key={`${popular ? "popular-" : ""}${event.id}`}
          image={event.cover}
          title={event.title}
          subtitle={`${event.place} · ${event.date}`}
          meta={event.price === 0 ? "Бесплатно" : `от ${money(event.price)}`}
          onClick={() => onOpenEvent(event)}
        />
      ));
    }

    const items = popular ? popularVenues : categoryVenues;
    return items.map((venue) => (
      <CardFrame
        key={`${popular ? "popular-" : ""}${venue.id}`}
        image={venue.cover}
        title={venue.name}
        subtitle={`${venue.kind} · ${venue.distanceKm} км`}
        meta={popular ? `${venue.rating} ★` : `от ${money(venue.priceFrom)}`}
        onClick={() => onOpenVenue(venue)}
      />
    ));
  };

  const hasCategoryItems =
    category === "food" || category === "concerts" || categoryVenues.length > 0;

  return (
    <div className="space-y-8 pb-7 pt-3">
      <Section title="Заведения">
        {hasCategoryItems ? (
          <CardRail>{renderCategoryCards()}</CardRail>
        ) : (
          <p className="px-5 py-8 text-sm font-light text-neutral-400">
            Пока нет заведений в этой категории
          </p>
        )}
      </Section>

      <Section title="Сейчас популярны">
        {hasCategoryItems ? (
          <CardRail>{renderCategoryCards(true)}</CardRail>
        ) : (
          <p className="px-5 py-8 text-sm font-light text-neutral-400">
            Скоро здесь появятся рекомендации
          </p>
        )}
      </Section>

      <Section title="Афиша выходных">
        <CardRail>
          {cityEvents.map((event) => (
            <CardFrame
              key={event.id}
              image={event.cover}
              title={event.title}
              subtitle={`${event.place} · ${event.date} · ${event.time}`}
              meta={event.price === 0 ? "Бесплатно" : `от ${money(event.price)}`}
              onClick={() => onOpenEvent(event)}
            />
          ))}
        </CardRail>
      </Section>
    </div>
  );
}

export function CatalogScreen({
  onOpenRestaurant,
}: {
  onOpenRestaurant: (restaurant: Restaurant) => void;
}) {
  const [category, setCategory] = useState("food");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [event, setEvent] = useState<CityEvent | null>(null);
  const { setTheme } = useTheme();

  const handleCategoryChange = useCallback(
    (nextCategory: string) => {
      setCategory(nextCategory);
      setTheme(categoryToTheme(nextCategory));
    },
    [setTheme],
  );

  return (
    <div className="catalog-scroll h-full overflow-y-auto bg-[#fafafa] pb-[120px]">
      <div className="sticky top-0 z-10 bg-[#fafafa]/92 pt-11 backdrop-blur-xl">
        <CategoryRail value={category} onChange={handleCategoryChange} />
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
