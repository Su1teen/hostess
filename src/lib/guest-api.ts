export type GuestReservation = {
  id: string;
  guestName: string;
  guests: number;
  startsAt: string;
  endsAt: string;
  status: string;
  tableId: string;
  tableIds: string[];
  resourceId?: string | null;
  resourceName?: string | null;
  zoneName?: string | null;
  depositStatus: string;
  depositAmount: string;
  iikoSyncStatus: string;
  preorders: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    status: string;
  }[];
};
export type GuestProfile = {
  guest: { id: string; name: string; provisional: boolean };
  reservations: GuestReservation[];
  nextCursor?: string | null;
};
export type Availability = {
  width: number;
  height: number;
  screens: { id: string; x: number; y: number }[];
  tables: {
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    shape: string;
    seats: number;
    available: boolean;
  }[];
  zones?: AvailabilityZone[];
  resources?: AvailabilityResource[];
};
export type AvailabilityResource = {
  id: string;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  code: string;
  name: string;
  resourceType: "table" | "private_room" | "bar_seating";
  capacity: number | null;
  status: "free" | "reserved" | "unavailable";
  available: boolean;
  bookable: boolean;
  fitsGuestCount: boolean;
  unavailableReason: string | null;
  layout: {
    version: number;
    x: number | null;
    y: number | null;
    width: number | null;
    height: number | null;
    shape: string | null;
    rotation: number | null;
    displayProperties: Record<string, unknown>;
  };
};
export type AvailabilityZone = {
  id: string;
  code: string;
  name: string;
  type: "main_hall" | "secondary_hall" | "vip" | "shared_hall" | "bar";
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  resources: AvailabilityResource[];
};
export type Quote = {
  id: string;
  expiresAt: string;
  lines: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
};
export class GuestApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function guestApi<T>(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api/guest/v1${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal,
    ...(body
      ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new GuestApiError(
      response.status,
      data.error?.code ?? "UNAVAILABLE",
      data.error?.message ?? "Сервис недоступен",
    );
  return data as T;
}
export const statusLabel: Record<string, string> = {
  expected: "Заявка · ожидает подтверждения",
  confirmed: "Подтверждена",
  arrived: "Гость прибыл",
  cancelled: "Отменена",
  no_show: "Не состоялась",
};
export const venueDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Almaty",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
