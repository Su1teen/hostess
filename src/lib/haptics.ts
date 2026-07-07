/**
 * Тактильная отдача (haptics). Всегда проверяем поддержку перед вызовом
 * navigator.vibrate — на iOS Safari и десктопах его нет, и вызов молча
 * игнорируется, но проверка защищает от исключений в старых движках.
 */
export function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/**
 * Универсальная обёртка. Принимает длительность (ms) или паттерн.
 * Тихо ничего не делает, если вибрация не поддерживается.
 */
export function haptic(pattern: number | number[] = 10): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* некоторые движки бросают SecurityError без user-gesture — игнорируем */
  }
}

/** Лёгкий «тик» — для смены активного элемента в барабане/карусели. */
export const hapticTick = () => haptic(10);

/** Средний отклик — выбор / подтверждение. */
export const hapticSelect = () => haptic(18);

/** Успех — двойной короткий импульс. */
export const hapticSuccess = () => haptic([14, 40, 24]);

/** Тревога — для «освободился слот» / срочных уведомлений. */
export const hapticAlert = () => haptic([30, 60, 30, 60, 30]);
