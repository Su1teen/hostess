import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChefHat,
  Clock3,
  Minus,
  Plus,
  Search,
  Sparkles,
  Wine,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { kzt, type Cart } from "@/lib/dine-in-api";
import { type PriceHistory } from "@/hooks/useDiningCatalog";
import "./dining.css";

export type DiningSection = "home" | "market" | "menu";
export type CatalogProduct = {
  id: string;
  key: string;
  name: string;
  price: number;
  isAvailable: boolean;
  imageUrl?: string | null;
  category?: string | null;
  description?: string;
  portion?: string;
  allergens?: string[];
  originalPrice?: number;
  previousPrice?: number | null;
  minPrice?: number;
  changePercent?: number;
  volumeMl?: number | null;
};

export function DiningGateways({
  onSelect,
  productCount,
  connected,
  menuImage,
  menuCount,
}: {
  onSelect: (section: "market" | "menu") => void;
  productCount: number;
  connected: boolean;
  menuImage?: string | null;
  menuCount?: number;
}) {
  return (
    <div className="dining-gateways">
      <button className="dining-gateway dining-gateway-market" onClick={() => onSelect("market")}>
        <span className="dining-eyebrow">
          <Wine size={15} /> XOXO MARKET
        </span>
        <span className="dining-gateway-title">Биржа напитков</span>
        <span className="dining-gateway-description">Цены меняются вместе с рынком</span>
        <span className="dining-gateway-footer">
          <span>
            <i className={connected ? "is-live" : ""} />
            {connected ? `${productCount} напитков · текущий раунд` : "Смотреть каталог"}
          </span>
          <ArrowRight size={20} />
        </span>
        <span aria-hidden="true" className="dining-market-orbit">
          <Wine size={76} strokeWidth={0.7} />
        </span>
      </button>
      <button className="dining-gateway dining-gateway-menu" onClick={() => onSelect("menu")}>
        {menuImage && /^https:\/\//.test(menuImage) && (
          <img src={menuImage} alt="" loading="lazy" />
        )}
        <span className="dining-eyebrow">
          <ChefHat size={15} /> КУХНЯ & БАР
        </span>
        <span className="dining-gateway-title">Меню XOXO</span>
        <span className="dining-gateway-description">Кухня, закуски, напитки и другое</span>
        <span className="dining-gateway-footer">
          <span>
            {menuCount ? `${menuCount} позиций · выбирайте по вкусу` : "Открыть основное меню"}
          </span>
          <ArrowRight size={20} />
        </span>
      </button>
    </div>
  );
}

