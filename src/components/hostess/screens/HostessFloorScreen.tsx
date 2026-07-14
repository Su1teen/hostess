import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BentoCard } from "../Bento";
import { FloorPlan, getPlan, floorZones, type TableStatus } from "../FloorPlan";
import { TableManageSheet, type TableBooking } from "../TableManageSheet";
import { MenuOrderSheet, type OrderItem } from "../MenuOrderSheet";
import { ChatSheet, type Message } from "../ChatSheet";
import { restaurants } from "@/data/hostess";

const restaurant = restaurants.find((r) => r.id === "kinza") ?? restaurants[0];

type TableKey = `${string}-${number}`;

function tableKey(zone: string, id: number): TableKey {
  return `${zone}-${id}`;
}

function initialStatuses(): Record<string, Record<number, TableStatus>> {
  const statuses: Record<string, Record<number, TableStatus>> = {};
  for (const zone of floorZones) {
    statuses[zone.key] = {};
    for (const t of getPlan(zone.key).tables) {
      statuses[zone.key][t.id] = t.taken ? "occupied" : "free";
    }
  }
  // Моковые брони для демонстрации статусов
  statuses.hall[4] = "reserved";
  statuses.hall[8] = "reserved";
  statuses.vip[1] = "reserved";
  statuses.terrace[7] = "reserved";
  return statuses;
}

function initialBookings(): Record<TableKey, TableBooking> {
  const bookings: Record<TableKey, TableBooking> = {};
  bookings["hall-2"] = { name: "Айгерим К.", guests: 4, time: "20:00", status: "occupied" };
  bookings["hall-4"] = { name: "Данияр М.", guests: 3, time: "20:30", status: "reserved" };
  bookings["hall-5"] = { name: "Ерлан Т.", guests: 4, time: "21:00", status: "occupied" };
  bookings["hall-8"] = { name: "Мадина С.", guests: 2, time: "19:30", status: "reserved" };
  bookings["vip-1"] = { name: "Асель Б.", guests: 6, time: "21:00", status: "reserved" };
  bookings["terrace-7"] = { name: "Тимур Р.", guests: 4, time: "20:00", status: "reserved" };
  return bookings;
}

function aiGuestResponse(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("забы") || t.includes("вещь") || t.includes("остав")) {
    return "Спасибо, я передам! Напишу, когда найдём.";
  }
  if (t.includes("время") || t.includes("когда")) {
    return "Ваша бронь в силе, ждём вас вовремя.";
  }
  return "Спасибо за сообщение! Скоро ответим.";
}

