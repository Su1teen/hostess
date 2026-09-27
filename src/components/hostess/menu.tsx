import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Plus, ShoppingBag } from "lucide-react";
import { money, type Dish } from "@/data/hostess";
import { cn } from "@/lib/utils";
import { BottomSheet, Button, EmptyState, IconButton, Photo, Stepper, Ticker, tapSpring } from "./system";
import type { PreorderItem } from "./types";

/* ──────────────────────────────────────────────────────────────────────
   Menu & preorder — Tock/OpenTable pacing: image-led signatures,
   then a quiet, highly scannable list. No delivery-app chrome.
   ────────────────────────────────────────────────────────────────────── */

const cleanTag = (t: string) => t.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "").trim();

export function dishHighlight(d: Dish): string | null {
  if (d.special) return d.special;
  const t = d.tags.find((x) => /хит|🔥|hot/i.test(x));
  if (t) return "Хит";
  if (d.tags.some((x) => /new|новинк/i.test(x))) return "Новинка";
  if (d.tags.some((x) => /веган|🌱/i.test(x))) return "Веган";
  return null;
}

export function SignatureDishes({
  dishes,
  onOpen,
  priceOf = (d) => d.price,
}: {
  dishes: Dish[];
  onOpen: (d: Dish) => void;
  priceOf?: (d: Dish) => number;
}) {
  if (dishes.length === 0) return null;
  return (
    <div className="rail gap-3">
      {dishes.map((d) => {
        const hl = dishHighlight(d);
        return (
          <motion.button
            key={d.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={tapSpring}
            onClick={() => onOpen(d)}
            className="w-[196px] shrink-0 snap-start text-left"
          >
            <span className="relative block overflow-hidden rounded-card">
              <Photo src={d.image} className="aspect-[4/5] w-full" />
              {hl && (
                <span className="frost-photo absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium text-ink">
                  {hl}
                </span>
              )}
            </span>
            <span className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.015em]">
              {d.name}
            </span>
            <span className="t-num mt-1 block text-[13.5px] text-ink-2">{money(priceOf(d))}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function MenuRow({
  dish,
  qty,
  price,
  priceMeta,
  onOpen,
  onQty,
}: {
  dish: Dish;
  qty: number;
  price: number;
  priceMeta?: ReactNode;
  onOpen: () => void;
  onQty: (qty: number) => void;
}) {
  const hl = dishHighlight(dish);
  return (
    <div className="flex items-start gap-4 py-4">
      <button type="button" onClick={onOpen} className="press-soft -m-1 flex min-w-0 flex-1 gap-3.5 rounded-[14px] p-1 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15.5px] font-medium tracking-[-0.012em] text-ink">{dish.name}</span>
            {hl && (
              <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-accent-ink">{hl}</span>
            )}
          </span>
          <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-3">{dish.desc}</span>
          <span className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <span className="t-num text-[14.5px] font-medium text-ink">{money(price)}</span>
            {priceMeta}
            {!priceMeta && dish.weight > 0 && (
              <span className="t-num text-[12px] text-ink-3">{dish.weight} г</span>
            )}
          </span>
        </span>
        {dish.image && <Photo src={dish.image} className="h-[68px] w-[68px] shrink-0 rounded-thumb" />}
      </button>
      <div className="flex h-[68px] shrink-0 items-center">
        {qty > 0 ? (
          <Stepper value={qty} onChange={onQty} min={0} max={20} size="sm" />
        ) : (
          <IconButton icon={Plus} label={`Добавить ${dish.name}`} variant="stone" size={36} iconSize={16} onClick={() => onQty(1)} />
        )}
      </div>
    </div>
  );
}

export function MenuSections({
  sections,
  qtyOf,
  onOpen,
  onQty,
  priceOf = (d) => d.price,
  priceMeta,
  idPrefix,
}: {
  sections: { section: string; items: Dish[] }[];
  qtyOf: (d: Dish) => number;
  onOpen: (d: Dish) => void;
  onQty: (d: Dish, qty: number) => void;
  priceOf?: (d: Dish) => number;
  priceMeta?: (d: Dish) => ReactNode;
  idPrefix?: string;
}) {
  return (
    <div>
      {sections.map((sec, i) => (
        <section
          key={sec.section}
          id={idPrefix ? `${idPrefix}-${i}` : undefined}
          className="scroll-mt-2 px-5 pt-6"
        >
          <div className="flex items-baseline justify-between border-b border-line pb-2.5">
            <h3 className="text-[17px] font-semibold tracking-[-0.015em]">{sec.section}</h3>
            <span className="t-num text-[12px] text-ink-3">{sec.items.length}</span>
          </div>
          <div className="divide-hairline">
            {sec.items.map((d) => (
              <MenuRow
                key={d.id}
                dish={d}
                qty={qtyOf(d)}
                price={priceOf(d)}
                priceMeta={priceMeta?.(d)}
                onOpen={() => onOpen(d)}
                onQty={(q) => onQty(d, q)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Collapsed menu (progressive disclosure): count, starting price and three
 * signature previews. The full menu only renders once the guest asks.
 */
export function MenuTeaser({
  count,
  fromPrice,
  dishes,
  onOpen,
  className,
}: {
  count: number;
  fromPrice: number;
  dishes: Dish[];
  onOpen: () => void;
  className?: string;
}) {
  return (
    <div className={cn("px-5", className)}>
      <button type="button" onClick={onOpen} className="flex w-full items-end justify-between gap-4 text-left">
        <span>
          <span className="t-headline block">Меню</span>
          <span className="t-num mt-1 block text-[13px] text-ink-3">
            {count} {plural(count, "позиция", "позиции", "позиций")} · от {money(fromPrice)}
          </span>
        </span>
        <ChevronRight className="mb-1 h-5 w-5 shrink-0 text-ink-3" strokeWidth={1.6} />
      </button>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {dishes.slice(0, 3).map((d) => (
          <motion.button
            key={d.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={tapSpring}
            onClick={onOpen}
            className="min-w-0 text-left"
          >
            <Photo src={d.image} className="aspect-square w-full rounded-[14px]" />
            <span className="mt-2 block truncate text-[13px] font-medium tracking-[-0.01em]">{d.name}</span>
            <span className="t-num block text-[12px] text-ink-3">{money(d.price)}</span>
          </motion.button>
        ))}
      </div>
      <Button variant="outline" block className="mt-5" onClick={onOpen}>
        Открыть меню
      </Button>
    </div>
  );
}

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

/** Full menu in its own sheet: signatures → section jumps → quiet list. */
export function MenuSheet({
  title,
  sections,
  signatures,
  qtyOf,
  onOpenDish,
  onQty,
  cartCount,
  cartTotal,
  onClose,
}: {
  title: string;
  sections: { section: string; items: Dish[] }[];
  signatures: Dish[];
  qtyOf: (d: Dish) => number;
  onOpenDish: (d: Dish) => void;
  onQty: (d: Dish, qty: number) => void;
  cartCount: number;
  cartTotal: number;
  onClose: () => void;
}) {
  const jump = (i: number) => document.getElementById(`menu-sec-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <BottomSheet
      onClose={onClose}
      maxHeight="94%"
      header={
        <div className="border-b border-line pb-3 pt-7">
          <div className="px-5">
            <p className="t-micro">{title}</p>
            <h2 className="t-title mt-1">Меню</h2>
          </div>
          <div className="rail mt-3 gap-2" onPointerDown={(e) => e.stopPropagation()}>
            {sections.map((s, i) => (
              <button
                key={s.section}
                type="button"
                onClick={() => jump(i)}
                className="press h-8 shrink-0 snap-start rounded-[10px] bg-stone px-3 text-[13px] font-medium"
              >
                {s.section}
              </button>
            ))}
          </div>
        </div>
      }
      footer={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="t-num text-[12.5px] text-ink-3">
              {cartCount ? `${cartCount} ${plural(cartCount, "позиция", "позиции", "позиций")} к столу` : "Предзаказ к вашему приходу"}
            </p>
            <Ticker value={money(cartTotal)} className="text-[16px] font-semibold tracking-[-0.015em]" />
          </div>
          <Button size="lg" className="px-7" onClick={onClose}>
            {cartCount ? "Готово" : "Закрыть"}
          </Button>
        </div>
      }
    >
      {signatures.length > 0 && (
        <div className="pt-5">
          <p className="t-micro px-5 pb-3">От шефа</p>
          <SignatureDishes dishes={signatures} onOpen={onOpenDish} />
        </div>
      )}
      <MenuSections sections={sections} qtyOf={qtyOf} onOpen={onOpenDish} onQty={onQty} idPrefix="menu-sec" />
      <p className="t-caption px-5 pb-6 pt-6">Предзаказ подадут к вашему приходу. Оплата — вместе с бронью.</p>
    </BottomSheet>
  );
}

/** Preorder helpers shared by every venue flow. */
export function setPreorderQty(prev: PreorderItem[], dish: Dish, qty: number): PreorderItem[] {
  if (qty <= 0) return prev.filter((p) => p.dish.id !== dish.id);
  return prev.some((p) => p.dish.id === dish.id)
    ? prev.map((p) => (p.dish.id === dish.id ? { ...p, qty } : p))
    : [...prev, { dish, qty }];
}

export function addPreorder(prev: PreorderItem[], dish: Dish, qty: number): PreorderItem[] {
  const found = prev.find((p) => p.dish.id === dish.id);
  return setPreorderQty(prev, dish, (found?.qty ?? 0) + qty);
}

/** Compact preorder summary line — sits at the top of a docked action bar. */
export function CartLine({
  count,
  total,
  onOpen,
  className,
}: {
  count: number;
  total: number;
  onOpen: () => void;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className={cn("press-soft -mx-2 mb-2.5 flex w-[calc(100%+16px)] items-center gap-3 rounded-[14px] px-2 py-1.5 text-left", className)}
    >
      <span className="relative grid h-8 w-8 place-items-center rounded-full bg-stone">
        <ShoppingBag className="h-4 w-4" strokeWidth={1.6} />
        <span className="t-num absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      </span>
      <span className="flex-1 text-[13.5px] font-medium">Предзаказ</span>
      <Ticker value={money(total)} className="text-[13.5px] font-medium" />
      <span className="text-[13px] text-ink-3">Изменить</span>
    </motion.button>
  );
}

export function CartSheet({
  items,
  priceOf = (d) => d.price,
  onQty,
  onClose,
  footer,
  note,
}: {
  items: PreorderItem[];
  priceOf?: (d: Dish) => number;
  onQty: (d: Dish, qty: number) => void;
  onClose: () => void;
  footer?: ReactNode;
  note?: ReactNode;
}) {
  const total = items.reduce((s, p) => s + priceOf(p.dish) * p.qty, 0);
  return (
    <BottomSheet
      onClose={onClose}
      z="z-[140]"
      maxHeight="80%"
      header={
        <div className="px-5 pb-2 pt-8">
          <p className="t-micro">Предзаказ</p>
          <h2 className="t-headline mt-1">Ваш заказ к столу</h2>
        </div>
      }
      footer={
        <>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="t-caption">Итого</span>
            <Ticker value={money(total)} className="text-[20px] font-semibold tracking-[-0.02em]" />
          </div>
          {note}
          {footer}
        </>
      }
    >
      {items.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Пока пусто" text="Добавьте позиции из меню — их подготовят к вашему приходу." />
      ) : (
        <div className="divide-hairline px-5 pb-4">
          {items.map((p) => (
            <div key={p.dish.id} className="flex items-center gap-3.5 py-3.5">
              <Photo src={p.dish.image} className="h-12 w-12 shrink-0 rounded-[12px]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{p.dish.name}</span>
                <span className="t-num text-[12.5px] text-ink-3">{money(priceOf(p.dish) * p.qty)}</span>
              </span>
              <Stepper value={p.qty} onChange={(q) => onQty(p.dish, q)} min={0} size="sm" />
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