export function ProductQuantity({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string;
  value: number;
  disabled: boolean;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="dining-quantity">
      <button
        aria-label={`Убрать ${name}`}
        disabled={disabled || !value}
        onClick={() => onChange(-1)}
      >
        <Minus size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        aria-label={`Добавить ${name}`}
        disabled={disabled || value >= 20}
        onClick={() => onChange(1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function ProductImage({ product, market }: { product: CatalogProduct; market: boolean }) {
  return product.imageUrl && /^https:\/\//.test(product.imageUrl) ? (
    <img
      src={product.imageUrl}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  ) : (
    <div className="dining-photo-placeholder" aria-label="Фотография пока не добавлена">
      {market ? <Wine size={36} strokeWidth={1} /> : <ChefHat size={36} strokeWidth={1} />}
    </div>
  );
}

function PriceChange({ product }: { product: CatalogProduct }) {
  if (product.changePercent == null || product.previousPrice == null) return null;
  const change = product.changePercent;
  return (
    <span className={`dining-price-change ${change < 0 ? "is-down" : change > 0 ? "is-up" : ""}`}>
      {change < 0 ? <ArrowDownRight size={14} /> : change > 0 ? <ArrowUpRight size={14} /> : null}
      {change > 0 ? "+" : ""}
      {change.toFixed(1)}%
    </span>
  );
}

function PriceChart({
  product,
  history,
}: {
  product: CatalogProduct;
  history: PriceHistory | null;
}) {
  const points =
    history?.rounds.flatMap((round) => {
      const price = round.prices.find((p) => p.productId === product.id)?.price;
      return price == null ? [] : [{ price, startsAt: round.startsAt }];
    }) ?? [];
  if (points.length < 2)
    return <p className="dining-note">История появится после нескольких опубликованных раундов.</p>;
  const min = Math.min(...points.map((p) => p.price)),
    max = Math.max(...points.map((p) => p.price));
  const path = points
    .map(
      (p, i) =>
        `${(i * 240) / (points.length - 1)},${40 - ((p.price - min) / (max - min || 1)) * 32}`,
    )
    .join(" ");
  return (
    <div className="dining-chart">
      <svg
        viewBox="0 0 240 48"
        role="img"
        aria-label={`Опубликованные цены: ${points.map((p) => kzt(p.price)).join(", ")}`}
      >
        <path d="M0 44H240" fill="none" stroke="currentColor" opacity=".12" />
        <polyline
          points={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{points.length} опубликованных раундов</span>
      <span>
        {kzt(min)} — {kzt(max)}
      </span>
    </div>
  );
}

export function DiningCatalog({
  section,
  products,
  loading,
  connected,
  cart,
  onUpdate,
  onBack,
  disabled = false,
  roundEndsAt,
  roundLabel,
  history = null,
  now = Date.now(),
  browseOnly = false,
}: {
  section: "market" | "menu";
  products: CatalogProduct[];
  loading: boolean;
  connected: boolean;
  cart: Cart;
  onUpdate: (key: string, delta: number) => void;
  onBack: () => void;
  disabled?: boolean;
  roundEndsAt?: string | null;
  roundLabel?: string | null;
  history?: PriceHistory | null;
  now?: number;
  browseOnly?: boolean;
}) {
  const [category, setCategory] = useState("Все");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const market = section === "market";
  const categories = [
    "Все",
    ...new Set(products.map((p) => p.category).filter((p): p is string => Boolean(p))),
  ];
  const filtered = products.filter(
    (p) =>
      (category === "Все" || category === p.category) &&
      `${p.name} ${p.description ?? ""}`
        .toLocaleLowerCase("ru")
        .includes(query.trim().toLocaleLowerCase("ru")),
  );
  const offers = useMemo(
    () =>
      products
        .filter((p) => p.isAvailable && p.originalPrice != null && p.originalPrice > p.price)
        .sort((a, b) => 1 - b.price / b.originalPrice! - (1 - a.price / a.originalPrice!))
        .slice(0, 4),
    [products],
  );
  const seconds = roundEndsAt
    ? Math.max(0, Math.ceil((Date.parse(roundEndsAt) - now) / 1000))
    : null;
  const currentSelected = selected
    ? (products.find((p) => p.key === selected.key) ?? selected)
    : null;
  return (
    <section
      className={`dining-catalog ${market ? "is-market" : "is-menu"}`}
      aria-label={market ? "Биржевое меню" : "Основное меню"}
    >
      <button className="dining-back" onClick={onBack}>
        <ArrowLeft size={17} /> Меню и биржа
      </button>
      <div className="dining-catalog-heading">
        <div>
          <p className="dining-eyebrow">{market ? "ЦЕНЫ В ДВИЖЕНИИ" : "ВКУС ВАШЕГО ВЕЧЕРА"}</p>
          <h2>{market ? "XOXO Market" : "Меню XOXO"}</h2>
        </div>
        {market ? <Wine size={27} strokeWidth={1.3} /> : <ChefHat size={27} strokeWidth={1.3} />}
      </div>
      {market && (
        <div className="dining-round">
          <span>
            <i className={connected ? "is-live" : ""} />
            {connected ? "Опубликованный раунд" : "Ожидаем актуальные цены"}
          </span>
          {connected && seconds != null && (
            <span>
              <Clock3 size={13} />
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
          )}
          {connected && roundLabel && <small>{roundLabel}</small>}
        </div>
      )}
      {!connected && !loading && (
        <p role="status" className="dining-notice">
          {market
            ? "Биржа временно недоступна или раунд завершён. Последние цены — для просмотра. Заказ возобновится после обновления."
            : "Меню временно недоступно. Сохранённые позиции можно посмотреть, оформление возобновится после обновления."}
        </p>
      )}
      {market && (
        <details className="dining-explainer">
          <summary>Как работает биржа?</summary>
          <p>
            Цены публикуются раундами и могут снижаться или расти. Изменение показано относительно
            предыдущего раунда. Точную сумму подтвердим перед заказом. Алкоголь — только с 21 года.
            Возраст проверяет персонал.
          </p>
        </details>
      )}
      {market && connected && offers.length > 0 && (
        <section className="dining-offers" aria-label="Лучшие текущие предложения">
          <div className="dining-section-label">
            <Sparkles size={15} />
            <h3>Ниже обычной цены</h3>
          </div>
          <div className="dining-offer-track">
            {offers.map((p) => (
              <button key={p.key} onClick={() => setSelected(p)} className="dining-offer">
                <span className="dining-offer-discount">
                  −{Math.round((1 - p.price / p.originalPrice!) * 100)}%
                </span>
                <strong>{p.name}</strong>
                <span>
                  {kzt(p.price)} <s>{kzt(p.originalPrice!)}</s>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      <label className="dining-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={market ? "Найти напиток" : "Что вам приготовить?"}
          aria-label={market ? "Поиск напитков" : "Поиск по меню"}
        />
      </label>
      {categories.length > 1 && (
        <nav className="dining-categories" aria-label="Категории меню">
          {categories.map((c) => (
            <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </nav>
      )}
      <div className="dining-section-label">
        <h3>{market ? "Все напитки" : category === "Все" ? "Основное меню" : category}</h3>
        <span>{filtered.length}</span>
      </div>
      {loading ? (
        <div role="status" aria-label="Загружаем каталог" className="dining-loading">
          <div />
          <div />
          <div />
        </div>
      ) : !filtered.length ? (
        <div className="dining-empty">
          <ChefHat size={32} strokeWidth={1} />
          <h3>
            {query
              ? "Ничего не нашлось"
              : products.length
                ? "В этой категории пока пусто"
                : market
                  ? "Ждём следующий раунд"
                  : "Меню скоро появится"}
          </h3>
          <p>
            {query
              ? "Попробуйте другое название."
              : market
                ? "Доступные напитки появятся после публикации цен."
                : "Заведение ещё не опубликовало позиции. Уточните меню у официанта."}
          </p>
        </div>
      ) : (
        <div className={market ? "dining-product-list" : "dining-product-grid"}>
          {filtered.map((p) => (
            <article
              key={p.key}
              className={`dining-product ${!p.isAvailable ? "is-unavailable" : ""}`}
            >
              <button
                className="dining-product-open"
                onClick={() => setSelected(p)}
                aria-label={`Подробнее: ${p.name}`}
              >
                <div className="dining-product-photo">
                  <ProductImage product={p} market={market} />
                </div>
                <div className="dining-product-copy">
                  <span className="dining-product-category">
                    {p.category ?? (market ? "Биржа напитков" : "XOXO")}
                    {p.portion ? ` · ${p.portion}` : p.volumeMl ? ` · ${p.volumeMl} мл` : ""}
                  </span>
                  <h3>{p.name}</h3>
                  {!market && p.description && (
                    <p className="dining-description">{p.description}</p>
                  )}
                  <div className="dining-product-price">
                    <strong key={p.price} className="dining-price-updated">
                      {kzt(p.price)}
                    </strong>
                    {market && <PriceChange product={p} />}
                  </div>
                  {market && p.previousPrice != null && (
                    <span className="dining-note">Предыдущий раунд · {kzt(p.previousPrice)}</span>
                  )}
                </div>
              </button>
              <div className="dining-product-action">
                {browseOnly ? (
                  <span className="dining-note">
                    {p.isAvailable ? "Заказ по QR вашего стола" : "Временно недоступно"}
                  </span>
                ) : (
                  <>
                    <span className="dining-note">
                      {!p.isAvailable ? "Нет в наличии" : market ? "В заказ" : "Добавить"}
                    </span>
                    <ProductQuantity
                      name={p.name}
                      value={cart[p.key] ?? 0}
                      disabled={disabled || !connected || !p.isAvailable}
                      onChange={(delta) => onUpdate(p.key, delta)}
                    />
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={Boolean(currentSelected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="dining-product-dialog max-h-[90dvh] overflow-y-auto">
          {currentSelected && (
            <>
              <div className="dining-detail-photo">
                <ProductImage product={currentSelected} market={market} />
              </div>
              <DialogHeader>
                <p className="dining-eyebrow">{currentSelected.category ?? "XOXO"}</p>
                <DialogTitle>{currentSelected.name}</DialogTitle>
                <DialogDescription>
                  {currentSelected.description ||
                    (market
                      ? "Цена опубликованного биржевого раунда"
                      : "Позиция основного меню XOXO")}
                </DialogDescription>
              </DialogHeader>
              <div className="dining-detail-price">
                <strong>{kzt(currentSelected.price)}</strong>
                {market && <PriceChange product={currentSelected} />}
              </div>
              {currentSelected.portion && <p className="dining-note">{currentSelected.portion}</p>}
              {Boolean(currentSelected.allergens?.length) && (
                <p className="dining-note">Аллергены: {currentSelected.allergens!.join(", ")}</p>
              )}
              {market && (
                <>
                  <dl className="dining-price-facts">
                    {currentSelected.previousPrice != null && (
                      <div>
                        <dt>Предыдущий раунд</dt>
                        <dd>{kzt(currentSelected.previousPrice)}</dd>
                      </div>
                    )}
                    {currentSelected.originalPrice != null && (
                      <div>
                        <dt>Обычная цена</dt>
                        <dd>{kzt(currentSelected.originalPrice)}</dd>
                      </div>
                    )}
                    {currentSelected.minPrice != null && (
                      <div>
                        <dt>Минимальная разрешённая цена</dt>
                        <dd>{kzt(currentSelected.minPrice)}</dd>
                      </div>
                    )}
                  </dl>
                  <PriceChart product={currentSelected} history={history} />
                </>
              )}
              {browseOnly ? (
                <p className="dining-notice">
                  Чтобы оформить заказ, отсканируйте QR на вашем столе.
                </p>
              ) : (
                <div className="dining-detail-action">
                  <span>{!currentSelected.isAvailable ? "Нет в наличии" : "В вашем заказе"}</span>
                  <ProductQuantity
                    name={currentSelected.name}
                    value={cart[currentSelected.key] ?? 0}
                    disabled={disabled || !connected || !currentSelected.isAvailable}
                    onChange={(delta) => onUpdate(currentSelected.key, delta)}
                  />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
