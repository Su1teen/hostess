import { useEffect, useState } from "react";
import { diningApi, type DiningTable } from "@/lib/dine-in-api";
import { Button } from "./system";

export function WebTablePicker({
  onSelect,
}: {
  onSelect: (value: { token: string; context: DiningTable }) => void;
}) {
  const [tables, setTables] = useState<
    { resourceId: string; code: string; name: string; zoneName: string; zoneId: string }[]
  >([]);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void diningApi
      .tables(controller.signal)
      .then((result) => {
        setTables(result.tables);
        try {
          const saved = sessionStorage.getItem("hostess:web-table");
          if (result.tables.some((t) => t.resourceId === saved)) setSelected(saved!);
        } catch {
          // Browsers may disable session storage; table selection remains available.
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError((e as Error).message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  return (
    <section
      className="space-y-4 rounded-3xl border border-line p-5"
      aria-label="Выбор стола для заказа"
    >
      <h2 className="t-title">Заказать сейчас</h2>
      <p className="text-sm leading-relaxed text-ink-2">
        Выберите свой стол. Номер указан на табличке рядом с QR. Можно продолжить как гость.
      </p>
      <p className="text-xs text-ink-3">
        Планируете будущий визит? Откройте «Забронировать» и добавьте предзаказ к брони.
      </p>
      <input
        aria-label="Номер стола"
        placeholder="Найти стол по номеру"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-h-12 w-full rounded-xl border border-line bg-white px-4"
      />
      <select
        aria-label="Зона стола"
        value={zone}
        onChange={(e) => setZone(e.target.value)}
        className="min-h-12 w-full rounded-xl border border-line bg-white px-4"
      >
        <option value="">Все зоны</option>
        {Array.from(new Map(tables.map((t) => [t.zoneId, t.zoneName]))).map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
      {loading && <p role="status">Загружаем столы…</p>}
      <div className="grid grid-cols-2 gap-2">
        {tables
          .filter(
            (t) =>
              (!zone || t.zoneId === zone) &&
              (!search || `${t.code} ${t.name}`.toLowerCase().includes(search.toLowerCase())),
          )
          .map((t) => (
            <button
              key={t.resourceId}
              type="button"
              aria-pressed={selected === t.resourceId}
              onClick={() => setSelected(t.resourceId)}
              className={`min-h-16 rounded-xl border p-3 text-left ${selected === t.resourceId ? "border-ink bg-ink text-white" : "border-line bg-white"}`}
            >
              <strong className="block text-sm">{t.name}</strong>
              <span className="mt-1 block text-xs opacity-70">{t.zoneName}</span>
            </button>
          ))}
      </div>
      {!loading && !tables.length && !error && <p>Сейчас нет столов для заказа.</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Button
        block
        size="lg"
        disabled={!selected || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const token = `web_${selected}`;
            const context = await diningApi.table(token);
            try {
              sessionStorage.setItem("hostess:web-table", selected);
            } catch {
              // Remembering the selection is optional for this visit.
            }
            onSelect({ token, context });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Открываем заказ…" : "Продолжить как гость"}
      </Button>
      <p className="text-xs text-ink-3">
        До отправки вы проверите стол, позиции и актуальную сумму. Оплату примет сотрудник.
      </p>
    </section>
  );
}
