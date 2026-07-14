import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { type TableStatus } from "./FloorPlan";
import { MessageSquare, Utensils, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export type TableBooking = {
  name: string;
  guests: number;
  time: string;
  status: TableStatus;
};

export function TableManageSheet({
  table,
  open,
  onOpenChange,
  onBook,
  onCancel,
  onOpenOrder,
  onOpenChat,
  orderCount,
  orderTotal,
}: {
  table: {
    id: number;
    zoneLabel: string;
    seats: number;
    status: TableStatus;
    booking?: TableBooking;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBook: (type: TableStatus, name: string, guests: number, time: string) => void;
  onCancel: () => void;
  onOpenOrder: () => void;
  onOpenChat: () => void;
  orderCount: number;
  orderTotal: number;
}) {
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("20:00");
  const [type, setType] = useState<TableStatus>("reserved");

  useEffect(() => {
    if (!table) return;
    if (table.booking) {
      setName(table.booking.name);
      setGuests(table.booking.guests);
      setTime(table.booking.time);
      setType(table.booking.status);
    } else {
      setName("");
      setGuests(table.seats);
      setTime("20:00");
      setType("reserved");
    }
  }, [table, open]);

  if (!table) return null;

  const statusBadge =
    table.status === "free"
      ? { label: "Свободен", class: "bg-emerald-100 text-emerald-700" }
      : table.status === "occupied"
        ? { label: "Занят", class: "bg-neutral-200 text-neutral-700" }
        : { label: "Забронирован", class: "bg-amber-100 text-amber-700" };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75%] rounded-t-[32px] p-0">
        <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
          <SheetTitle className="text-base">
            {table.zoneLabel} · Стол T{table.id}
          </SheetTitle>
          <SheetDescription className="sr-only">Управление столом</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
            <div>
              <p className="text-[11px] text-neutral-500">Стол T{table.id}</p>
              <p className="text-sm font-semibold">{table.seats} мест</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge.class}`}
            >
              {statusBadge.label}
            </span>
          </div>

          {table.status === "free" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Создать бронь / Посадить гостя</p>
              <div>
                <label className="text-[11px] text-neutral-500">Имя гостя</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Гость"
                  className="mt-1 rounded-2xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-500">Гостей</label>
                  <div className="mt-1 flex items-center gap-2 rounded-2xl border border-border/60 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold">{guests}</span>
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.min(20, g + 1))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500">Время</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1 h-11 w-full rounded-2xl border border-border/60 bg-white px-3 text-sm outline-none"
                  >
                    {["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"].map(
                      (t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-neutral-500">Тип</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TableStatus)}
                  className="mt-1 h-11 w-full rounded-2xl border border-border/60 bg-white px-3 text-sm outline-none"
                >
                  <option value="reserved">Бронь</option>
                  <option value="occupied">Посадка</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => onBook(type, name || "Гость", guests, time)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white"
              >
                <Check className="h-4 w-4" strokeWidth={1.5} />
                {type === "reserved" ? "Забронировать" : "Посадить гостя"}
              </button>
            </div>
          )}

          {table.status !== "free" && (
            <div className="space-y-3">
              {table.booking && (
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-[11px] text-neutral-500">Бронирование</p>
                  <p className="text-sm font-semibold">{table.booking.name}</p>
                  <p className="text-[11px] text-neutral-500">
                    {table.booking.time} · {table.booking.guests} гостей
                  </p>
                </div>
              )}

              {orderCount > 0 && (
                <div className="rounded-2xl bg-primary/10 p-4">
                  <p className="text-[11px] text-neutral-500">Заказ</p>
                  <p className="text-sm font-semibold">
                    {orderCount} {orderCount === 1 ? "позиция" : "позиции"}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex items-center justify-center gap-2 rounded-full border-2 border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                  Отменить
                </button>
                <button
                  type="button"
                  onClick={onOpenOrder}
                  className="flex items-center justify-center gap-2 rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white"
                >
                  <Utensils className="h-4 w-4" strokeWidth={1.5} />
                  Заказ
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenChat}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-white"
              >
                <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                Связаться с гостем
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
