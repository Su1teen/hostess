/**
 * Универсальная модель цифровой очереди (Task 6).
 * Одна и та же структура применима к ресторанам, клиникам, автомойкам и т.д.
 */
export type WaitlistStatus = "waiting" | "ready" | "claimed";

export type WaitlistEntry = {
  id: string;
  entityId: string;
  entityName: string;
  /** Тип заведения — "Ресторан", "Автомойка", "Клиника" … (generic prop). */
  entityKind: string;
  cover?: string;
  /** Детализация ресурса, напр. "Столик на 4" или "Бокс 3". */
  resource?: string;
  status: WaitlistStatus;
  /** Текущая позиция в очереди (#). */
  position: number;
  initialPosition: number;
  /** Оставшееся ориентировочное время, сек. */
  etaSec: number;
  joinedAt: number;
  /** Когда истекает 5-минутное окно на подтверждение (timestamp, ms). */
  claimDeadline?: number;
};

/** Параметры для входа в очередь. */
export type JoinWaitlistInput = {
  entityId: string;
  entityName: string;
  entityKind: string;
  cover?: string;
  resource?: string;
  /** Сколько человек перед вами. */
  peopleAhead: number;
  /** Ориентировочное время ожидания, мин. */
  etaMin: number;
};