export function HostessFloorScreen() {
  const [zone, setZone] = useState("hall");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tableStatuses, setTableStatuses] =
    useState<Record<string, Record<number, TableStatus>>>(initialStatuses);
  const [bookings, setBookings] = useState<Record<TableKey, TableBooking>>(initialBookings);
  const [orders, setOrders] = useState<Record<TableKey, OrderItem[]>>({});
  const [chats, setChats] = useState<Record<TableKey, Message[]>>({});
  const [manageOpen, setManageOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const key = selectedTable ? tableKey(zone, selectedTable) : null;

  const status = useMemo(() => {
    if (!selectedTable) return "free";
    return tableStatuses[zone]?.[selectedTable] ?? "free";
  }, [zone, selectedTable, tableStatuses]);

  const booking = key ? bookings[key] : undefined;

  const selectedTableData = useMemo(() => {
    if (!selectedTable) return null;
    return getPlan(zone).tables.find((t) => t.id === selectedTable) ?? null;
  }, [zone, selectedTable]);

  const handleSelectTable = (id: number) => {
    setSelectedTable(id);
    setManageOpen(true);
  };

  const handleBook = (type: TableStatus, name: string, guests: number, time: string) => {
    if (!selectedTable || !key) return;
    setTableStatuses((prev) => ({ ...prev, [zone]: { ...prev[zone], [selectedTable]: type } }));
    setBookings((prev) => ({ ...prev, [key]: { name, guests, time, status: type } }));
    setManageOpen(false);
  };

  const handleCancel = () => {
    if (!selectedTable || !key) return;
    setTableStatuses((prev) => ({ ...prev, [zone]: { ...prev[zone], [selectedTable]: "free" } }));
    setBookings((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setManageOpen(false);
  };

  const handleOpenOrder = () => {
    setManageOpen(false);
    setMenuOpen(true);
  };

  const handleOpenChat = () => {
    setManageOpen(false);
    setChatOpen(true);
  };

  const updateOrder = (dish: OrderItem["dish"], qty: number) => {
    if (!key) return;
    setOrders((prev) => {
      const list = [...(prev[key] ?? [])];
      const idx = list.findIndex((o) => o.dish.id === dish.id);
      if (qty <= 0) {
        if (idx !== -1) list.splice(idx, 1);
      } else if (idx !== -1) {
        list[idx] = { ...list[idx], qty };
      } else {
        list.push({ dish, qty });
      }
      return { ...prev, [key]: list };
    });
  };

  const sendChat = (text: string) => {
    if (!key) return;
    const hostId = `host-${Date.now()}`;
    setChats((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { id: hostId, sender: "host", text, createdAt: Date.now() }],
    }));
    setTimeout(() => {
      setChats((prev) => ({
        ...prev,
        [key]: [
          ...(prev[key] ?? []),
          {
            id: `guest-${Date.now()}`,
            sender: "guest",
            text: aiGuestResponse(text),
            createdAt: Date.now(),
          },
        ],
      }));
    }, 800);
  };

  const currentOrders = key ? (orders[key] ?? []) : [];
  const orderCount = currentOrders.reduce((sum, o) => sum + o.qty, 0);
  const orderTotal = currentOrders.reduce((sum, o) => sum + o.dish.price * o.qty, 0);

  const zoneLabel = floorZones.find((z) => z.key === zone)?.label ?? zone;

  return (
    <div className="h-full overflow-y-auto overscroll-none bg-gray-50 pb-[calc(80px+env(safe-area-inset-bottom)+16px)] pt-14">
      <div className="px-5">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">Управление залом</p>
        <h1 className="text-2xl tracking-tight">Зал · {restaurant.name}</h1>
      </div>

      <div className="mt-4 px-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {floorZones.map((z) => (
            <button
              key={z.key}
              type="button"
              onClick={() => {
                setZone(z.key);
                setSelectedTable(null);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                zone === z.key ? "bg-neutral-900 text-white" : "bg-white text-neutral-600"
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={zone}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 px-5"
      >
        <BentoCard className="p-3">
          <FloorPlan
            zone={zone}
            selected={selectedTable}
            onSelect={handleSelectTable}
            mode="manage"
            statuses={tableStatuses[zone]}
          />
        </BentoCard>
      </motion.div>

      <div className="mt-4 px-5">
        <BentoCard
          className="flex items-center justify-around divide-x divide-border/60"
          padded={false}
        >
          {[
            {
              label: "Свободно",
              value: Object.values(tableStatuses[zone] ?? {}).filter((s) => s === "free").length,
            },
            {
              label: "Занято",
              value: Object.values(tableStatuses[zone] ?? {}).filter((s) => s === "occupied")
                .length,
            },
            {
              label: "Забронировано",
              value: Object.values(tableStatuses[zone] ?? {}).filter((s) => s === "reserved")
                .length,
            },
          ].map((s) => (
            <div key={s.label} className="flex-1 p-4 text-center">
              <p className="text-xl font-semibold">{s.value}</p>
              <p className="text-[11px] text-neutral-500">{s.label}</p>
            </div>
          ))}
        </BentoCard>
      </div>

      {selectedTable && selectedTableData && (
        <TableManageSheet
          table={{
            id: selectedTableData.id,
            zoneLabel,
            seats: selectedTableData.seats,
            status,
            booking,
          }}
          open={manageOpen}
          onOpenChange={(open) => {
            setManageOpen(open);
            if (!open) setSelectedTable(null);
          }}
          onBook={handleBook}
          onCancel={handleCancel}
          onOpenOrder={handleOpenOrder}
          onOpenChat={handleOpenChat}
          orderCount={orderCount}
          orderTotal={orderTotal}
        />
      )}

      <MenuOrderSheet
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          if (!open) setManageOpen(true);
        }}
        menu={restaurant.menu}
        orders={currentOrders}
        onUpdate={updateOrder}
      />

      <ChatSheet
        open={chatOpen}
        onOpenChange={(open) => {
          setChatOpen(open);
          if (!open) setManageOpen(true);
        }}
        title={selectedTable ? `Чат · Стол T${selectedTable}` : "Чат с гостем"}
        messages={key ? (chats[key] ?? []) : []}
        onSend={sendChat}
        placeholder="Написать гостю..."
      />
    </div>
  );
}
